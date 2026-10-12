# Alarmy

## Android: build, install, and test

The easiest way to try Alarmy is to build a debug APK in GitHub Codespaces and
install it on an Android phone. Open the repository in Codespaces, wait for
setup, then run:

```bash
npm run android:build:debug
```

Download `android/app/build/outputs/apk/debug/app-debug.apk` from the Codespaces
Explorer and install it on your phone. This builds the APK but does not launch
it; `npm run android` requires a phone or emulator visible to `adb`. Codespaces
does not automatically provide one.

See the [complete Android development guide](docs/ANDROID_DEVELOPMENT_GUIDE.md)
for setup steps, live development, phone installation, CI artifacts, tests, and
troubleshooting.

For iOS, run `npm run ios` on macOS with Xcode installed.

## Common development checks

```bash
npm run start
npm run android:build:debug
npm run lint
npm run typecheck
npm test -- --passWithNoTests --watch=false
```
