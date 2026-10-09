# Alarmy analysis → our MVP

Source: Alarmy (DelightRoom) — 100M+ users. Core loop: alarm rings →
**mission must be completed** → dismiss. No swipe-to-dismiss.

## Mission taxonomy (9 missions, 3 groups)

- **Cognitive:** math (most popular), memory tiles, typing, tap challenge
- **Physical:** shake (easy entry), squat, walking/steps
- **Location-bound:** photo (retake reference shot), QR/barcode scan,
  household-item hunt (random object — anti-habituation)

Chaining is the norm: e.g. math → shake, or squat → photo → typing
for extreme sleepers.

## 5-layer force-wake system (Alarmy's words)

1. Missions (conscious action before stop)
2. Fall-back-asleep prevention (re-check minutes after dismiss)
3. Surprise sound boost (anti-habituation bursts)
4. Power-off prevention (block phone-off during alarm)
5. Uninstall prevention (block delete during alarm)

## Our MVP scope

| Milestone | Scope                                                  |
| --------- | ------------------------------------------------------ |
| M1        | Auth + alarm CRUD + local ringing + math mission       |
| M2        | Shake mission + Firestore sync + FCM via Functions     |
| M3        | Photo + QR missions + Storage rules + wake-up re-check |
| Later     | Squat/walking (sensors), sounds, sleep stats, premium  |

## Non-negotiables for our clone

- Ringing screen has no free dismiss.
- Missions are per-alarm, chainable (`missions: MissionConfig[]`).
- Alarms are user-private (rules enforce `userId`).
- Math difficulty + shake count are configurable.
