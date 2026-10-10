# backend/ — Firebase Auth + Firestore + Functions

This folder is the **backend**. The mobile app in `apps/mobile/` never talks
to Firestore with elevated privileges — all access goes through these rules.

## Layout

- `firebase.json` — emulator + deploy config
- `firestore.rules` — per-user isolation for `users` and `alarms`
- `firestore.indexes.json` — `userId + time` composite index
- `storage.rules` — private `mission-photos/{userId}` for photo mission
- `.firebaserc.example` — copy to `.firebaserc` and set your project id
- `functions/` — Cloud Functions (Node 20, TypeScript)

## Ownership

1–2 people own this folder. Frontend may propose schema changes but backend
must approve + update rules/indexes in the same PR.

## Local dev

```bash
firebase emulators:start
```

## Deploy (maintainers only, from main)

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```
