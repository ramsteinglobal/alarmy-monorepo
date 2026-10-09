# @alarme/mobile

React Native (Expo) + TypeScript + React Navigation app.

## Ownership (5–6 person team)

- `src/screens/`, `src/components/` → Frontend pair
- `src/navigation/` → Frontend (1 owner, everyone reviews route changes)
- `src/missions/` → one owner per mission (math, shake, photo/QR)
- `src/services/` → co-owned with backend team (touches Firestore schema)

## Commands

```bash
npm run start      # expo start
npm run android
npm run ios
npm run typecheck
npm run lint
```

## Rules

- All screens typed via `RootStackParamList`.
- No `any` without a TODO + issue link.
- Ringing screen must NEVER have a free dismiss button.
- Firebase keys only via `EXPO_PUBLIC_*` env vars, never hardcoded.
