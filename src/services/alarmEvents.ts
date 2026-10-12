import notifee, { EventType, type Event } from '@notifee/react-native';
import { navigationRef } from '../navigation/navigationRef';
import { getAlarms } from '../storage/alarmStorage';

let pendingAlarmId: string | null = null;

async function open(alarmId: string): Promise<void> {
  if (!navigationRef.isReady()) {
    pendingAlarmId = alarmId;
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
  navigationRef.navigate('Main', {
    screen: 'Alarm',
    params: {
      screen: 'AlarmRinging',
      params: { alarm },
    },
  });
}

/** Opens a pending alarm after NavigationContainer becomes ready. */
export function flushPendingAlarm(): void {
  if (pendingAlarmId) {
    const alarmId = pendingAlarmId;
    pendingAlarmId = null;
    void open(alarmId);
  }
}

function handle({ type, detail }: Event): void {
  const alarmId = detail.notification?.data?.alarmId;

  if (typeof alarmId !== 'string') {
    return;
  }

  // Open the alarm when its notification is delivered or pressed.
  if (type === EventType.DELIVERED || type === EventType.PRESS) {
    void open(alarmId);
  }
}

/** Registers foreground events and handles the notification that launched the app. */
export function startAlarmEvents(): () => void {
  void notifee
    .getInitialNotification()
    .then(initial => {
      const alarmId = initial?.notification?.data?.alarmId;

      if (typeof alarmId === 'string') {
        return open(alarmId);
      }
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
