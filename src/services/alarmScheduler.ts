import { Alert } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import type { StoredAlarm } from '../storage/alarmStorage';
import { buildTriggers } from '../utils/nextTrigger';

export const ALARM_CHANNEL_ID = 'alarm';

export type ScheduleResult =
  | { ok: true }
  | { ok: false; reason: 'notifications' | 'exact-alarm' | 'error' };

const idFor = (alarmId: string, key: string) => `${alarmId}:${key}`;
const KEYS = ['once', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function ensureChannel() {
  return notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    bypassDnd: true,
  });
}

/** Asks for notification permission and checks the Android 12+ exact-alarm setting. */
export async function ensureAlarmPermissions(): Promise<ScheduleResult> {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    return { ok: false, reason: 'notifications' };
  }
  const current = await notifee.getNotificationSettings();
  if (current.android.alarm === AndroidNotificationSetting.DISABLED) {
    return { ok: false, reason: 'exact-alarm' };
  }
  return { ok: true };
}

export async function cancelAlarm(alarmId: string) {
  // cancelNotification removes both the pending trigger and any shown notification.
  await Promise.all(KEYS.map(k => notifee.cancelNotification(idFor(alarmId, k))));
}

/**
 * Stops the ringing sound / removes the on-screen notification for this alarm
 * WITHOUT cancelling its future weekly triggers.
 */
export async function stopRinging(alarmId: string) {
  await Promise.all(KEYS.map(k => notifee.cancelDisplayedNotification(idFor(alarmId, k))));
}

/** (Re)schedules an alarm. Disabled alarms are cancelled instead. */
export async function scheduleAlarm(alarm: StoredAlarm): Promise<ScheduleResult> {
  let step = 'cancel old schedule';
  try {
    await cancelAlarm(alarm.id);
    if (!alarm.enabled) return { ok: true };

    step = 'check permissions';
    const permission = await ensureAlarmPermissions();
    if (!permission.ok) return permission;

    step = 'create notification channel';
    const channelId = await ensureChannel();

    step = 'create trigger notification';

    for (const t of buildTriggers(alarm)) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: t.at.getTime(),
        alarmManager: { allowWhileIdle: true }, // exact alarm, fires in Doze
        ...(t.repeat ? { repeatFrequency: RepeatFrequency.WEEKLY } : {}),
      };

      await notifee.createTriggerNotification(
        {
          id: idFor(alarm.id, t.key),
          title: `Wake up! ${alarm.time} ${alarm.period}`,
          body: alarm.mission?.title ?? 'Complete your mission to stop the alarm',
          data: { alarmId: alarm.id },
          android: {
            channelId,
            category: AndroidCategory.ALARM,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            loopSound: true,
            ongoing: true,
            autoCancel: false,
            // Opens the app over the lock screen.
            fullScreenAction: { id: 'default', launchActivity: 'default' },
            pressAction: { id: 'default', launchActivity: 'default' },
          },
        },
        trigger,
      );
    }
    return { ok: true };
  } catch (error) {
    // The step name tells you which Notifee call failed.
    console.error(`Error scheduling alarm (step: ${step}):`, error);
    return { ok: false, reason: 'error' };
  }
}

/** Call once on app start: keeps schedules correct after updates / reboots. */
export async function rescheduleAll(alarms: StoredAlarm[]) {
  for (const alarm of alarms) await scheduleAlarm(alarm);
}

/** Explains what to fix when scheduling was refused. */
export function promptFixPermissions(result: ScheduleResult) {
  if (result.ok) return;
  if (result.reason === 'exact-alarm') {
    Alert.alert(
      'Allow alarms & reminders',
      'Android needs this permission to ring at the exact time. Turn it on, then save the alarm again.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => notifee.openAlarmPermissionSettings() },
      ],
    );
  } else if (result.reason === 'notifications') {
    Alert.alert(
      'Allow notifications',
      'Alarms ring through notifications. Turn them on in system settings so the alarm can wake you.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => notifee.openNotificationSettings() },
      ],
    );
  } else {
    Alert.alert(
      'Alarm not scheduled',
      'Something went wrong while scheduling this alarm. Please try again.',
    );
  }
}
