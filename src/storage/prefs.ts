import AsyncStorage from '@react-native-async-storage/async-storage';

const VIBRATION_KEY = '@wakely_pref_vibration';
const DEFAULT_SOUND_KEY = '@wakely_default_sound';
const DEFAULT_AUTODISMISS_KEY = '@wakely_default_autodismiss';

export const getVibrationEnabled = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(VIBRATION_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
};

export const setVibrationEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(VIBRATION_KEY, enabled ? '1' : '0');
};

export const getDefaultSoundId = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(DEFAULT_SOUND_KEY)) ?? 'classic';
  } catch {
    return 'classic';
  }
};

export const setDefaultSoundId = async (id: string): Promise<void> => {
  await AsyncStorage.setItem(DEFAULT_SOUND_KEY, id);
};

export const getDefaultAutoDismiss = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(DEFAULT_AUTODISMISS_KEY);
    const minutes = raw ? Number(raw) : NaN;
    return Number.isFinite(minutes) ? minutes : 30;
  } catch {
    return 30;
  }
};

export const setDefaultAutoDismiss = async (minutes: number): Promise<void> => {
  await AsyncStorage.setItem(DEFAULT_AUTODISMISS_KEY, String(minutes));
};
