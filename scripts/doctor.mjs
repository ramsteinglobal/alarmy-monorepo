#!/usr/bin/env node
/**
 * Local environment doctor — diagnoses "GitHub passes but local fails".
 *
 * Usage:
 *   npm run doctor
 *   node scripts/doctor.mjs
 *
 * Checks (each prints ok / warn / FAIL with a fix):
 *   - Node.js version matches engines (>=22.11.0, same as CI)
 *   - Java 17 available (same as CI)
 *   - ANDROID_HOME / Android SDK + platform-tools (adb) present
 *   - adb sees a device (needed for install / adb reverse / Metro bridge)
 *   - node_modules exists, is newer than package-lock.json, and contains
 *     every dependency (stale installs cause build failures and
 *     "native module not found" red screens, e.g. Notifee)
 *   - Gradle wrapper present (gradlew / gradlew.bat)
 *
 * Exit code is 0 when there are no FAILs, 1 otherwise. Warnings never fail.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';

let failures = 0;

function ok(label, detail = '') {
  console.log(`  ok   ${label}${detail ? ` — ${detail}` : ''}`);
}
function warn(label, fix = '') {
  console.log(`  warn ${label}${fix ? ` — fix: ${fix}` : ''}`);
}
function fail(label, fix = '') {
  failures += 1;
  console.log(`  FAIL ${label}${fix ? ` — fix: ${fix}` : ''}`);
}
function section(title) {
  console.log(`\n[${title}]`);
}

function run(cmd, args) {
  // shell:false — all targets here are real executables (.exe on Windows),
  // and passing args with shell:true triggers a Node DEP0190 warning.
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: false });
  return { status: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim(), error: r.error };
}

section('node (CI uses 22)');
{
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 22) ok(`node ${process.version}`);
  else fail(`node ${process.version} is too old`, 'install Node 22+ (see .nvmrc)');
}

section('java (CI uses Temurin 17)');
{
  const r = run('java', ['-version']);
  const firstLine = r.out.split('\n')[0] ?? '';
  const m = firstLine.match(/version "([^"]+)"/);
  const major = m ? Number(m[1].split('.')[0]) : NaN;
  if (!m) fail('java not found on PATH', 'install Java 17 and set JAVA_HOME');
  else if (major === 17) ok(`java ${m[1]}`, firstLine);
  else if (major === 21) warn(`java ${m[1]} (project targets 17)`, 'install Java 17 for exact CI parity');
  else fail(`java ${m[1]} (project needs 17)`, 'install Java 17 and set JAVA_HOME');
}

section('android sdk + adb');
{
  const home = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!home) fail('ANDROID_HOME is not set', 'set ANDROID_HOME to your SDK location');
  else if (!existsSync(home)) fail(`ANDROID_HOME points nowhere: ${home}`, 'install the SDK / fix the path');
  else ok(`ANDROID_HOME=${home}`);

  const adb = home ? path.join(home, 'platform-tools', IS_WINDOWS ? 'adb.exe' : 'adb') : null;
  if (adb && existsSync(adb)) {
    ok('platform-tools/adb present');
    const r = run(adb, ['devices']);
    if (r.status !== 0) {
      warn('`adb devices` failed', 'reconnect the phone, accept the USB debugging prompt');
    } else {
      const lines = r.out
        .split('\n')
        .slice(1)
        .map((l) => l.trim())
        .filter(Boolean);
      const ready = lines.filter((l) => l.endsWith('\tdevice') || l.endsWith(' device'));
      if (ready.length > 0) ok(`${ready.length} device(s) connected`, ready.join(', '));
      else warn('no devices visible to adb', 'connect phone, enable USB debugging, accept prompt');
    }
  } else {
    const r = run(IS_WINDOWS ? 'adb.exe' : 'adb', ['--version']);
    if (r.status === 0) warn('adb on PATH but not under ANDROID_HOME (mixed installs?)', 'prefer the SDK platform-tools');
    else fail('adb not found', 'install Android SDK platform-tools');
  }
}

section('node_modules freshness (stale = local-only failures)');
{
  const nm = path.join(REPO_ROOT, 'node_modules');
  const lock = path.join(REPO_ROOT, 'package-lock.json');
  if (!existsSync(nm)) {
    fail('node_modules/ missing', 'run `npm ci`');
  } else {
    try {
      if (statSync(lock).mtimeMs > statSync(nm).mtimeMs) {
        fail('package-lock.json is newer than node_modules/ (stale after git pull?)', 'run `npm ci`');
      } else {
        ok('node_modules/ newer than package-lock.json');
      }
    } catch {
      warn('could not compare mtimes', 'run `npm ci` if builds behave oddly');
    }
    try {
      const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
      const nativeLibs = ['@notifee/react-native', 'react-native-screens', 'react-native-sensors'];
      const missing = Object.keys(pkg.dependencies ?? {}).filter(
        (n) => !existsSync(path.join(nm, n, 'package.json')),
      );
      if (missing.length > 0) fail(`missing packages: ${missing.join(', ')}`, 'run `npm ci`');
      else ok('all package.json dependencies installed');
      const missingNative = nativeLibs.filter((n) => !existsSync(path.join(nm, n, 'android')));
      if (missingNative.length > 0) {
        fail(`native android/ sources missing for: ${missingNative.join(', ')}`, 'run `npm ci` (partial install?)');
      } else {
        ok('native android/ sources present (notifee, screens, sensors)');
      }
    } catch {
      warn('could not read package.json');
    }
  }
}

section('gradle wrapper');
{
  const bin = path.join(REPO_ROOT, 'android', IS_WINDOWS ? 'gradlew.bat' : 'gradlew');
  if (existsSync(bin)) ok(path.basename(bin));
  else fail(`missing ${bin}`, 'restore it from git: git checkout -- android/gradlew android/gradlew.bat');
}

console.log('');
if (failures > 0) {
  console.log(`doctor: ${failures} FAIL(s) — fix them, then run \`npm run android:build:debug\`.`);
  process.exit(1);
}
console.log('doctor: all critical checks passed. If the app still red-screens, see');
console.log('docs/ANDROID_DEVELOPMENT_GUIDE.md “Red-screen troubleshooting”.');
