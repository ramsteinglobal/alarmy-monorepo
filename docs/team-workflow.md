# Team workflow (5–6 people)

## Roles

- **2–3 Frontend:** screens, navigation, components, mission UI.
- **1–2 Backend/Firebase:** schema, rules, indexes, Functions, Auth.
- **1 Repo lead (you):** merges, branch protection, CodeRabbit, releases.

## Branching

- `main` — always green, protected.
- `feat/<issue>-<short>` — e.g. `feat/12-math-mission`.
- `backend/<issue>-<short>`, `mission/<issue>-<short>`, `fix/<issue>-<short>`.

## PR rules

- Small PRs (<400 lines ideally), one concern each.
- Fill the PR template; link `Closes #n`.
- CI must be green; 1 human approval; CODEOWNERS respected.
- Schema change → types + rules + indexes in ONE PR.

## Task split for week 1 (no stepping on toes)

1. Auth UI + `services/auth.ts` (1 person)
2. Alarm CRUD + `services/alarms.ts` + Home/Create screens (2 people)
3. Math mission (1 person)
4. Shake mission (1 person)
5. Rules hardening + emulators + Functions build (1 person)

## Commands

```bash
npm run lint && npm run format:check && npm run typecheck --workspaces --if-present
firebase emulators:start   # from backend/
```
