# Alarme App — Alarmy-style mission alarm

React Native (Expo) + TypeScript + React Navigation · Firebase Auth + Firestore.

> Status: repo scaffolded, no app logic yet. Team starts coding after this is pushed to GitHub.

## Monorepo map (frontend vs backend is explicit)

```text
alarme-app/
├── apps/mobile/            # FRONTEND — Expo app (only place with screens)
│   └── src/
│       ├── screens/        # Home, CreateAlarm, Ringing, Login
│       ├── navigation/     # RootNavigator + RootStackParamList
│       ├── components/     # AlarmRow, …
│       ├── missions/       # math.ts, shake.ts, (photo, qr next)
│       ├── services/       # firebase.ts, auth.ts, alarms.ts
│       └── store/          # AuthContext
├── backend/                # BACKEND — Firebase only, no screens
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── storage.rules
│   └── functions/          # Cloud Functions (Node 20 + TS)
├── packages/shared-types/  # Shared contract: Alarm, MissionConfig, AppUser
├── docs/                   # Alarmy analysis, schema, workflow
└── .github/                # CI, PR template, CODEOWNERS, issue templates
```

Rule: mobile owns UX, backend owns data + rules. Schema changes must touch
`packages/shared-types` + `backend/firestore.*` in the same PR.

## Quickstart

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env   # fill Firebase keys
cp backend/.firebaserc.example backend/.firebaserc
npm run ci                                       # lint + format + typecheck
```

## Alarmy MVP (what we clone first)

1. CRUD alarms (time, repeat days, label, sound) — Firestore `alarms`.
2. Missions v1: math + shake. v2: photo + QR.
3. Ringing screen with NO free dismiss — mission completion only.
4. Auth: email/password first.
5. Fall-back-asleep re-check (simplified) + loud sound.

See `docs/alarmy-analysis.md` and `docs/firestore-schema.md`.

## Team workflow (5–6 people)

- `main` is protected — PRs only, 1 approval + green CI.
- Branch names: `feat/…`, `fix/…`, `backend/…`, `mission/…`.
- CODEOWNERS auto-requests reviewers per folder.
- GitHub Projects for tasks, Issues for bugs.
- CodeRabbit reviews every PR (setup below — maintainer does this once on GitHub).

## After pushing to GitHub (maintainer checklist)

1. Create repo `alarme-app`, push this folder as root.
2. Settings → Branches → protect `main`: require PR, 1 approval, require CI.
3. Install CodeRabbit app from marketplace, leave defaults on.
4. Replace `@your-org/*` in `.github/CODEOWNERS` with real usernames.
5. Create Firebase project, update `.firebaserc` project id (keep `.firebaserc` gitignored).
