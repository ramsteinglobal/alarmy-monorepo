#!/usr/bin/env node
/**
 * Shared Android APK build script — single source of truth for local dev
 * (Windows / macOS / Linux) and GitHub Actions.
 *
 * Local usage (from repo root):
 *   npm run android:build:debug          # fast arm64-only debug APK (same as CI)
 *   npm run android:build:debug:all      # debug APK for all ABIs
 *   npm run android:build:release        # release APK (arm64-only)
 *   npm run android:build:release:all    # release APK for all ABIs
 *   npm run android:clean                # gradle clean only
 *   npm run android:deploy:debug         # build + reinstall on attached device
 *
 * Direct usage:
 *   node scripts/build-apk.mjs --mode=debug [--arch=arm64-v8a|all] [--no-clean] [--dry-run]
 *   node scripts/build-apk.mjs --mode=release [--arch=all]
 *   node scripts/build-apk.mjs --clean-only
 *   node scripts/build-apk.mjs --help
 *
 * Env overrides (CI sets these instead of CLI flags):
 *   APK_MODE       = debug | release          (default: debug)
 *   APK_ARCH       = arm64-v8a | all | <csv>  (default: arm64-v8a)
 *   APK_NO_CLEAN   = 1 to skip the clean step (default: always clean,
 *                    like CI's fresh runner — stale Gradle outputs are the
 *                    #1 cause of "works on GitHub, broken locally")
 *   APK_SKIP_DEPS_CHECK = 1 to skip the node_modules freshness check
 *
 * Why this file exists: package.json used `cd android && ./gradlew ...`
 * which breaks on Windows (needs gradlew.bat) and drifted from the
 * workflow file (different flags/arch). Both local npm scripts and
 * .github/workflows/android-apk.yml now call THIS script, so the command,
 * flags, architecture and APK verification are identical everywhere.
 *
 * Why the freshness checks exist: GitHub builds from a clean checkout with
 * a fresh `npm ci` every time. Local builds reuse node_modules/ and the
 * Gradle cache, so after `git pull` the phone ends up with an APK whose
 * native code (e.g. Notifee) does not match the JS Metro serves — producing
 * "native module not found" or missing-bundle red screens. This script
 * fails fast with a fix-it message instead of producing a broken APK.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync, chmodSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Launching gradlew.bat requires shell:true on Windows, which makes Node
// print a cosmetic DEP0190 warning — silence it so build output stays clean.
process.noDeprecation = true;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID_DIR = path.join(REPO_ROOT, 'android');
const IS_WINDOWS = process.platform === 'win32';

const DEFAULT_ARCH = 'arm64-v8a'; // matches physical test phones + CI fast path

function printHelp() {
  console.log(`
Wakely shared APK builder (local == CI)

Usage:
  node scripts/build-apk.mjs [options]

Options:
  --mode=debug|release   Which build type (default: $APK_MODE or debug)
  --debug / --release    Shorthand for --mode
  --arch=<arch|all>      ABI filter passed as -PreactNativeArchitectures
                         (default: $APK_ARCH or "${DEFAULT_ARCH}").
                         Use "all" to honour android/gradle.properties
                         (armeabi-v7a,arm64-v8a,x86,x86_64).
  --clean / --no-clean   Run (default) or skip the "clean" step.
                         Default is clean, like CI's fresh runner.
  --clean-only           Only run "clean", then exit
  --skip-deps-check      Skip the node_modules freshness check
  --dry-run              Print the gradle command without executing it
  --daemon               Use the Gradle daemon (default is --no-daemon,
                         same as CI, for reproducible logs)
  --help, -h             Show this help

Env:
  APK_MODE, APK_ARCH, APK_NO_CLEAN=1, APK_SKIP_DEPS_CHECK=1

Examples:
  node scripts/build-apk.mjs --mode=debug
  node scripts/build-apk.mjs --mode=debug --arch=all --no-clean
  node scripts/build-apk.mjs --release --arch=all
  APK_MODE=release APK_ARCH=all node scripts/build-apk.mjs
`);
}

function parseArgs(argv) {
  const opts = {
    mode: process.env.APK_MODE || 'debug',
    arch: process.env.APK_ARCH || process.env.REACT_NATIVE_ARCHITECTURES || DEFAULT_ARCH,
    // CI runners are always clean; default to clean locally too so a stale
    // Gradle cache can never produce an APK that GitHub wouldn't produce.
    clean: process.env.APK_NO_CLEAN !== '1',
    cleanOnly: false,
    skipDepsCheck: process.env.APK_SKIP_DEPS_CHECK === '1',
    dryRun: false,
    noDaemon: true,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--debug') opts.mode = 'debug';
    else if (arg === '--release') opts.mode = 'release';
    else if (arg.startsWith('--mode=')) opts.mode = arg.slice('--mode='.length);
    else if (arg === '--clean') opts.clean = true;
    else if (arg === '--no-clean') opts.clean = false;
    else if (arg === '--clean-only') opts.cleanOnly = true;
    else if (arg === '--skip-deps-check') opts.skipDepsCheck = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--daemon') opts.noDaemon = false;
    else if (arg === '--no-daemon') opts.noDaemon = true;
    else if (arg.startsWith('--arch=')) opts.arch = arg.slice('--arch='.length);
    else if (arg === 'debug' || arg === 'release') opts.mode = arg;
    else if (arg === 'clean') opts.cleanOnly = true;
    else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(2);
    }
  }

  opts.mode = String(opts.mode).toLowerCase();
  if (!['debug', 'release'].includes(opts.mode)) {
    console.error(`Invalid --mode="${opts.mode}". Expected debug or release.`);
    process.exit(2);
  }
  opts.arch = String(opts.arch).trim();
  if (opts.arch.toLowerCase() === 'all' || opts.arch === '') opts.arch = 'all';

  return opts;
}

function gradleCommand() {
  // On Windows the wrapper must be launched via gradlew.bat; on POSIX via ./gradlew.
  return IS_WINDOWS
    ? path.join(ANDROID_DIR, 'gradlew.bat')
    : path.join(ANDROID_DIR, 'gradlew');
}

function expectedApk(mode) {
  if (mode === 'debug') {
    return path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  }
  // AGP 8+ emits app-release.apk; older templates emitted app-release-unsigned.apk.
  // Accept either — the build script reports whichever exists.
  const modern = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const legacy = path.join(
    ANDROID_DIR,
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release-unsigned.apk',
  );
  if (existsSync(modern) || !existsSync(legacy)) return modern;
  return legacy;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Fail fast when node_modules is missing, older than package-lock.json
 * (typical after `git pull`), or missing packages — including native ones
 * like @notifee/react-native whose android/ sources are compiled into the
 * APK. CI never hits this because it runs a fresh `npm ci` every time;
 * locally it is the #1 cause of "GitHub passes, my build fails" and of
 * runtime "native module not found" red screens (old native code + new JS
 * from Metro).
 */
