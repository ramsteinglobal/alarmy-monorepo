#!/usr/bin/env bash
set -Eeuo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/opt/android-sdk}}"
export ANDROID_HOME="${SDK_ROOT}"
export ANDROID_SDK_ROOT="${SDK_ROOT}"
export PATH="${SDK_ROOT}/platform-tools:${SDK_ROOT}/cmdline-tools/latest/bin:${SDK_ROOT}/cmdline-tools/bin:${PATH}"

if [ ! -d "${SDK_ROOT}" ]; then
  echo "Android SDK directory is missing at ${SDK_ROOT}. Rebuild the dev container or install the Android SDK first." >&2
  exit 1
fi

SDKMANAGER_BIN=""
for candidate in \
  "${SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager" \
  "${SDK_ROOT}/cmdline-tools/bin/sdkmanager" \
  "${SDK_ROOT}/tools/bin/sdkmanager"
 do
  if [ -x "${candidate}" ]; then
    SDKMANAGER_BIN="${candidate}"
    break
  fi
done

if [ -z "${SDKMANAGER_BIN}" ]; then
  echo "Android command-line tools are not installed in ${SDK_ROOT}." >&2
  echo "The dev container image must include the Android SDK command-line tools before setup can continue." >&2
  exit 1
fi

if ! command -v sdkmanager >/dev/null 2>&1; then
  export PATH="$(dirname "${SDKMANAGER_BIN}"):${PATH}"
fi

if [ ! -f "${SDK_ROOT}/platforms/android-37.0/android.jar" ] \
  || [ ! -d "${SDK_ROOT}/build-tools/37.0.0" ] \
  || [ ! -d "${SDK_ROOT}/ndk/27.1.12297006" ] \
  || [ ! -d "${SDK_ROOT}/cmake/3.22.1" ] \
  || [ ! -x "${SDK_ROOT}/platform-tools/adb" ]; then
  echo "Installing the Android SDK packages required by this project (platforms;android-37.0, build-tools;37.0.0, ndk;27.1.12297006)."
  set +o pipefail
  yes | sdkmanager --licenses >/dev/null
  set -o pipefail
  sdkmanager --install "platform-tools" "platforms;android-37.0" "build-tools;37.0.0" "ndk;27.1.12297006" "cmake;3.22.1"
fi

if [ ! -f "${SDK_ROOT}/platforms/android-37.0/android.jar" ]; then
  echo "The Android SDK setup did not finish correctly. Check the SDK path and install the Android 37 platform." >&2
  exit 1
fi

if [ ! -d "${SDK_ROOT}/ndk/27.1.12297006" ]; then
  echo "The Android NDK is missing. Re-run the SDK install step to fetch NDK 27.1.12297006." >&2
  exit 1
fi

if [ -f package-lock.json ]; then
  npm ci
fi

echo "Android toolchain is ready. Run 'npm run start' to start Metro and 'npm run android:build:debug' to build the APK."
