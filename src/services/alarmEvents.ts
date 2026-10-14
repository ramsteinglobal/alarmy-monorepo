import notifee, { EventType, type Event } from '@notifee/react-native';
import { navigationRef } from '../navigation/navigationRef';
import { getAlarms } from '../storage/alarmStorage';
import { scheduleBackup } from './alarmScheduler';

type PendingAlarm = { alarmId: string; snoozeCount: number; wakeCheck: boolean };

let pendingAlarm: PendingAlarm | null = null;

const RINGING_ROUTES = ['AlarmRinging', 'MissionExecution', 'WakeCheck'];

async function openRinging(alarmId: string, snoozeCount = 0): Promise<void> {
  if (!navigationRef.isReady()) {
    pendingAlarm = { alarmId, snoozeCount, wakeCheck: false };
    return;
  }

  // Avoid opening another alarm screen while an alarm or mission is active.
  const current = navigationRef.getCurrentRoute()?.name;

  if (current === 'AlarmRinging' || current === 'MissionExecution') {
    return;
  }

  const alarm = (await getAlarms()).find(item => item.id === alarmId);

  if (!alarm) {
    console.warn(`Alarm not found: ${alarmId}`);
    return;
  }

  // AlarmRinging is nested inside the Alarm tab navigator.
  // AlarmRinging is now at the root stack level (fullScreenModal) so the
  // tab bar is hidden during alarm execution. No nested navigate needed.
  navigationRef.navigate('AlarmRinging', { alarm, snoozeCount });
}

async function openWakeCheck(alarmId: string): Promise<void> {
  if (!navigationRef.isReady()) {
    pendingAlarm = { alarmId, snoozeCount: 0, wakeCheck: true };
    return;
  }

  const current = navigationRef.getCurrentRoute()?.name;
  if (RINGING_ROUTES.includes(current ?? '')) {
    return;
  }

  const alarm = (await getAlarms()).find(item => item.id === alarmId);
  if (!alarm) {
    console.warn(`Alarm not found: ${alarmId}`);
    return;
  }

  // WakeCheck is now at the root stack level — navigate directly.
  navigationRef.navigate('WakeCheck', { alarm });
}

/** Opens a pending alarm after NavigationContainer becomes ready. */
export function flushPendingAlarm(): void {
  if (pendingAlarm) {
    const { alarmId, snoozeCount, wakeCheck } = pendingAlarm;
    pendingAlarm = null;
    if (wakeCheck) void openWakeCheck(alarmId);
    else void openRinging(alarmId, snoozeCount);
  }
}

function handle({ type, detail }: Event): void {
  if (type !== EventType.DELIVERED && type !== EventType.PRESS) {
    return;
  }
  const data = detail.notification?.data;
  const alarmId = data?.alarmId;

  if (typeof alarmId !== 'string') {
    return;
  }

  const rawCount = data?.snoozeCount;
  const snoozeCount = typeof rawCount === 'number' ? rawCount : 0;

  // Re-ring after an ignored wake-up check: full mission, straight to Ringing.
  if (data?.wakerering) {
    void openRinging(alarmId, 0);
    return;
  }

  // Wake-up check: confirm screen (killed-app taps land here too).
  if (data?.wakecheck) {
    void openWakeCheck(alarmId);
    return;
  }

  // Backup escalation while the user is already engaged: silence it.
  if (data?.backup) {
    const current = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
    if (current === 'AlarmRinging' || current === 'MissionExecution') {
      void notifee.cancelDisplayedNotification(detail.notification?.id ?? `${alarmId}:backup`);
      return;
    }
    void openRinging(alarmId, snoozeCount);
    return;
  }

  // A real ring landed: arm the 40s extra-loud backup, then open Ringing.
  void getAlarms()
    .then(alarms => {
      const alarm = alarms.find(item => item.id === alarmId);
      if (alarm) void scheduleBackup(alarm);
    })
    .catch(error => console.error('Failed to arm backup sound:', error));
  void openRinging(alarmId, snoozeCount);
}

/** Registers foreground events and handles the notification that launched the app. */
export function startAlarmEvents(): () => void {
  void notifee
    .getInitialNotification()
    .then(initial => {
      const data = initial?.notification?.data;
      const alarmId = data?.alarmId;

      if (typeof alarmId !== 'string') {
        return;
      }
      if (data?.wakerering) {
        return openRinging(alarmId, 0);
      }
      if (data?.wakecheck) {
        return openWakeCheck(alarmId);
      }
      const rawCount = data?.snoozeCount;
      return openRinging(alarmId, typeof rawCount === 'number' ? rawCount : 0);
    })
    .catch(error => {
      console.warn('Failed to retrieve the initial alarm notification:', error);
    });

  return notifee.onForegroundEvent(handle);
}

/** Registers notification handling while the app is in the background. */
export function registerBackgroundHandler(): void {
  notifee.onBackgroundEvent(async event => {
    handle(event);
  });
}