function checkDependenciesFresh() {
  const nodeModulesDir = path.join(REPO_ROOT, 'node_modules');
  const lockFile = path.join(REPO_ROOT, 'package-lock.json');

  if (!existsSync(nodeModulesDir)) {
    console.error('[build-apk] node_modules/ is missing.');
    console.error('[build-apk] fix: run `npm ci` from the repo root, then rebuild.');
    process.exit(1);
  }

  try {
    const lockMtime = statSync(lockFile).mtimeMs;
    const modulesMtime = statSync(nodeModulesDir).mtimeMs;
    if (lockMtime > modulesMtime) {
      console.error('[build-apk] package-lock.json is NEWER than node_modules/.');
      console.error('[build-apk] Your dependencies are stale (likely after `git pull`).');
      console.error('[build-apk] fix: run `npm ci` from the repo root, then rebuild.');
      console.error('[build-apk] (bypass with --skip-deps-check, not recommended)');
      process.exit(1);
    }
  } catch {
    // If mtimes are unreadable, fall through to the per-package check below.
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  } catch {
    console.error('[build-apk] Could not read package.json.');
    process.exit(1);
  }
  const missing = Object.keys(pkg.dependencies ?? {}).filter(
    (name) => !existsSync(path.join(nodeModulesDir, name, 'package.json')),
  );
  if (missing.length > 0) {
    console.error(`[build-apk] ${missing.length} dependenc(ies) missing from node_modules/:`);
    for (const name of missing) console.error(`[build-apk]   - ${name}`);
    console.error('[build-apk] fix: run `npm ci` from the repo root, then rebuild.');
    console.error('[build-apk] (bypass with --skip-deps-check, not recommended)');
    process.exit(1);
  }
}

