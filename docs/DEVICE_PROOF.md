# Wakely Device-Proof Checklist

Run these on real phones before any release. Emulators cannot prove alarms.

## 1. Fresh install

- [ ] Uninstall old `AlarmyApp` build (launcher label is cached otherwise).
- [ ] Install CI `wakely-debug-apk` (or local `npm run android:build:debug` + install).
- [ ] Cold start shows yellow splash + white Wakely, then Alarm Dashboard (guest, no login wall).

## 2. Core ring (killed app, Android)

- [ ] Create alarm 2 min out, Math 1 problem. Kill app (swipe away).
- [ ] Phone rings on time, over lock screen, with sound + vibration.
- [ ] Complete mission → silence + Success + history entry.
- [ ] Repeat with app killed + screen off + charger unplugged (Doze).

## 3. Permissions denied paths

- [ ] Deny notifications → save alarm → fix dialog appears; Dashboard shows `Alarm may not ring → FIX NOW`.
- [ ] Deny exact alarms (Settings → Apps → Alarms & reminders → off) → same banner; re-grant → next save schedules.
- [ ] Battery optimized (default) → Reliability row shows FIX; set Unrestricted → ON.

## 4. Reboot + update

- [ ] Set weekly alarm, reboot phone, do NOT open app → still rings (Notifee restore).
- [ ] Open app after reboot → schedules rebuilt (logcat: no errors).

## 5. Snooze + failsafe + wake-check

- [ ] Snooze → silences, re-rings in N min with count preserved; cap hides button with honest copy.
- [ ] Auto-dismiss (set 1 min via test alarm? use 15 min) → silences untouched alarm.
- [ ] Wake-check → check notification after dismiss → I'M UP ends it; ignore → full re-ring.
- [ ] Backup: ignore a ringing alarm 40s → extra-loud tone takes over; start mission → backup cancelled.

## 5b. Sound engine

- [ ] Each tone (Classic / Morning / Energy / Nature) rings its own sound per alarm.
- [ ] Vibration-only alarm is truly silent + vibrates.
- [ ] SelectSound preview plays the real tone through the real channel.

## 6. Missions on device

- [ ] Shake: real shakes count; gentle wobble does not.
- [ ] Photo: camera opens, capture + confirm stops alarm; denied permission → settings path.
- [ ] Chain of 3 + tuned counts; preview dry-run saves no history.

## 7. OEM killers (Xiaomi / Oppo / Vivo / Samsung if available)

- [ ] Lock Wakely in recents; enable auto-start; Unrestricted battery.
- [ ] Overnight alarm test: set for morning, leave phone unplugged overnight.

## 8. iOS (needs mac + `pod install`)

- [ ] `GoogleService-Info.plist` added; Google sign-in works.
- [ ] Trigger fires in background; tap opens Ringing; sound plays (default until bundled tones land).
- [ ] Silent switch ON behavior documented in Help.

## 9. Regression after every change

`npm run lint && npm run typecheck && npm test -- --watch=false && npm run format:check`
