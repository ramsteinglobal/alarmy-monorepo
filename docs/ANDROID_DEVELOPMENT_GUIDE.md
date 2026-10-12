# Alarmy Android: build, install, and test

This guide shows teammates how to keep the Android build and Metro running in
GitHub Codespaces while using a physical Android phone for live testing. The
laptop only needs VS Code Desktop and the small Android Platform Tools package
(`adb`); it does not need Node.js, Java, Gradle, or the full Android SDK.

## Choose how you want to test

| Goal                                             | Recommended route                                                                                    | What you need                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Code in Codespaces and see JS changes on a phone | Open the Codespace in VS Code Desktop, forward Metro privately, and use local `adb reverse` over USB | GitHub access, Codespaces, VS Code Desktop, Android phone, small local `adb` tools |
| Install and try the app without live updates     | Build APK in Codespaces; download and install it on a phone                                          | GitHub access, Codespaces, Android phone                                           |
| Get an APK without building yourself             | Download the APK artifact from a successful GitHub Actions run                                       | GitHub access, Android phone                                                       |
| Test using a browser-based emulator              | Use an externally provided cloud device service                                                      | A vendor account/service; availability and cost vary                               |

An APK is an Android install package. It does not run in a normal laptop browser.

## Project requirements

These versions come from the current project configuration:

- React Native `0.87.1`
- Node.js `22.11.0` or newer
- Java 17
- Android compile SDK 37, target SDK 36, minimum SDK 24
- Android build tools `37.0.0`
- Android NDK `27.1.12297006`
- Android application ID: `com.alarmyapp`

The Android project and Gradle wrapper are in `android/`. A first native build
can take many minutes because Gradle downloads and compiles native dependencies.
Subsequent builds are usually faster.

## Recommended daily route: Codespaces + VS Code Desktop + phone

This setup keeps source editing, Metro, and Android builds on the Codespace.
VS Code Desktop securely forwards Metro's private port to localhost on the
laptop; `adb reverse` then lets the phone reach that local forwarded port over
USB. The port is private and does not need to be made public.

### When several teammates want to test

Give each tester their **own Codespace**, opened in VS Code Desktop, and their
own USB-connected phone. Each Codespace has its own private Metro server and
private port forward. Everyone can install the same debug APK once, but each
phone should connect only to the Metro server in that tester's own Codespace.

1. A maintainer builds one debug APK from the commit the team wants to test and
   makes it available as the private GitHub Actions `alarmy-debug-apk` artifact
   (or shares the APK through another team-approved private channel). Testers
   download and install it once. The APK must come from a trusted team build.
2. Each tester opens their own Codespace on that same commit or branch in VS
   Code Desktop. Do not all edit or run Metro in one shared Codespace.
3. Each tester connects their own phone to their own laptop, installs Android
   Platform Tools locally, authorizes USB debugging, and confirms `adb devices`
   shows their phone as `device`.
4. Each tester starts Metro in their own Codespace with `npm run android:dev`,
   confirms their own forwarded port 8081 is **Private**, and runs
   `adb reverse tcp:8081 tcp:8081` in their own laptop terminal.
5. Each tester opens/reloads the already-installed app. Their phone receives
   JS/TS updates from that tester's Codespace as they code.

Each tester's Codespace has separate compute and storage usage, so five or six
simultaneous testers use five or six Codespaces. Stop Codespaces when they are
not in use to avoid consuming unnecessary hours. Do not expose Metro as a
**Public** port for teammates: Metro is a development server, not an
authenticated shared test service. Organization port sharing availability
also depends on the GitHub organization plan and policy.

### 1. Open the Codespace in VS Code Desktop

1. Open `ramsteinglobal/alarmy-monorepo` on GitHub.
2. Select **Code → Codespaces** and create or resume a Codespace on `main`.
3. Choose **Open in Visual Studio Code** (the desktop app), and accept the
   prompt to open VS Code if asked. Sign in to VS Code with the same GitHub
   account.
4. Wait for the dev container setup to complete.
5. In VS Code, open the **Ports** panel. Port `8081` should appear as
   **Metro (React Native)** with **Private** visibility. The dev container
   forwards it automatically. Do not change it to Public.