function printNextSteps(mode, apkRelPath) {
  console.log('');
  if (mode === 'debug') {
    // Debug APKs load JS from Metro — without these steps the app shows the
    // "index.android.bundle / Metro" red screen. An old APK on the phone plus
    // new JS from Metro shows "native module not found" (e.g. Notifee).
    console.log('[build-apk] NEXT STEPS (debug APK loads JS from Metro):');
    console.log(`[build-apk]   1. Reinstall (the phone MUST NOT keep an old APK):`);
    console.log(`[build-apk]        adb install -r ${apkRelPath}`);
    console.log('[build-apk]      or: npm run android:deploy:debug   (build + reinstall)');
    console.log('[build-apk]   2. Start Metro and leave it running:  npm run android:dev');
    console.log('[build-apk]   3. Bridge the phone to Metro:         adb reverse tcp:8081 tcp:8081');
  } else {
    console.log('[build-apk] NEXT STEPS (release APK runs standalone, no Metro needed):');
    console.log(`[build-apk]   1. Install:  adb install -r ${apkRelPath}`);
    console.log('[build-apk]      (unsigned build — fine for device testing, not for stores)');
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const gradleBin = gradleCommand();
  if (!existsSync(gradleBin)) {
    console.error(`Gradle wrapper not found at ${gradleBin}`);
    process.exit(1);
  }
  // Git checkouts on Windows often lose the +x bit; CI checks out fresh too.
  if (!IS_WINDOWS) {
    try {
      chmodSync(gradleBin, 0o755);
    } catch {
      // Non-fatal — spawn will surface a real permission error.
    }
  }

  if (!existsSync(path.join(REPO_ROOT, 'node_modules'))) {
    console.warn('WARNING: node_modules/ is missing. Run `npm ci` first — the Android build needs it.');
  }

  if (!opts.skipDepsCheck && !opts.cleanOnly) {
    checkDependenciesFresh();
  } else if (opts.skipDepsCheck) {
    console.log('[build-apk] --skip-deps-check: skipping node_modules freshness check.');
  }

  const assembleTask = opts.mode === 'debug' ? 'assembleDebug' : 'assembleRelease';

  const buildArgs = [];
  if (opts.clean || opts.cleanOnly) buildArgs.push('clean');
  if (!opts.cleanOnly) buildArgs.push(assembleTask);
  if (opts.noDaemon) buildArgs.push('--no-daemon');
  buildArgs.push('--stacktrace');
  if (!opts.cleanOnly && opts.arch !== 'all') {
    buildArgs.push(`-PreactNativeArchitectures=${opts.arch}`);
  }

  const displayCmd = `${IS_WINDOWS ? 'gradlew.bat' : './gradlew'} ${buildArgs.join(' ')}`;
  console.log(
    `[build-apk] mode=${opts.mode} arch=${opts.arch} clean=${opts.clean || opts.cleanOnly ? 'yes' : 'no'} cwd=android`,
  );
  console.log(`[build-apk] ${displayCmd}`);

  if (opts.dryRun) {
    console.log('[build-apk] --dry-run: not executing Gradle.');
    console.log(`[build-apk] expected output: ${expectedApk(opts.mode)}`);
    process.exit(0);
  }

  const result = spawnSync(gradleBin, buildArgs, {
    cwd: ANDROID_DIR,
    stdio: 'inherit',
    shell: IS_WINDOWS, // required to launch .bat from Node on Windows
  });

  if (result.error) {
    console.error(`[build-apk] failed to launch Gradle: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[build-apk] Gradle exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }

  if (opts.cleanOnly) {
    console.log('[build-apk] clean finished.');
    process.exit(0);
  }

  // Verify the APK exists and is non-empty — same check runs locally and in CI.
  const apkPath = expectedApk(opts.mode);
  const legacyFallback = path.join(
    ANDROID_DIR,
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release-unsigned.apk',
  );
  const candidates = opts.mode === 'release' ? [apkPath, legacyFallback] : [apkPath];
  const found = candidates.find((p) => existsSync(p));

  if (!found) {
    console.error(`[build-apk] BUILD reported success but no APK was found.`);
    console.error(`[build-apk] looked for: ${candidates.join(', ')}`);
    process.exit(1);
  }
  let size = 0;
  try {
    size = statSync(found).size;
  } catch {
    size = 0;
  }
  if (size === 0) {
    console.error(`[build-apk] APK exists but is empty: ${found}`);
    process.exit(1);
  }

  const rel = path.relative(REPO_ROOT, found);
  console.log(`[build-apk] BUILD SUCCESSFUL → ${rel} (${formatBytes(size)})`);
  printNextSteps(opts.mode, rel);
}

main();
