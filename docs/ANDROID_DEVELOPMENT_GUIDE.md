# Alarmy Android: build, install, and test

This is the step-by-step Android guide for Alarmy teammates. The recommended
beginner workflow is to build the APK in GitHub Codespaces, download it, and
install it on a physical Android phone. Codespaces does not automatically
connect a phone or provide an interactive emulator.

## Choose how you want to test

| Goal | Recommended route | What you need |
| --- | --- | --- |
| Install and try the app | Build APK in Codespaces; download and install it on a phone | GitHub access, Codespaces, Android phone |
| Get an APK without building yourself | Download the APK artifact from a successful GitHub Actions run | GitHub access, Android phone |
| See JavaScript changes without rebuilding each time | Run Metro and the Android app with a locally connected device or emulator | Computer with Android SDK/platform-tools and a device or emulator |
| Test using a browser-based emulator | Use an externally provided cloud device service | A vendor account/service; availability and cost vary |

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

## Recommended beginner route: Codespaces APK + phone

### 1. Open a Codespace

1. Open `ramsteinglobal/alarmy-monorepo` on GitHub.
2. Select **Code → Codespaces → Create codespace on main**.
3. Wait for the container setup to finish. It installs the JavaScript
   dependencies and the Android SDK components required by this project.
4. Open a Codespaces terminal. The prompt should be in the repository root,
   `alarmy-monorepo`.

If setup fails, use **Codespaces: Rebuild Container** from the VS Code Command
Palette, or ask a repository maintainer to check the setup output.

### 2. Build a debug APK

From the repository root, run:

```bash
npm run android:build:debug
```

Wait for `BUILD SUCCESSFUL`. This builds the app; it does not install or launch
it. The generated APK is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

You can check it exists and is non-empty with:

```bash
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK may be large because it includes native libraries for multiple
Android processor architectures.

### 3. Download the APK from Codespaces

In the Codespaces Explorer, navigate to
`android/app/build/outputs/apk/debug/app-debug.apk`. Right-click the file and
select **Download**. Save it somewhere you can find on your laptop, then
transfer it to your phone using USB file transfer or another trusted method.

Alternatively, download it from GitHub Actions: open a successful
**Android APK Build** workflow run in the repository's **Actions** tab, find
the `alarmy-debug-apk` artifact, and download it. Extract the downloaded
artifact to get `app-debug.apk`.

### 4. Install and open it on your phone

1. On your Android phone, open the transferred `app-debug.apk`.
2. If Android asks, allow your file manager or browser to install unknown apps.
   Only allow this for the source you used to transfer the APK; you can turn
   the permission off again after installation.
3. Confirm **Install**, then open **AlarmyApp** from the launcher.
4. Try the screens and flows relevant to your change. Check the behavior on the
   phone itself, not just whether installation succeeded.

This project sets minimum Android API 24 (Android 7.0). The app's login and
cloud-backed features may require Firebase services and valid test credentials;
use team-approved test accounts and do not put passwords or secrets in source
control or chat.

## Run with live JavaScript updates

Live development is different from downloading an APK. Metro serves JavaScript
to a debug app while you work. The `npm run android` command builds and then
tries to install the app on a device visible to `adb`.

### Local computer with a connected device or emulator

This is the standard live-development setup. It requires Android SDK tools on
your computer (Android Studio is one way to install them, but the full IDE is
not required), plus a USB-connected phone or a running local emulator.

1. Install the prerequisites listed above, including the required SDK platform,
   build tools, and NDK.
2. From the repository root, install dependencies:

   ```bash
   npm ci
   ```

3. On a physical phone, enable Developer options and USB debugging, connect it
   over USB, and approve the debugging prompt. Or start a local emulator.
4. Verify the device is visible:

   ```bash
   adb devices
   ```

   The device should show as `device`, not `unauthorized` or `offline`.
5. In the first terminal, start Metro:

   ```bash
   npm run start
   ```

6. In a second terminal, build, install, and launch:

   ```bash
   npm run android
   ```

Keep Metro running while using the app. Save JavaScript/TypeScript changes to
see them refresh in the debug app.

### Important Codespaces limitation

Running `npm run android` inside Codespaces does not automatically connect to a
phone plugged into your laptop. The `adb` command inside the Codespace can see
only devices configured and reachable from that remote environment. If there
is no connected device, Gradle may finish building and then fail at
`:app:installDebug` with **No connected devices**. That means installation
failed; it does not mean Metro or the APK build failed.

To test without setting up remote ADB, build the APK in Codespaces and install
it manually on the phone using the earlier steps. For live reload, use a local
development environment with the phone/device accessible to local `adb`.

## Commands teammates may need

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install JavaScript dependencies from the committed lockfile |
| `npm run start` | Start Metro |
| `npm run android:build:debug` | Build an installable development APK without trying to connect to a device |
| `npm run android` | Build, install, and launch on a device/emulator visible to `adb` |
| `npm run android:install:debug` | Install an already-built debug APK using visible `adb` |
| `npm run android:launch` | Launch the installed app using visible `adb` |
| `npm run android:build:release` | Build an unsigned release APK; not ready for production distribution |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript check |
| `npm test -- --passWithNoTests --watch=false` | Run Jest tests once |

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
