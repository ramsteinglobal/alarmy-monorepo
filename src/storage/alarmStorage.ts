import AsyncStorage from '@react-native-async-storage/async-storage';

const ALARM_STORAGE_KEY = '@wakely_alarms';
const LEGACY_ALARM_STORAGE_KEY = '@alarmy_alarms';

export type MissionRef = {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
};

/** Per-alarm tuning for the mission chain. Absent = mission defaults. */
export type MissionConfig = {
  /** Math problems to solve (1-5). */
  mathProblems?: number;
  /** Math difficulty. */
  mathDifficulty?: 'Easy' | 'Medium' | 'Hard';
  /** Shake target count. */
  shakeTarget?: number;
  /** Squat target count. */
  squatTarget?: number;
  /** Typing repetitions. */
  typingReps?: number;
  /** Memory sequence length. */
  memoryLength?: number;
  /** Tap challenge target. */
  tapTarget?: number;
};

export const DEFAULT_MISSION_CONFIG: Required<MissionConfig> = {
  mathProblems: 1,
  mathDifficulty: 'Medium',
  shakeTarget: 10,
  squatTarget: 10,
  typingReps: 1,
  memoryLength: 4,
  tapTarget: 30,
};

/** Merge saved tuning over defaults so old alarms behave like before. */
export const getMissionConfig = (
  alarm: Pick<StoredAlarm, 'missionConfig'>,
): Required<MissionConfig> => ({ ...DEFAULT_MISSION_CONFIG, ...alarm.missionConfig });

export const DEFAULT_SNOOZE_MINUTES = 5;
export const DEFAULT_MAX_SNOOZES = 3;
export const DEFAULT_AUTO_DISMISS_MINUTES = 30;

export type StoredAlarm = {
  id: string;
  time: string;
  period: string;
  days: string;
  dayNames: string[];
  /** Optional label like "Work" or "Gym". */
  label?: string;
  sound: {
    id: string;
    name: string;
    description?: string;
    /** Bundled tone resource. Absent = default tone / vibrate-only. */
    file?: string;
  };
  /** Primary mission (first of the chain). Kept so old readers keep working. */
  mission: MissionRef;
  /** Full wake-up chain. Old alarms saved before chaining only have `mission`. */
  missions?: MissionRef[];
  /** Tuning for the chain (counts, difficulty). */
  missionConfig?: MissionConfig;
  /** Snooze length in minutes. 0 maxSnoozes = snooze off. */
  snoozeMinutes?: number;
  maxSnoozes?: number;
  /** Auto-silence failsafe in minutes (0 = off). */
  autoDismissMinutes?: number;
  /** Wake-up re-check minutes after dismiss (0 = off). */
  wakeCheckMinutes?: number;
  enabled: boolean;
};

export const DEFAULT_WAKE_CHECK_MINUTES = 10;

export const getSnoozeMinutes = (alarm: Pick<StoredAlarm, 'snoozeMinutes'>): number =>
  alarm.snoozeMinutes ?? DEFAULT_SNOOZE_MINUTES;

export const getMaxSnoozes = (alarm: Pick<StoredAlarm, 'maxSnoozes'>): number =>
  alarm.maxSnoozes ?? DEFAULT_MAX_SNOOZES;

export const getAutoDismissMinutes = (alarm: Pick<StoredAlarm, 'autoDismissMinutes'>): number =>
  alarm.autoDismissMinutes ?? DEFAULT_AUTO_DISMISS_MINUTES;

export const getWakeCheckMinutes = (alarm: Pick<StoredAlarm, 'wakeCheckMinutes'>): number =>
  alarm.wakeCheckMinutes ?? DEFAULT_WAKE_CHECK_MINUTES;

/** Ordered mission chain for an alarm, normalising pre-chain alarms. */
export const getMissionChain = (alarm: Pick<StoredAlarm, 'mission' | 'missions'>): MissionRef[] => {
  if (alarm.missions && alarm.missions.length > 0) return alarm.missions;
  return [alarm.mission];
};

/** Short display title for notifications and cards: "Math" or "Math + 2 more". */
export const missionChainTitle = (alarm: Pick<StoredAlarm, 'mission' | 'missions'>): string => {
  const chain = getMissionChain(alarm);
  if (chain.length <= 1) return chain[0]?.title ?? 'Wake-up Mission';
  return `${chain[0]?.title ?? 'Mission'} + ${chain.length - 1} more`;
};

// Get all saved alarms safely
export const getAlarms = async (): Promise<StoredAlarm[]> => {
  try {
    let data = await AsyncStorage.getItem(ALARM_STORAGE_KEY);

    // One-time migration from the pre-Wakely brand key.
    if (!data) {
      const legacy = await AsyncStorage.getItem(LEGACY_ALARM_STORAGE_KEY);
      if (legacy) {
        data = legacy;
        await AsyncStorage.setItem(ALARM_STORAGE_KEY, legacy);
        await AsyncStorage.removeItem(LEGACY_ALARM_STORAGE_KEY);
      }
    }

    if (!data) {
      return [];
    }

    const parsed: unknown = JSON.parse(data);

    return Array.isArray(parsed) ? (parsed as StoredAlarm[]) : [];
  } catch (error) {
    console.error('Error loading alarms:', error);
    return [];
  }
};

// Save complete alarm list
export const saveAlarms = async (alarms: StoredAlarm[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.error('Error saving alarms:', error);
  }
};

// Add a new alarm
export const addAlarm = async (alarm: StoredAlarm): Promise<void> => {
  try {
    const alarms = await getAlarms();

    alarms.push(alarm);

    await saveAlarms(alarms);
  } catch (error) {
    console.error('Error adding alarm:', error);
  }
};

// Update an existing alarm
export const updateAlarm = async (updatedAlarm: StoredAlarm): Promise<void> => {
  try {
    const alarms = await getAlarms();

    const updatedAlarms = alarms.map(alarm =>
      alarm.id === updatedAlarm.id ? updatedAlarm : alarm,
    );

    await saveAlarms(updatedAlarms);
  } catch (error) {
    console.error('Error updating alarm:', error);
  }
};

// Delete an alarm
export const deleteAlarm = async (alarmId: string): Promise<void> => {
  try {
    const alarms = await getAlarms();

    const filteredAlarms = alarms.filter(alarm => alarm.id !== alarmId);

    await saveAlarms(filteredAlarms);
  } catch (error) {
    console.error('Error deleting alarm:', error);
  }
};
