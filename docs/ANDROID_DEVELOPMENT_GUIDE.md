# Android development guide for Alarmy

This guide explains the supported Android workflow for the Alarmy monorepo. It is written for developers who want to build, test, and install the app without installing the full Android Studio IDE on every laptop.

## 1. What this project needs

The app is a React Native project configured with the following Android settings in the repository:

- Application ID: `com.alarmyapp`
- React Native: `0.87.1`
- Java: 17
- Android compile SDK: `37`
- Android target SDK: `36`
- Android minimum SDK: `24`
- Android build tools: `37.0.0`
- Android NDK: `27.1.12297006`
- Node.js: `22.11.0` or newer

The repository already contains the Gradle wrapper and the Android project under `android/`.

## 2. Recommended setup: GitHub Codespaces

The simplest, lowest-friction setup is to use GitHub Codespaces.

1. Open the repository in GitHub.
2. Click `Code` → `Codespaces` → `Create codespace on main`.
3. Wait for the dev container to finish setting up.
4. The setup script installs the Android SDK packages required by this project and runs `npm ci`.
5. Start Metro with `npm run start` when you want a local JS bundler.
6. Build the APK with `npm run android:build:debug`.

This avoids installing Android Studio or the full local Android SDK on your laptop.

## 3. Local development prerequisites

Supported environments:

- macOS 14+ with Xcode and Android command-line tools
- Ubuntu 22.04+ or Debian-based Linux with the Android SDK installed
- Windows 11 with WSL2 if you want a Unix-like build environment

Minimum requirements:

- Node.js 22.11.0 or later
- Java 17
- Android SDK command-line tools
- Android platform 37 and build-tools 37.0.0
- Android NDK 27.1.12297006
- A working emulator or a physical Android device

Use the repo's current versions from the configuration files instead of random newer SDKs unless the app is being intentionally upgraded.

## 4. Build and test commands from the repo root

These commands are intentionally kept at the repository root so the workflow is consistent for everyone.

```bash
npm ci
npm run start
npm run lint
npm run typecheck
npm test -- --passWithNoTests --watch=false
npm run android:build:debug
npm run android:build:release
npm run android:install:debug
npm run android:launch
```

The debug APK is emitted at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The release APK is emitted at:

```text
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

Release builds are intentionally unsigned unless you add a signing configuration. Do not commit any keystore, password, or `.env` file to the repository.

## 5. Device installation workflow

### Option A: Install on a physical Android phone

1. Build the APK in Codespaces or download it from a GitHub Actions artifact.
2. Copy the APK to the device.
3. On the phone, allow installation from unknown sources if required by the OS.
4. Open the APK and install it.
5. Launch the app and validate the flow.

If you use USB debugging, you need Android SDK platform-tools on the host machine and the phone's developer options enabled. This is a practical way to test the app, but it is not the same as running an emulator on a laptop.

### Option B: Install on a connected device from the command line

```bash
adb devices
npm run android:install:debug
npm run android:launch
```

If your device is not visible, make sure USB debugging is enabled and the phone is authorized via `adb`.

## 6. Honest emulator options

### Option A: Browser-accessible Android emulator

There is no free, built-in browser emulator in this repository or in GitHub Codespaces. Codespaces run in a remote container and do not grant a native interactive Android window in the browser by default. If a browser-accessible emulator is required, it must be provided by an external service such as Firebase Test Lab, a cloud device farm, Genymotion Cloud, or another vendor-provided remote emulator service.

Those services require:

- an account or subscription,
- external configuration,
- potentially a network policy and security review,
- a remote machine or VM that supports virtualization and device access.

This repo does not include such a service and does not assume one is free or preconfigured.

### Option B: Physical Android phone

This is the most practical testing path for many teams. It requires no full Android Studio install, and it works well with a debug APK built from Codespaces or GitHub Actions.

### Option C: Local emulator without Android Studio

A supported minimal setup is possible with only the Android command-line tools and the emulator package.

Typical requirements:

- 30–60 GB of free disk space for the SDK and system image
- CPU virtualization enabled (`VT-x`/`AMD-V`)
- Enough memory for a modern Android virtual device
- Android SDK command-line tools and system images for `android-37`

A minimal command-line setup usually includes the emulator plus the required system image and platform tools, not the full Android Studio IDE. This can work on macOS, Linux, or WSL2, but it still needs a machine capable of running virtualization.

## 7. Dev container details

The repository includes a dev container at `.devcontainer/devcontainer.json` and a setup script at `.devcontainer/setup-android.sh`.

The dev container is designed to:

- use Node.js 22,
- install Java 17,
- install the Android SDK packages the app needs,
- accept the Android SDK licenses,
- run `npm ci` automatically after setup.

The setup script fails with clear errors if the SDK is missing or the required packages were not installed.

## 8. GitHub Actions APK workflow

The repository includes a GitHub Actions workflow at `.github/workflows/android-apk.yml` to build the APK automatically on pull requests and pushes to `main`.

The workflow:

- installs the correct Node.js version,
- installs Java 17,
- installs the Android SDK packages the project requires,
- runs the repo's linting and type checks,
- builds the debug APK,
- verifies that the APK exists and is non-empty,
- uploads it as a workflow artifact.

This is designed for developer confidence, pull-request validation, and easy APK sharing without requiring production signing credentials for ordinary builds.

## 9. Important security notes

- Do not commit `*.jks`, `*.keystore`, `.env` files, or APKs to source control.
- Do not publish release credentials in workflow logs.
- Release signing should be handled with GitHub Actions secrets or an approved secure signing process when you are preparing a production-grade APK.
- Treat all APKs as build outputs, not source files.

## 10. Quick summary

The most practical path for this team is:

- use Codespaces for the initial Android build environment,
- use GitHub Actions for APK artifact generation,
- test on a physical Android device when possible,
- avoid promising a browser-based emulator that requires extra remote infrastructure.

If you need to do Android work on a laptop without Android Studio, the supported minimal route is a local CLI-only SDK installation with an emulator or a physical device; anything heavier than that needs a dedicated remote-device service.
