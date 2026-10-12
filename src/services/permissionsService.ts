import { Platform } from 'react-native';
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

export type ReliabilityStatus = {
  /** System notifications (alarm rings through these). */
  notifications: 'granted' | 'denied' | 'unknown';
  /** Android 12+ exact-alarm access. iOS reports 'unknown' (not applicable). */
  exactAlarm: 'granted' | 'denied' | 'unknown';
  /** Battery optimization can delay or kill alarms on some OEMs. */
  batteryUnrestricted: boolean | null;
};

/** Read-only snapshot of everything the OS needs to ring reliably. */
export async function getAlarmReliabilityStatus(): Promise<ReliabilityStatus> {
  try {
    const settings = await notifee.getNotificationSettings();
    const notifications =
      settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED ? 'granted' : 'denied';

    let exactAlarm: ReliabilityStatus['exactAlarm'] = 'unknown';
    if (Platform.OS === 'android') {
      exactAlarm =
        settings.android.alarm === AndroidNotificationSetting.ENABLED ? 'granted' : 'denied';
    }

    let batteryUnrestricted: boolean | null = null;
    if (Platform.OS === 'android') {
      try {
        batteryUnrestricted = !(await notifee.isBatteryOptimizationEnabled());
      } catch {
        batteryUnrestricted = null;
      }
    }

    return { notifications, exactAlarm, batteryUnrestricted };
  } catch {
    return { notifications: 'unknown', exactAlarm: 'unknown', batteryUnrestricted: null };
  }
}

export const openSystemNotificationSettings = () => notifee.openNotificationSettings();

export const openExactAlarmSettings = () => notifee.openAlarmPermissionSettings();

export const openBatterySettings = () => notifee.openBatteryOptimizationSettings();
