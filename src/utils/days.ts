const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** "Every day", "Mon – Fri", "Mon · Wed" or "Once". */
export function describeDays(dayNames: string[]): string {
  if (dayNames.length === 7 && ALL_DAYS.every(d => dayNames.includes(d))) return 'Every day';
  if (dayNames.length === 5 && WEEKDAYS.every(d => dayNames.includes(d))) return 'Mon – Fri';
  return dayNames.length > 0 ? dayNames.join(' · ') : 'Once';
}

/** Day chips for the repeat-days picker. `id` is unique (two Ts, two Ss). */
export const DAYS = [
  { id: 'S1', label: 'S', name: 'Sun' },
  { id: 'M', label: 'M', name: 'Mon' },
  { id: 'T1', label: 'T', name: 'Tue' },
  { id: 'W', label: 'W', name: 'Wed' },
  { id: 'T2', label: 'T', name: 'Thu' },
  { id: 'F', label: 'F', name: 'Fri' },
  { id: 'S2', label: 'S', name: 'Sat' },
] as const;

export const DEFAULT_REPEAT_IDS = ['M', 'T1', 'W', 'T2', 'F'];

export const dayIdsFromNames = (names: string[]) =>
  DAYS.filter(d => names.includes(d.name)).map(d => d.id as string);

export const dayNamesFromIds = (ids: string[]) =>
  DAYS.filter(d => ids.includes(d.id)).map(d => d.name as string);
