import { NativeModules, Platform } from 'react-native';
import { previewSound as fallbackPreviewSound } from './alarmScheduler';

const { NativeAudioPlayer } = NativeModules;

export type SystemRingtone = {
  title: string;
  uri: string;
};

/**
 * Plays sound preview natively using Android MediaPlayer with USAGE_ALARM.
 * This guarantees audio plays at full volume without notification silencing.
 */
export async function playSoundPreview(
  soundId: string,
  soundName: string,
  file?: string,
  uri?: string,
): Promise<void> {
  if (uri && NativeAudioPlayer?.playUri) {
    try {
      await NativeAudioPlayer.playUri(uri);
      return;
    } catch (err) {
      console.warn('NativeAudioPlayer.playUri failed:', err);
    }
  }

  if (file && NativeAudioPlayer?.playRawSound) {
    try {
      await NativeAudioPlayer.playRawSound(file);
      return;
    } catch (err) {
      console.warn('NativeAudioPlayer.playRawSound failed, falling back to notifee:', err);
    }
  }

  // Fallback to notifee preview if native module is not yet compiled or unavailable
  if (file) {
    await fallbackPreviewSound(soundId, soundName, file);
  }
}

/**
 * Stops any actively playing preview sound immediately.
 */
export async function stopSoundPreview(): Promise<void> {
  if (NativeAudioPlayer?.stopSound) {
    try {
      await NativeAudioPlayer.stopSound();
    } catch (err) {
      console.warn('NativeAudioPlayer.stopSound failed:', err);
    }
  }
}

/**
 * Fetches default system alarm ringtones available on Android device.
 */
export async function fetchSystemRingtones(): Promise<SystemRingtone[]> {
  if (Platform.OS === 'android' && NativeAudioPlayer?.getSystemRingtones) {
    try {
      const ringtones = await NativeAudioPlayer.getSystemRingtones();
      return Array.isArray(ringtones) ? ringtones : [];
    } catch (err) {
      console.warn('Failed to fetch system ringtones:', err);
      return [];
    }
  }
  return [];
}