Because this setup adds a forwarded-port setting, rebuild an existing Codespace
once after the change is merged: open the VS Code Command Palette and run
**Codespaces: Rebuild Container**. New Codespaces get the setting automatically.

> This local-ADB bridge requires VS Code Desktop so the private Codespaces port
> is also available on the laptop as a local TCP port. Opening the Codespace
> only in a browser does not create that localhost TCP endpoint. Browser-only
> Codespaces can still build APKs, but use the manual install workflow below.

If setup fails, use **Codespaces: Rebuild Container** from the VS Code Command
Palette, or ask a repository maintainer to check the setup output.

### 2. Install the small local phone bridge

Install Google's Android **SDK Platform Tools** on the laptop; this package
contains `adb` and is much smaller than the Android SDK or Android Studio. Do
not install Node.js, Java, Gradle, or Android build platforms on the laptop for
this workflow. Add the Platform Tools folder to the laptop's PATH so `adb` is
available in a local terminal.

On Windows, the phone may also require its manufacturer's USB driver. macOS
usually needs no extra driver; on Linux, the user may need Android `udev`
permissions.

### 3. Connect the phone to local ADB

On the phone, enable **Developer options → USB debugging**, connect it to the
laptop with a data-capable USB cable, unlock it, and approve the debugging
prompt. In a terminal running on the laptop (not the remote Codespace
terminal), check:

```sh
adb devices
```

The phone must appear with status `device`. If it says `unauthorized`, accept
the prompt on the phone. Keep this local laptop terminal available for the
`adb reverse` command in step 5.

### 4. Install the debug app once

In the Codespace's remote terminal, run:

```bash
npm run android:build:debug
```

Wait for `BUILD SUCCESSFUL`. In the Codespaces Explorer, find
`android/app/build/outputs/apk/debug/app-debug.apk`, download it once to the
laptop, transfer it to the phone, and install it. Allow installation from the
file source when Android prompts you. Keep this debug app installed for daily
coding; do not run `npm run android` in the Codespace, because that tries to
install via remote `adb` and the phone is connected to the laptop instead.

### 5. Start Metro and bridge the phone to it

In a remote Codespaces terminal, start Metro and leave it running:

```bash
npm run android:dev
```

Confirm the VS Code **Ports** panel shows remote port `8081` forwarded and
private. In the laptop's local terminal, run:

```sh
adb reverse tcp:8081 tcp:8081
adb reverse --list
```

This forwards the phone's localhost port 8081 over USB to laptop localhost
8081; VS Code Desktop forwards that local port securely to Metro in the
Codespace. If VS Code shows a different **local** forwarded port because 8081
is already in use, replace the second `8081` with that local port, for example
`adb reverse tcp:8081 tcp:8082`.

Open AlarmyApp on the phone, open the React Native Dev Menu (shake the phone),
and choose **Reload** if it does not load the Metro bundle automatically. Keep
Metro running. Enable **Fast Refresh** from the Dev Menu; saved JavaScript and
TypeScript changes will then appear on the phone without rebuilding or
transferring another APK.

Run `adb reverse tcp:8081 tcp:8081` again after unplugging/reconnecting the
phone, restarting ADB, or starting a new Codespace session.

### 6. Daily coding loop and when a rebuild is needed

1. Resume the same Codespace in VS Code Desktop.
2. Start Metro with `npm run android:dev`.
3. Connect/unlock the phone and run the local `adb reverse` command if needed.
4. Edit and save code in the Codespace. Fast Refresh updates JS/TS changes on
   the installed phone app.

You do **not** need a new APK for ordinary JavaScript/TypeScript changes.
Rebuild and reinstall the debug APK for Kotlin/Java/C++ code, Android
manifest/Gradle changes, native dependency changes, or when the debug app itself
needs updating. An APK contains native code and is not the live JavaScript
server.

The Metro port is private to the Codespace owner by default; do not make it
public. A phone connected through USB uses the laptop's local ADB bridge, not
public Codespaces port access.

## Fallback: APK install without live updates

