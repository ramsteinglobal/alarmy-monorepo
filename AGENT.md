# AGENT.md — Wakely (Alarmy Monorepo)

## 1. Project Overview & Architecture

Wakely is an aggressive, mission-based alarm clock app built with **React Native (0.87.1)**, **Hermes**, **TypeScript**, and **@notifee/react-native**. Inspired by Alarmy, its core principle is **"No Swipe to Dismiss"** — when an alarm rings, the user must successfully complete one or more cognitive or physical missions (e.g., Math, Shake, Memory, Typing, Photo Proof) to stop the sound.

### Tech Stack
- **Framework:** React Native 0.87.1 (New Architecture ready, Android compileSdk 37, targetSdk 36, minSdk 24)
- **Engine:** Hermes
- **Alarm & Notification Engine:** `@notifee/react-native` (Exact alarms, Full-Screen Intents, Doze bypass)
- **Navigation:** `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` (v7)
- **Backend & Cloud Sync:** Firebase Authentication, Cloud Firestore (`@react-native-firebase/app`, `auth`, `firestore`), Google Sign-In
- **Sensor & Hardware:** `@react-native-sensors` (Accelerometer for Shake mission), `react-native-image-picker` (Camera)
- **Storage:** `@react-native-async-storage/async-storage` for offline local-first persistence
- **Testing:** Jest + `@testing-library/react-native` (43 passing tests)

---

## 2. Directory Structure

```
e:/alarmApp/alarmy-main/
├── android/                   # Native Android project (Kotlin/Gradle)
│   └── app/src/main/
│       ├── AndroidManifest.xml # Permissions (EXACT_ALARM, FULL_SCREEN_INTENT, WAKE_LOCK)
│       ├── java/com/alarmyapp/ # MainActivity.kt, MainApplication.kt
│       └── res/raw/            # Bundled wav audio files (classic, morning, energy, nature, extra_loud)
├── backend/                   # Firebase Cloud Functions, Firestore & Storage security rules
├── docs/                      # Architectural docs (APP_FLOW.md, DEVICE_PROOF.md, QUALITY_CHECKLIST.md)
├── __tests__/                 # Jest test suites (alarmFlow, alarmSound, permissions, App)
└── src/
    ├── components/            # Reusable UI primitives (Card, PrimaryButton, Screen, TimeStepper)
    ├── config/                # Firebase setup & error helpers
    ├── data/                  # Static definitions (options.ts, sounds, missions)
    ├── hooks/                 # Custom hooks (useBlockBack, etc.)
    ├── missions/              # Mission components (Math, Shake, Memory, Typing, Photo, Counter)
    ├── navigation/            # AppNavigator, navigationRef, type definitions
    ├── screens/
    │   ├── alarm/             # Core alarm flow (Dashboard, Create, Sound, Missions, Ringing, Success, WakeCheck)
    │   ├── auth/              # Login, Signup
    │   ├── morning/           # Morning routines & briefings
    │   ├── report/            # Sleep & wake history reports
    │   ├── settings/          # Permissions reliability center & preferences
    │   └── sleep/             # Bedtime tracking & logs
    ├── services/              # alarmScheduler, alarmEvents, permissionsService, cloudSync
    ├── storage/               # AsyncStorage drivers (alarmStorage, alarmHistory, prefs, sleepStorage)
    ├── store/                 # AuthContext, ThemeContext
    ├── theme.ts               # Theme tokens (colors, typography, spacing)
    └── utils/                 # nextTrigger calculation, time formatting, days helper
```

---

## 3. Alarm Lifecycle & Flow

1. **Scheduling (`alarmScheduler.ts`):**
   - User configures time, repetition days, sound, and mission chain.
   - Saved locally in AsyncStorage and synced to Firestore (if logged in).
   - `notifee.createTriggerNotification` registers exact timestamp triggers with `allowWhileIdle: true`.
   - Android Notification Channel is created/synced dynamically with `bypassDnd: true`, `importance: HIGH`, and `category: ALARM`.

2. **Triggering & Ringing (`alarmEvents.ts` & `AlarmRingingScreen.tsx`):**
   - In background/locked state: Notifee triggers notification with `fullScreenAction` launching `MainActivity`.
   - App navigates to `AlarmRingingScreen`.
   - Back button is blocked via `useBlockBack`.
   - 40-second backup failsafe timer starts (`scheduleBackup` triggers extra-loud tone if untouched).

