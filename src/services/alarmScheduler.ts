import { Alert, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type NativeAndroidChannel,
  type TimestampTrigger,
} from '@notifee/react-native';

import type { StoredAlarm } from '../storage/alarmStorage';
import { buildTriggers } from '../utils/nextTrigger';
import {
  getAutoDismissMinutes,
  getMissionChain,
  getSnoozeMinutes,
  getWakeCheckMinutes,
  missionChainTitle,
} from '../storage/alarmStorage';

export const ALARM_CHANNEL_ID = 'Wakely Alarms';

export const SNOOZE_MINUTES = 5;
export const MAX_SNOOZES = 3;
/** Untouched ringing escalates to the extra-loud backup after this long. */
export const BACKUP_DELAY_MS = 40_000;
/** Grace period on the wake-up check screen before a full re-ring. */
export const WAKE_CHECK_GRACE_MS = 60_000;

export type ScheduleResult =
  | { ok: true }
  | { ok: false; reason: 'notifications' | 'exact-alarm' | 'error' };

export const triggerIdFor = (alarmId: string, key: string) => `${alarmId}:${key}`;
const idFor = triggerIdFor;
const KEYS = [
  'once',
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'snooze',
  'backup',
  'wakecheck',
  'wakerering',
];

/** Channel per tone so each alarm rings its own sound. */
export const channelIdForSound = (soundId: string) => `wakely_${soundId}`;

/** Bundled file for a tone id (Android res/raw name / iOS bundle wav). */
const soundFileFor = (soundId: string, file?: string): string | undefined => {
  if (soundId === 'vibrate') return 'silence';
  return file;
};

/**
 * True when the on-device channel already matches what we are about to
 * request. Android freezes a channel's sound/vibration/importance/bypassDnd
 * at creation time ("cannot be overridden once the channel is created"), so
 * a stale channel must be deleted and recreated — otherwise the alarm (and
 * the test-ring preview) stays silent even though scheduling "succeeds".
 */
export const channelMatchesSpec = (
  existing: NativeAndroidChannel,
  expectedFile: string | undefined,
  vibration: boolean,
): boolean => {
  // Anything below HIGH won't reliably ring.
  if (existing.importance !== AndroidImportance.HIGH) return false;
  if ((existing.vibration ?? true) !== vibration) return false;
  // bypassDnd is undefined on API < 29 where the setting doesn't exist.
  if (existing.bypassDnd === false) return false;
  if (expectedFile) {
    // soundURI looks like android.resource://<package>/raw/<name>.
    const uri = existing.soundURI ?? '';
    if (!uri || !uri.includes(expectedFile)) return false;
  }
  return true;
};

type ChannelSpec = {
  id: string;
  name: string;
  /** Raw resource name (Android) / wav basename (iOS). Absent = system default. */
  file?: string;
  vibration: boolean;
};

/**
 * Creates the channel, or deletes + recreates it when the frozen on-device
 * copy no longer matches (different tone, vibration flip, lowered
 * importance, missing DND bypass). Returns the channel id. iOS has no
 * channels, so there it is a plain create.
 */
async function syncChannel(spec: ChannelSpec): Promise<string> {
  const channel = {
    id: spec.id,
    name: spec.name,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    // Android wants the raw name, iOS wants the bundled filename.
    ...(spec.file ? { sound: Platform.OS === 'ios' ? `${spec.file}.wav` : spec.file } : {}),
    vibration: spec.vibration,
    bypassDnd: true,
  };
  if (Platform.OS === 'android' && spec.file) {
    try {
      const existing = await notifee.getChannel(spec.id);
      if (existing) {
        if (channelMatchesSpec(existing, spec.file, spec.vibration)) return spec.id;
        // Stale channel: sound/vibration/importance are frozen, so the only
        // way to apply the new tone is to delete and recreate the channel.
        await notifee.deleteChannel(spec.id);
      }
    } catch (error) {
      // get/delete failing must never block scheduling — fall through and
      // (re)create below; a create on an existing channel is a safe no-op.
      console.warn(`Channel sync for ${spec.id} fell back to create:`, error);
    }
  }
  await notifee.createChannel(channel);
  return spec.id;
}

