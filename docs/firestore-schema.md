# Firestore schema

## `users/{uid}`

```ts
{
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: number;
}
```

## `alarms/{alarmId}`

```ts
{
  userId: string;          // == auth.uid (enforced by rules)
  label: string;
  time: string;            // "HH:mm"
  repeatDays: number[];    // 0=Sun..6=Sat, [] = one-shot
  enabled: boolean;
  missions: MissionConfig[]; // see packages/shared-types
  soundId?: string;
  createdAt: number;
  updatedAt: number;
}
```

Index: `(userId ASC, time ASC)`.

## `mission-photos/{uid}/…` (Storage)

Reference photos for photo mission. Private per user (see `storage.rules`).

## Rules summary

- `users`: owner-only read/write.
- `alarms`: `create` requires `request.resource.data.userId == auth.uid`;
  read/write require `resource.data.userId == auth.uid`.
- Any new collection MUST get rules + a backend owner in the same PR.
