import notifee, { EventType, type Event } from '@notifee/react-native';
import { navigationRef } from '../navigation/navigationRef';
import { getAlarms } from '../storage/alarmStorage';

let pendingAlarmId: string | null = null;

async function open(alarmId: string) {
  if (!navigationRef.isReady()) {
    pendingAlarmId = alarmId; // flushed from NavigationContainer onReady
    return;
  }
  // Already ringing / in a mission: do not stack another copy.
  const current = navigationRef.getCurrentRoute()?.name;
  if (current === 'AlarmRinging' || current === 'MissionExecution') return;

  const alarm = (await getAlarms()).find(a => a.id === alarmId);
  navigationRef.navigate('AlarmRinging', { alarm });
}

/** Call from NavigationContainer onReady. */
export function flushPendingAlarm() {
  if (pendingAlarmId) {
    const id = pendingAlarmId;
    pendingAlarmId = null;
    open(id);
  }
}

function handle({ type, detail }: Event) {
  const alarmId = detail.notification?.data?.alarmId;
  if (typeof alarmId !== 'string') return;
  // DELIVERED = it just fired while the app is open; PRESS = user tapped it.
  if (type === EventType.DELIVERED || type === EventType.PRESS) open(alarmId);
}

/** Foreground listener + the notification that launched the app. Returns an unsubscribe. */
export function startAlarmEvents() {
  notifee.getInitialNotification().then(initial => {
    const id = initial?.notification?.data?.alarmId;
    if (typeof id === 'string') open(id);
  });
  return notifee.onForegroundEvent(handle);
}

/** Register in index.js so taps are handled while the app is in the background. */
export function registerBackgroundHandler() {
  notifee.onBackgroundEvent(async event => handle(event));
}
