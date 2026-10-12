# Alarmy

## Android: build, install, and test

For live phone testing while keeping the build in Codespaces, open the
Codespace in **VS Code Desktop**, connect the phone to the laptop with USB, and
use the private Metro port forward plus the small local `adb` Platform Tools.
Install the debug APK once; JavaScript/TypeScript changes then refresh from
Metro without transferring another APK. The laptop does not need Node, Java,
Gradle, or the full Android SDK.

For an initial install or browser-only Codespaces, build the APK in the
Codespace:

```bash
npm run android:build:debug
```

In VS Code Desktop, forward private port `8082` and run
`npm run android:serve:apk` in another Codespaces terminal. From laptop
PowerShell, fetch and install the APK with `adb`; see the complete guide for
the exact commands. For daily JavaScript/TypeScript edits, use private Metro
port `8081` and Fast Refresh instead of reinstalling the APK.

See the [complete Android development guide](docs/ANDROID_DEVELOPMENT_GUIDE.md)
for the step-by-step Codespaces-to-phone live-reload setup, APK installation,
CI artifacts, tests, and troubleshooting.

For iOS, run `npm run ios` on macOS with Xcode installed.

## Common development checks

```bash
npm run start
npm run android:build:debug
npm run lint
npm run typecheck
npm test -- --passWithNoTests --watch=false
```