If using Codespaces in a browser, not VS Code Desktop, you can still build and
install the APK on your phone. Run `npm run android:build:debug`, then download
`android/app/build/outputs/apk/debug/app-debug.apk` from the Codespaces
Explorer and install it on the phone. Repeat the build/download/install only
when you need a new native APK; this fallback does not provide per-change Fast
Refresh.

You can also download the APK from a successful GitHub Actions run: open the
repository's **Actions** tab, select the **Android APK Build** run, then
download the `alarmy-debug-apk` artifact.

This project sets minimum Android API 24 (Android 7.0). Login and cloud-backed
features may require Firebase services and valid test credentials; use
team-approved test accounts and do not put passwords or secrets in source
control or chat.

## Commands teammates may need

Run these from the repository root:

| Command                                       | Purpose                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `npm ci`                                      | Install JavaScript dependencies from the committed lockfile                |
| `npm run start`                               | Start Metro                                                                |
| `npm run android:build:debug`                 | Build an installable development APK without trying to connect to a device |
| `npm run android`                             | Build, install, and launch on a device/emulator visible to `adb`           |
| `npm run android:install:debug`               | Install an already-built debug APK using visible `adb`                     |
| `npm run android:launch`                      | Launch the installed app using visible `adb`                               |
| `npm run android:build:release`               | Build an unsigned release APK; not ready for production distribution       |
| `npm run lint`                                | Run ESLint                                                                 |
| `npm run typecheck`                           | Run the TypeScript check                                                   |
| `npm test -- --passWithNoTests --watch=false` | Run Jest tests once                                                        |

The release build output is
`android/app/build/outputs/apk/release/app-release-unsigned.apk`. It is
intentionally unsigned. Production distribution needs an approved signing key
and secure signing configuration; never use or share a debug key as a
production key.

## What the automated APK workflow does

The **Android APK Build** workflow runs for pull requests, pushes to `main`,
and manual dispatch. It installs dependencies, runs lint, typecheck, and Jest,
builds a debug APK, checks that it exists and is non-empty, and uploads the
`alarmy-debug-apk` artifact. It does not require production signing credentials
and does not launch the APK on an emulator.

To find an artifact, open the repository's **Actions** tab, select a successful
workflow run, and download the artifact before its retention period expires.

## Emulator and browser testing

There is no built-in interactive Android emulator in this repository or
Codespaces setup. A browser-accessible Android emulator needs separate
infrastructure, such as a cloud device-testing service. Such services may
require an external account, configuration, network access, and payment.

A local emulator can be installed without the full Android Studio IDE using
Android command-line tools, the emulator package, and an Android system image.
It still requires substantial downloads and disk space (often tens of GB),
adequate memory, and hardware virtualization. On laptops with limited
virtualization support, a physical phone is often simpler.

## Troubleshooting

### `BUILD SUCCESSFUL`, then `No connected devices`

The APK was built, but `npm run android` could not install it because `adb`
cannot see a device. Either connect/authorize a phone or start an emulator, or
build with `npm run android:build:debug` and install the APK manually.

### The first build takes a long time

Gradle downloads dependencies and compiles native code on the first build.
Messages about a slow copy or a task marked `IDLE` do not necessarily mean it
has failed. Wait for `BUILD SUCCESSFUL` or an explicit `BUILD FAILED`.

### `adb devices` shows `unauthorized` or no device

Unlock the phone and accept its USB debugging prompt. Try a data-capable USB
cable and reconnect. If using a local emulator, make sure it is running.

### APK installation is blocked

Confirm the file downloaded completely, then enable install permission for the
specific file manager/browser Android names in its warning. Only install APKs
from a source you trust.

### Sign-in or cloud-backed features do not work

Confirm network connectivity and use a team-approved test account. Contact a
maintainer if the development Firebase project, sign-in provider, or test
account is unavailable; never add private credentials to the repository.

## Security reminders

- Never commit APKs, `.env` files, signing keys, or signing passwords.
- Do not distribute debug APKs as production releases.
- Allow APK installation only from sources you trust.
- Use approved test accounts and do not place real user data in test runs.
