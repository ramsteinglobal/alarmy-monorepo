# Alarmy

## Quickstart

Requires Node.js 22.11.0 or later and a configured React Native development
environment.

```bash
git clone https://github.com/ramsteinglobal/alarmy-monorepo.git
cd alarmy-monorepo
npm ci
npm run android
```

For iOS, run `npm run ios` on macOS with Xcode installed.

For the complete Android setup, build commands, Codespaces workflow, and honest
laptop/emulator guidance, see the full guide: [Android development guide](docs/ANDROID_DEVELOPMENT_GUIDE.md).

## Build and download an Android APK without Android Studio

You do not need Android Studio or the Android SDK installed on your laptop.
Open this repository in GitHub Codespaces (`Code` → `Codespaces` → `Create
codespace on main`) and wait for the dev container setup to finish. It installs
the Android build tools and Java, and runs `npm ci` automatically.

From the repository root, build the debug APK:

```bash
npm run android:build:debug
```

The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.
Download it from the Codespaces file explorer to install it on an Android
device. An APK does not run natively on a laptop; running the app on a laptop
requires an Android emulator.

## Additional commands

```bash
npm run start
npm run android:build:debug
npm run android:build:release
npm run android:install:debug
npm run android:launch
npm run lint
npm run typecheck
```
