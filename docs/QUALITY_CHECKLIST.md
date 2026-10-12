# Wakely — Master Quality Checklist (push gate)

Date: 2026-10-12. Legend: ✅ verified in repo · ⚠️ needs real-device proof · 🔮 future (post-MVP).

## 11. Professional UX pass (2026-10-12)
- [x] ✅ Back-escape blocked on Success + WakeCheck (parity with Ringing/Mission)
- [x] ✅ Dashboard: loading skeleton, error+retry, live counts, honest refresh glyph, time-aware icon
- [x] ✅ Missing-alarm error states on Ringing/Mission/Success (no fake --:-- fallbacks)
- [x] ✅ Ringing: ScrollView-safe, snooze demoted to ghost, RINGING badge, redundancy cuts
- [x] ✅ Touch ≥44px: day circles, batch/pill/stepper/mood/state-badge/social/input/checkbox/menu/tab-label
- [x] ✅ Contrast: success badges per-mode text, ghost buttons use text color, avatar onAccent
- [x] ✅ Voice unified (Title Case setup, caps only on alert trio); Medium difficulty; No-repeat; Review-changes title
- [x] ✅ Type/spacing tokens: headers 28, sections 16, cards 16, InfoRow 16, letterSpacing 1.5, padding 20
- [x] ✅ SelectSound header inside scroll; wizard Continue→/Back vocabulary; preview a11y labels
- [x] ✅ Auth: PrimaryButton CTAs, close buttons, modal presentation, real forgot-password, 14px inputs
- [x] ✅ Morning/Sleep/Report/Settings headers, refresh affordances, empty/error states, mood question visible

## 1. Boot & app shell

- [x] ✅ `index.js` registers background handler before App
- [x] ✅ `App.tsx`: ThemeProvider → AuthProvider → NavigationContainer (ref + linking + onReady flush)
- [x] ✅ Cold-start reschedules all alarms (reboot/update coverage)
- [x] ✅ Splash: yellow brand moment native (Android drawable+theme, iOS storyboard) + JS
- [x] ✅ Auth gate: splash → Main for everyone; Login/Signup push on top
- [x] ✅ Deep links `wakely://alarm|login|signup` native + navigation config
- [x] ✅ No ErrorBoundary gaps? — Screen-level guards + fail-closed mission default
- [x] ✅ `app.json` displayName Wakely; launcher names Wakely both platforms

## 2. Native config

- [x] ✅ Android permissions: notifications, exact alarms ×2, boot, vibrate, camera, wake-lock, FGS, FSI
- [x] ✅ MainActivity: showWhenLocked + turnScreenOn + SplashTheme→AppTheme swap + deep-link filter
- [x] ✅ iOS plist: camera/mic purpose strings, wakely URL scheme, empty location key removed
- [x] ✅ iOS sounds bundled via pbxproj (6 wav + group + Resources phase)
- [x] ✅ Android raw tones present + valid WAV headers verified
- [x] ✅ minSdk 24 / target 36 / compile 37; CI builds debug APK with new native libs
- [ ] ⚠️ iOS `GoogleService-Info.plist` missing — add from Firebase console before iOS release
- [ ] ⚠️ `pod install` + Xcode build still required to prove iOS (tones/sensors/camera/linking)

## 3. Auth & accounts

- [x] ✅ Email/password login + signup with validation + error mapping
- [x] ✅ Google sign-in (Android verified config; iOS needs plist above)
- [x] ✅ Forgot password: real reset-email flow
- [x] ✅ No dead buttons (Apple removed both screens; PII placeholders replaced)
- [x] ✅ Guest-first: alarms fully usable without login
- [x] ✅ Login walls on Sleep/Morning/Report with return-to-origin after sign-in
- [x] ✅ Settings guest state + inline sign-in; logout stays in app (no forced login)
- [x] ✅ Sleep persona editable (Firestore merge) + sign-in method display

## 4. Alarm create/edit (wizard)

- [x] ✅ Time stepper + AM/PM + repeat chips + batch shortcuts (Weekdays/Weekend/Every day/Once)
- [x] ✅ Label field (optional, shown everywhere downstream)
- [x] ✅ Live "Rings in X" preview (matches scheduler math — tested)
- [x] ✅ Edit pre-fills everything incl. chain/config/snooze/behavior
- [x] ✅ Sounds carry file mapping end-to-end; default sound from Settings for new alarms
- [x] ✅ Mission chain up to 3, ordered, min 1; per-type tuning UI; preview dry-run (no history)
- [x] ✅ Summary: snooze length/count, auto-dismiss, wake-check controls; saves + schedules + cloud push