3. **Mission Execution (`MissionExecutionScreen.tsx`):**
   - Tapping "START MISSION" transitions to mission execution.
   - Backup blast is cancelled.
   - User completes all steps in the configured mission chain.

4. **Dismissal & Wake-Up Check (`AlarmSuccessScreen.tsx` & `WakeCheckScreen.tsx`):**
   - Ringing notification is stopped (`stopRinging`).
   - Wake history is recorded.
   - One-time alarms are automatically toggled off.
   - Wake-Up Check is scheduled (`scheduleWakeCheck` fires minutes later to verify the user didn't fall back asleep).

---

## 4. Current State: What Works Well vs What Needs Improvement

### ✅ What Is Working Well
- **Deterministic Scheduling:** Exact alarms fire on time in Doze mode via `AndroidImportance.HIGH` and `allowWhileIdle: true`.
- **Lock Screen Wakeup & Keep Screen On (Implemented):** `MainActivity.kt` configured with `setShowWhenLocked(true)`, `setTurnScreenOn(true)`, and `FLAG_KEEP_SCREEN_ON` so screen illuminates over lock screen when alarm rings.
- **Display Over Other Apps (Implemented):** Added `SYSTEM_ALERT_WINDOW` permission and "Display over other apps" auditor in Settings → Alarm Reliability.
- **Tab Escape Loophole Closed (Implemented):** `AlarmRinging`, `MissionExecution`, `AlarmSuccess`, and `WakeCheck` screens moved to `RootStack` with `presentation: 'fullScreenModal'`. Tab bar is completely hidden during alarm ringing.
- **Offline-First & Local Resilience:** Complete offline alarm management; auto-rebuild of OS triggers on cold boot/reboot (`rescheduleAll`).
- **Permissions Reliability Dashboard:** Built-in auditing for Notification permissions, Exact Alarm permission, Battery Optimization whitelist, Full Screen Intent (Android 14+), Overlay permission, and OEM Autostart (Xiaomi/Oppo/Vivo).
- **Mission Chaining:** Ability to chain multiple missions (e.g. Math → Shake → Memory).
- **Sensors Fallback:** Accelerometer for shake with smooth fallback to manual tap when sensors are unavailable.
- **Failsafe System:** Auto-escalation to extra-loud sound after 40 seconds; wake-check re-ring safeguard.
- **Back Button Hardening:** `BackHandler` listeners intercept Android back navigation during ringing.

### 🚀 Next Enhancements Roadmap (For Full Native Device Capabilities)
1. **Native Device Ringtones Support (`RingtoneManager`):**
   - Access system default alarm sounds and device ringtones via an Android native module or audio player bridge.
2. **Dedicated Audio Stream (`STREAM_ALARM`):**
   - Ensure ringtone plays directly via `AudioManager.STREAM_ALARM` at user-selected alarm volume even if notification volume is low.
3. **Photo / Barcode Mission AI Verification:**
   - Integrate on-device ML Kit barcode detector and photo feature match for real physical object verification.

---

## 5. Development & Verification Commands

```bash
# Run tests
npm test -- --passWithNoTests --watch=false

# TypeScript type check
npm run typecheck

# Code formatting & Linting
npm run lint
npm run format:check
npm run format

# Full CI Verification
npm run verify

# Build Debug APK locally
npm run android:build:debug

# Launch App on connected Android device
npm run android:launch
```

---

## 6. Coding Conventions & Best Practices for AI Agents

1. **Preserve Alarm Safety:** Never allow an alarm to be dismissed without mission completion. Do not add close or back buttons to `AlarmRingingScreen` or `MissionExecutionScreen` outside `__DEV__`.
2. **Always Handle Permissions Gracefully:** Use `permissionsService.ts` before scheduling. Prompt user with `promptFixPermissions` if permissions fail.
3. **Keep Files Modular:** Audio logic belongs in `services/alarmScheduler.ts` or dedicated native modules, UI in `screens/alarm/`, and storage in `storage/alarmStorage.ts`.
4. **Follow Theme Tokens:** Use `useThemeColors()` from `store/ThemeContext` and tokens in `theme.ts`. Do not hardcode arbitrary hex colors.
5. **Cross-Platform Awareness:** Use `Platform.OS === 'android'` guards for Android-specific APIs (channel IDs, OEM battery intents).