async function ensureChannelForSound(opts: {
  soundId: string;
  soundName: string;
  file?: string;
  vibration: boolean;
}): Promise<string> {
  const id = channelIdForSound(opts.soundId);
  const file = soundFileFor(opts.soundId, opts.file);
  return syncChannel({ id, name: `Wakely ${opts.soundName}`, file, vibration: opts.vibration });
}

/** Legacy single channel (kept for vibration-preference rebuilds). */
async function ensureChannel(vibration = true) {
  return syncChannel({ id: ALARM_CHANNEL_ID, name: 'Wakely Alarms', vibration });
}

/** Rebuild the channel with the user's vibration preference. */
export async function applyVibrationPreference(vibration: boolean): Promise<void> {
  try {
    await ensureChannel(vibration);
  } catch (error) {
    console.error('Failed to apply vibration preference:', error);
  }
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
export async function scheduleAlarm(
  alarm: StoredAlarm,
  opts?: { vibration?: boolean },
): Promise<ScheduleResult> {
  let step = 'cancel old schedule';
  try {
    await cancelAlarm(alarm.id);
    if (!alarm.enabled) return { ok: true };

    step = 'check permissions';
    const permission = await ensureAlarmPermissions();
    if (!permission.ok) return permission;

    step = 'create notification channel';
    const channelId = await ensureChannelForSound({
      soundId: alarm.sound.id,
      soundName: alarm.sound.name,
      file: alarm.sound.file,
      vibration: opts?.vibration ?? true,
    });

    step = 'create trigger notification';

    const chain = getMissionChain(alarm);
    const autoDismiss = getAutoDismissMinutes(alarm);
    for (const t of buildTriggers(alarm)) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: t.at.getTime(),
        alarmManager: { type: AlarmType.SET_ALARM_CLOCK }, // real-time exact system alarm, bypasses Doze
        ...(t.repeat ? { repeatFrequency: RepeatFrequency.WEEKLY } : {}),
      };

      await notifee.createTriggerNotification(
        {
          id: idFor(alarm.id, t.key),
          title: `Wake up! ${alarm.time} ${alarm.period}`,
          body:
            chain.length > 1
              ? `${missionChainTitle(alarm)} — complete all ${chain.length} to stop`
              : alarm.mission?.title ?? 'Complete your mission to stop the alarm',
          data: { alarmId: alarm.id },
          android: {
            channelId,
            category: AndroidCategory.ALARM,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            loopSound: true,
            ongoing: true,
            autoCancel: false,
            // Failsafe: silence itself if the user never touches it.
            ...(autoDismiss > 0 ? { timeoutAfter: autoDismiss * 60 * 1000 } : {}),
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

/**
 * Snoozes a ringing alarm: silences it now and fires once more after
 * `minutes`. Weekly triggers are untouched. Returns the new snooze count
 * so the UI can cap it at MAX_SNOOZES.
 */
export async function snoozeAlarm(
  alarm: StoredAlarm,
  snoozeCount: number,
  minutes?: number,
  opts?: { vibration?: boolean },
): Promise<ScheduleResult> {
  const length = minutes ?? getSnoozeMinutes(alarm);
  try {
    await stopRinging(alarm.id);
    // Snoozing is engagement: kill a pending backup blast too.
    await notifee.cancelNotification(idFor(alarm.id, 'backup'));
    // Remove any previous snooze trigger so rapid taps can't stack rings.
    await notifee.cancelNotification(idFor(alarm.id, 'snooze'));

    const permission = await ensureAlarmPermissions();
    if (!permission.ok) return permission;

    const channelId = await ensureChannelForSound({
      soundId: alarm.sound.id,
      soundName: alarm.sound.name,
      file: alarm.sound.file,
      vibration: opts?.vibration ?? true,
    });
    const nextCount = snoozeCount + 1;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + length * 60 * 1000,
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    };

    const chain = getMissionChain(alarm);
    const autoDismiss = getAutoDismissMinutes(alarm);
    await notifee.createTriggerNotification(
      {
        id: idFor(alarm.id, 'snooze'),
        title: `Wake up! ${alarm.time} ${alarm.period} (snoozed)`,
        body: chain[0]?.title ?? 'Complete your mission to stop the alarm',
        data: { alarmId: alarm.id, snoozeCount: nextCount },
        android: {
          channelId,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          loopSound: true,
          ongoing: true,
          autoCancel: false,
          ...(autoDismiss > 0 ? { timeoutAfter: autoDismiss * 60 * 1000 } : {}),
          fullScreenAction: { id: 'default', launchActivity: 'default' },
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      },
      trigger,
    );
    return { ok: true };
  } catch (error) {
    console.error('Error snoozing alarm:', error);
    return { ok: false, reason: 'error' };
  }
}

/** Call once on app start: keeps schedules correct after updates / reboots. */
export async function rescheduleAll(alarms: StoredAlarm[], opts?: { vibration?: boolean }) {
  for (const alarm of alarms) await scheduleAlarm(alarm, opts);
}

const ringingAndroid = (
  channelId: string,
  autoDismiss: number,
): {
  channelId: string;
  category: AndroidCategory.ALARM;
  importance: AndroidImportance.HIGH;
  visibility: AndroidVisibility.PUBLIC;
  loopSound: boolean;
  ongoing: boolean;
  autoCancel: boolean;
  timeoutAfter?: number;
  fullScreenAction: { id: string; launchActivity: 'default' };
  pressAction: { id: string; launchActivity: 'default' };
} => ({
  channelId,
  category: AndroidCategory.ALARM,
  importance: AndroidImportance.HIGH,
  visibility: AndroidVisibility.PUBLIC,
  loopSound: true,
  ongoing: true,
  autoCancel: false,
  ...(autoDismiss > 0 ? { timeoutAfter: autoDismiss * 60 * 1000 } : {}),
  fullScreenAction: { id: 'default', launchActivity: 'default' },
  pressAction: { id: 'default', launchActivity: 'default' },
});

/**
 * Backup watchdog: if the alarm rings and nobody engages within BACKUP_DELAY,
 * blast the extra-loud tone. Cancelled on mission start / success / snooze.
 */
export async function scheduleBackup(
  alarm: StoredAlarm,
  opts?: { vibration?: boolean },
): Promise<void> {
  try {
    await notifee.cancelNotification(idFor(alarm.id, 'backup'));
    const channelId = await ensureChannelForSound({
      soundId: 'backup',
      soundName: 'Extra Loud',
      file: 'extra_loud',
      vibration: opts?.vibration ?? true,
    });
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + BACKUP_DELAY_MS,
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    };
    await notifee.createTriggerNotification(
      {
        id: idFor(alarm.id, 'backup'),
        title: `STILL ASLEEP? ${alarm.time} ${alarm.period}`,
        body: 'Extra-loud backup — start your mission now',
        data: { alarmId: alarm.id, backup: 1 },
        android: ringingAndroid(channelId, getAutoDismissMinutes(alarm)),
      },
      trigger,
    );
  } catch (error) {
    console.error('Failed to schedule backup sound:', error);
  }
}

export async function cancelBackup(alarmId: string): Promise<void> {
  try {
    await notifee.cancelNotification(idFor(alarmId, 'backup'));
    await notifee.cancelDisplayedNotification(idFor(alarmId, 'backup'));
  } catch (error) {
    console.error('Failed to cancel backup sound:', error);
  }
}

/**
 * Wake-up check: minutes after dismiss, ask "Still awake?". The check screen
 * gets WAKE_CHECK_GRACE of grace; a parallel re-ring trigger catches a killed
 * app or an ignored check and rings the full mission again.
 */
export async function scheduleWakeCheck(
  alarm: StoredAlarm,
  opts?: { vibration?: boolean },
): Promise<void> {
  const minutes = getWakeCheckMinutes(alarm);
  if (minutes <= 0) return;
  try {
    await cancelWakeCheck(alarm.id);
    const channelId = await ensureChannelForSound({
      soundId: alarm.sound.id,
      soundName: alarm.sound.name,
      file: alarm.sound.file,
      vibration: opts?.vibration ?? true,
    });
    const at = Date.now() + minutes * 60 * 1000;
    const checkTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: at,
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    };
    await notifee.createTriggerNotification(
      {
        id: idFor(alarm.id, 'wakecheck'),
        title: 'Still awake?',
        body: 'Tap to confirm — or the full alarm re-rings in 1 minute',
        data: { alarmId: alarm.id, wakecheck: 1 },
        android: {
          channelId,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          autoCancel: true,
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      },
      checkTrigger,
    );
    const reringTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: at + WAKE_CHECK_GRACE_MS,
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    };
    await notifee.createTriggerNotification(
      {
        id: idFor(alarm.id, 'wakerering'),
        title: `Wake up! ${alarm.time} ${alarm.period}`,
        body: 'You fell back asleep — missions restart now',
        data: { alarmId: alarm.id, wakerering: 1, snoozeCount: 0 },
        android: ringingAndroid(channelId, getAutoDismissMinutes(alarm)),
      },
      reringTrigger,
    );
  } catch (error) {
    console.error('Failed to schedule wake-up check:', error);
  }
}

export async function cancelWakeCheck(alarmId: string): Promise<void> {
  try {
    await Promise.all([
      notifee.cancelNotification(idFor(alarmId, 'wakecheck')),
      notifee.cancelDisplayedNotification(idFor(alarmId, 'wakecheck')),
      notifee.cancelNotification(idFor(alarmId, 'wakerering')),
      notifee.cancelDisplayedNotification(idFor(alarmId, 'wakerering')),
    ]);
  } catch (error) {
    console.error('Failed to cancel wake-up check:', error);
  }
}

/**
 * Lone re-ring safety net (+60s full mission). Armed when the check screen
 * opens so killing the app mid-check still brings the alarm back.
 */
export async function scheduleWakeRering(
  alarm: StoredAlarm,
  opts?: { vibration?: boolean },
): Promise<void> {
  try {
    const channelId = await ensureChannelForSound({
      soundId: alarm.sound.id,
      soundName: alarm.sound.name,
      file: alarm.sound.file,
      vibration: opts?.vibration ?? true,
    });
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + WAKE_CHECK_GRACE_MS,
      alarmManager: { allowWhileIdle: true },
    };
    await notifee.createTriggerNotification(
      {
        id: idFor(alarm.id, 'wakerering'),
        title: `Wake up! ${alarm.time} ${alarm.period}`,
        body: 'You fell back asleep — missions restart now',
        data: { alarmId: alarm.id, wakerering: 1, snoozeCount: 0 },
        android: ringingAndroid(channelId, getAutoDismissMinutes(alarm)),
      },
      trigger,
    );
  } catch (error) {
    console.error('Failed to schedule wake re-ring:', error);
  }
}

/**
 * Real tone preview through the actual alarm channel: plays ~6s then stops.
 */
export async function previewSound(
  soundId: string,
  soundName: string,
  file?: string,
): Promise<void> {
  try {
    const permission = await ensureAlarmPermissions();
    if (!permission.ok) {
      promptFixPermissions(permission);
      return;
    }
    const channelId = await ensureChannelForSound({
      soundId,
      soundName,
      file,
      vibration: false,
    });
    await notifee.displayNotification({
      id: `preview:${soundId}:${Date.now()}`,
      title: 'Wakely preview',
      body: soundName,
      android: {
        channelId,
        pressAction: { id: 'default' },
        autoCancel: true,
        timeoutAfter: 6000,
      },
      ios: file ? { sound: `${file}.wav` } : undefined,
    });
  } catch (error) {
    console.error('Failed to preview sound:', error);
  }
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
