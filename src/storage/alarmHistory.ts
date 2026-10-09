import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@alarmy_alarm_history';

export type AlarmHistoryItem = {
  id: string;
  alarmId: string;
  alarmTime: string;
  period: string;
  missionId: string;
  missionTitle: string;
  completed: boolean;
  completedAt: string;
  durationSeconds: number;
};

// Get all alarm history
export const getAlarmHistory = async (): Promise<
  AlarmHistoryItem[]
> => {
  try {
    const data = await AsyncStorage.getItem(
      HISTORY_STORAGE_KEY,
    );

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(
      'Error loading alarm history:',
      error,
    );

    return [];
  }
};

// Save complete history
export const saveAlarmHistory = async (
  history: AlarmHistoryItem[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history),
    );
  } catch (error) {
    console.error(
      'Error saving alarm history:',
      error,
    );
  }
};

// Add one history record
export const addAlarmHistory = async (
  item: AlarmHistoryItem,
): Promise<void> => {
  try {
    const history = await getAlarmHistory();

    history.unshift(item);

    await saveAlarmHistory(history);
  } catch (error) {
    console.error(
      'Error adding alarm history:',
      error,
    );
  }
};

// Clear history
export const clearAlarmHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(
      HISTORY_STORAGE_KEY,
    );
  } catch (error) {
    console.error(
      'Error clearing alarm history:',
      error,
    );
  }
};