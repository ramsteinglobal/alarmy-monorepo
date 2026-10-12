import type { StoredAlarm } from '../storage/alarmStorage';
import { parseStoredTime } from './time';

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** 12-hour "7:52" + "AM" -> 24-hour { hour, minute }. */
export function to24h(time: string, period: string) {
  const { hour, minute, period: p } = parseStoredTime(time, period);
  const h = (hour % 12) + (p === 'PM' ? 12 : 0);
  return { hour: h, minute };
}

/** The next moment this alarm should ring on `weekday` (0 = Sun) or, if null, the next occurrence of the time. */
export function nextOccurrence(
  alarm: Pick<StoredAlarm, 'time' | 'period'>,
  weekday: number | null,
  from = new Date(),
): Date {
  const { hour, minute } = to24h(alarm.time, alarm.period);
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);

  if (weekday === null) {
    if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Trigger plan for an alarm:
 *  - repeating days -> one weekly trigger per selected day
 *  - no days        -> a single one-time trigger
 */
export function buildTriggers(alarm: StoredAlarm, from = new Date()) {
  const names = (alarm.dayNames ?? []).filter(n => n in DAY_INDEX);
  if (names.length === 0) {
    return [{ key: 'once', at: nextOccurrence(alarm, null, from), repeat: false }];
  }
  return names.map(n => ({
    key: n,
    at: nextOccurrence(alarm, DAY_INDEX[n], from),
    repeat: true,
  }));
}
