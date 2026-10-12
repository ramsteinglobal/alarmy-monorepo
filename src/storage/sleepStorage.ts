import AsyncStorage from '@react-native-async-storage/async-storage';

const SLEEP_LOG_KEY = '@wakely_sleep_log';
const SLEEP_GOAL_KEY = '@wakely_sleep_goal_hours';
const HABITS_KEY_PREFIX = '@wakely_habits:';

export const DEFAULT_SLEEP_GOAL_HOURS = 8;

export type SleepLog = {
  /** YYYY-MM-DD of the night (date sleep started). */
  date: string;
  bedtime: string;
  wakeTime: string;
  /** Minutes asleep, computed at save time. */
  durationMinutes: number;
};

export const dateKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
    2,
    '0',
  )}`;

/** "23:15" + "AM"/"PM" + "7:00" + "AM" -> minutes between (overnight aware). */
export function sleepDurationMinutes(
  bedHour: number,
  bedMinute: number,
  bedPeriod: 'AM' | 'PM',
  wakeHour: number,
  wakeMinute: number,
  wakePeriod: 'AM' | 'PM',
): number {
  const to24 = (h: number, p: 'AM' | 'PM') => (h % 12) + (p === 'PM' ? 12 : 0);
  const bed = to24(bedHour, bedPeriod) * 60 + bedMinute;
  const wake = to24(wakeHour, wakePeriod) * 60 + wakeMinute;
  const diff = wake - bed;
  return diff > 0 ? diff : diff + 24 * 60;
}

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const getSleepLogs = async (): Promise<SleepLog[]> => {
  try {
    const data = await AsyncStorage.getItem(SLEEP_LOG_KEY);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as SleepLog[]) : [];
  } catch (error) {
    console.error('Error loading sleep logs:', error);
    return [];
  }
};

export const saveSleepLog = async (log: SleepLog): Promise<void> => {
  const logs = await getSleepLogs();
  const next = [log, ...logs.filter(l => l.date !== log.date)];
  await AsyncStorage.setItem(SLEEP_LOG_KEY, JSON.stringify(next));
};

export const getSleepGoalHours = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(SLEEP_GOAL_KEY);
    const hours = raw ? Number(raw) : NaN;
    return Number.isFinite(hours) && hours >= 4 && hours <= 12 ? hours : DEFAULT_SLEEP_GOAL_HOURS;
  } catch {
    return DEFAULT_SLEEP_GOAL_HOURS;
  }
};

export const setSleepGoalHours = async (hours: number): Promise<void> => {
  await AsyncStorage.setItem(SLEEP_GOAL_KEY, String(hours));
};

export type HabitState = Record<string, boolean>;

export const getHabits = async (key: string = dateKey()): Promise<HabitState> => {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY_PREFIX + key);
    if (!data) return {};
    const parsed: unknown = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null ? (parsed as HabitState) : {};
  } catch (error) {
    console.error('Error loading habits:', error);
    return {};
  }
};

export const setHabit = async (
  id: string,
  done: boolean,
  key: string = dateKey(),
): Promise<void> => {
  const current = await getHabits(key);
  await AsyncStorage.setItem(HABITS_KEY_PREFIX + key, JSON.stringify({ ...current, [id]: done }));
};
