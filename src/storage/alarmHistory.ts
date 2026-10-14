import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@wakely_alarm_history';
const LEGACY_HISTORY_STORAGE_KEY = '@alarmy_alarm_history';

export type WakeMood = 'great' | 'ok' | 'tired';

export type AlarmHistoryItem = {
  id: string;
  alarmId: string;
  alarmTime: string;
  period: string;
  missionId: string;
  missionTitle: string;
  /** All mission ids in the completed chain (primary first). Absent on old records. */
  chainIds?: string[];
  /** How the user felt right after waking. Set from the success screen. */
  mood?: WakeMood;
  /** Snoozes used before completing. */
  snoozeCount?: number;
  completed: boolean;
  completedAt: string;
  durationSeconds: number;
};

// Get all alarm history
export const getAlarmHistory = async (): Promise<AlarmHistoryItem[]> => {
  try {
    let data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

    // One-time migration from the pre-Wakely brand key.
    if (!data) {
      const legacy = await AsyncStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
      if (legacy) {
        data = legacy;
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, legacy);
        await AsyncStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
      }
    }

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading alarm history:', error);

    return [];
  }
};

// Save complete history
export const saveAlarmHistory = async (history: AlarmHistoryItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving alarm history:', error);
  }
};

// Add one history record
export const addAlarmHistory = async (item: AlarmHistoryItem): Promise<void> => {
  try {
    const history = await getAlarmHistory();

    history.unshift(item);

    await saveAlarmHistory(history);
  } catch (error) {
    console.error('Error adding alarm history:', error);
  }
};

// Clear history
export const clearAlarmHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing alarm history:', error);
  }
};

// Patch one history record (e.g. mood picked after the record was written).
export const updateAlarmHistory = async (
  id: string,
  patch: Partial<AlarmHistoryItem>,
): Promise<void> => {
  try {
    const history = await getAlarmHistory();
    await saveAlarmHistory(history.map(item => (item.id === id ? { ...item, ...patch } : item)));
  } catch (error) {
    console.error('Error updating alarm history:', error);
  }
};