## 5. Scheduling & delivery

- [x] ✅ Exact timestamp triggers, Doze-proof, weekly repeat per weekday, once logic
- [x] ✅ Per-tone channels (each alarm rings its own sound) + vibration honored
- [x] ✅ Stale-trigger cancel before every (re)schedule; toggle/delete/edit cancel all keys
- [x] ✅ Permission check at save with fix dialog; Dashboard denied-permission banner
- [x] ✅ Reliability screen: notifications / exact alarms / battery with deep-link fixes
- [x] ✅ Foreground + background + cold-start routing (ring/snooze/backup/check/re-ring)
- [x] ✅ Backup watchdog trigger armed per ring; cancelled on any engagement
- [x] ✅ Wake-check + parallel re-ring scheduled per dismiss; all keys cleaned on toggle/delete/edit
- [x] ✅ One-time alarms auto-disable after completion (no zombie enabled alarms)
- [ ] ⚠️ Killed-app + Doze-overnight + reboot-without-open + OEM battery proofs (see DEVICE_PROOF.md)

## 6. Ringing & missions

- [x] ✅ Full-screen ringing, back-button trap, no free dismiss
- [x] ✅ Per-alarm snooze button (hidden when max=0), count preserved across re-rings, anti-stack
- [x] ✅ Chain execution with step progress, single-complete guard, fail-closed unknown ids
- [x] ✅ Math (3 difficulties, 1–5 problems, per-problem progress)
- [x] ✅ Typing (1–3 reps, normalized match), Memory (3–6 length, recall progress)
- [x] ✅ Shake (real accelerometer, tap fallback), Squat/Tap (counter), Photo/Barcode (camera proof + retake + denied path)
- [x] ✅ No demo/placeholder missions left (DemoMission deleted)
- [x] ✅ Success: history + mood check-in + stop sound + wake-check scheduling
- [x] ✅ WakeCheck screen: 60s countdown, I'M UP, force-kill safety re-ring

## 7. Tabs (no fake data)

- [x] ✅ Dashboard: countdown hero, live counts, mission chips, labels, refresh affordances honest
- [x] ✅ Morning: real last wake-up/streak/habits (persisted, toggleable), time-aware greeting
- [x] ✅ Sleep: real manual logs, 7-day average vs goal, real week bars, empty states
- [x] ✅ Report: real wake consistency/streak/moods, all-8-mission stats incl. chains, real sleep + Early Bird
- [x] ✅ Settings: persisted vibration/defaults, live reliability, working rows, real help, Appearance switch

## 8. Theme & brand

- [x] ✅ Light/Dark/System with persistence; 30 files migrated; parity test
- [x] ✅ Status bar + tab bar follow theme; splash stays brand yellow
- [x] ✅ Wakely naming everywhere user-visible; technical IDs intentionally stable

## 9. Data & backend

- [x] ✅ Storage versioning/migration (brand keys, legacy chain/history normalization)
- [x] ✅ Prefs module (vibration, default sound, auto-dismiss default)
- [x] ✅ Firestore rules for users/{uid}/alarms|history|sleep (+ legacy top-level kept)
- [x] ✅ Cloud sync: push on save, pull-missing + push-all on fresh sign-in, guests unaffected
- [x] ✅ Functions build + lint pass (cleanup job; no-op until top-level alarms used)
- [ ] 🔮 Conflict UI, realtime listeners, FCM wake-check (local triggers cover MVP)

## 10. Quality gates

- [x] ✅ `npm ci` clean → lint ✅ typecheck ✅ 22/22 tests ✅ format ✅
- [x] ✅ Backend `build` + `lint --max-warnings=0` ✅
- [x] ✅ No TODO/FIXME/Coming-soon/dead buttons in `src/`
- [x] ✅ Docs: APP_FLOW + DEVICE_PROOF current
- [ ] ⚠️ Push → watch CI APK build (first build with sensors/image-picker/raw assets)
- [ ] 🔮 Crash reporting, E2E tests, onboarding carousel, subscription paywall
