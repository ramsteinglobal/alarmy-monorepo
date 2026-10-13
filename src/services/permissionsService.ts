import { Linking, Platform } from 'react-native';
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

export type ReliabilityStatus = {
  /** System notifications (alarm rings through these). */
  notifications: 'granted' | 'denied' | 'unknown';
  /** Android 12+ exact-alarm access. iOS reports 'unknown' (not applicable). */
  exactAlarm: 'granted' | 'denied' | 'unknown';
  /** Battery optimization can delay or kill alarms on some OEMs. */
  batteryUnrestricted: boolean | null;
  /**
   * Xiaomi/Oppo/Vivo-style autostart gate exists on this device. OS state
   * can't be read from JS, so when true the UI must offer the fix button.
   */
  autostartNeeded: boolean;
  /**
   * Android 14+ full-screen-intent access (alarm popping over the lock
   * screen). Not readable from JS without native code — 'unknown' means
   * "show the CHECK row", 'na' means "not applicable, hide the row".
   */
  fullScreenOverlay: 'unknown' | 'na';
};

/** Android 14 (API 34) moved full-screen alarms behind a per-app toggle. */
export const needsFullScreenIntentRow = (): boolean =>
  Platform.OS === 'android' && Number(Platform.Version) >= 34;

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

    // OEM autostart gates (Xiaomi/ Oppo/ Vivo/ OnePlus…) silently swallow
    // alarms fired while the app is closed. Notifee knows whether this
    // device has such a screen — if it does, the user must enable it.
    let autostartNeeded = false;
    if (Platform.OS === 'android') {
      try {
        const info = await notifee.getPowerManagerInfo();
        autostartNeeded = !!info.activity;
      } catch {
        autostartNeeded = false;
      }
    }

    return {
      notifications,
      exactAlarm,
      batteryUnrestricted,
      autostartNeeded,
      fullScreenOverlay: needsFullScreenIntentRow() ? 'unknown' : 'na',
    };
  } catch {
    return {
      notifications: 'unknown',
      exactAlarm: 'unknown',
      batteryUnrestricted: null,
      autostartNeeded: false,
      fullScreenOverlay: needsFullScreenIntentRow() ? 'unknown' : 'na',
    };
  }
}

export const openSystemNotificationSettings = () => notifee.openNotificationSettings();

export const openExactAlarmSettings = () => notifee.openAlarmPermissionSettings();

export const openBatterySettings = () => notifee.openBatteryOptimizationSettings();

/** Opens the OEM autostart / background-pop-up screen (Xiaomi, Oppo, Vivo…). */
export const openAutostartSettings = () => notifee.openPowerManagerSettings();

/**
 * Opens Android 14+ "Manage full screen intents" for this app so the alarm
 * is allowed to pop over the lock screen. Falls back to the notification
 * settings screen on older Android or when the intent is unavailable.
 */
export const openFullScreenIntentSettings = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  if (Number(Platform.Version) >= 34) {
    try {
      await Linking.sendIntent('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT');
      return;
    } catch {
      // Fall through to the notification settings screen below.
    }
  }
  await notifee.openNotificationSettings();
};
