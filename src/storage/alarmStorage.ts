import AsyncStorage from '@react-native-async-storage/async-storage';

const ALARM_STORAGE_KEY = '@alarmy_alarms';

export type StoredAlarm = {
  id: string;
  time: string;
  period: string;
  days: string;
  dayNames: string[];
  sound: {
    id: string;
    name: string;
    description?: string;
  };
  mission: {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
  };
  enabled: boolean;
};

// Get all saved alarms
export const getAlarms = async (): Promise<StoredAlarm[]> => {
  try {
    const data = await AsyncStorage.getItem(ALARM_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
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
