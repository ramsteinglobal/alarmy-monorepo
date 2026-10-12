import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { firebaseAuth } from '../config/firebaseSetup';
import { getAlarms, type StoredAlarm } from '../storage/alarmStorage';
import { getAlarmHistory, saveAlarmHistory, type AlarmHistoryItem } from '../storage/alarmHistory';
import type { SleepLog } from '../storage/sleepStorage';

const alarmsOf = (uid: string) => collection(getFirestore(), 'users', uid, 'alarms');
const historyOf = (uid: string) => collection(getFirestore(), 'users', uid, 'history');
const sleepOf = (uid: string) => collection(getFirestore(), 'users', uid, 'sleep');

const currentUid = (): string | null => firebaseAuth.currentUser?.uid ?? null;

/** Push one alarm to the cloud (merge). No-op for guests. */
export const pushAlarm = async (alarm: StoredAlarm): Promise<void> => {
  const uid = currentUid();
  if (!uid) return;
  try {
    await setDoc(
      doc(alarmsOf(uid), alarm.id),
      { ...alarm, userId: uid, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.error('Cloud sync: push alarm failed:', error);
  }
};

/** Remove one alarm from the cloud. No-op for guests. */
export const pushAlarmDelete = async (alarmId: string): Promise<void> => {
  const uid = currentUid();
  if (!uid) return;
  try {
    await deleteDoc(doc(alarmsOf(uid), alarmId));
  } catch (error) {
    console.error('Cloud sync: delete alarm failed:', error);
  }
};

/** Push one history record to the cloud. No-op for guests. */
export const pushHistoryItem = async (item: AlarmHistoryItem): Promise<void> => {
  const uid = currentUid();
  if (!uid) return;
  try {
    await setDoc(doc(historyOf(uid), item.id), { ...item, userId: uid }, { merge: true });
  } catch (error) {
    console.error('Cloud sync: push history failed:', error);
  }
};

/** Push one sleep log to the cloud. No-op for guests. */
export const pushSleepLog = async (log: SleepLog): Promise<void> => {
  const uid = currentUid();
  if (!uid) return;
  try {
    await setDoc(doc(sleepOf(uid), log.date), { ...log, userId: uid }, { merge: true });
  } catch (error) {
    console.error('Cloud sync: push sleep log failed:', error);
  }
};

type SyncSummary = { pulled: number; pushed: number };

/**
 * First-run / new-device sync: pull cloud records missing locally, then push
 * everything local up. Local records win on conflict (last writer is the phone
 * in hand). Best-effort — failures only log.
 */
export const initialCloudSync = async (
  saveAlarms: (alarms: StoredAlarm[]) => Promise<void>,
): Promise<SyncSummary> => {
  const summary: SyncSummary = { pulled: 0, pushed: 0 };
  const uid = currentUid();
  if (!uid) return summary;
  try {
    const [localAlarms, localHistory, cloudAlarmsSnap, cloudHistorySnap] = await Promise.all([
      getAlarms(),
      getAlarmHistory(),
      getDocs(alarmsOf(uid)),
      getDocs(historyOf(uid)),
    ]);

    const localAlarmIds = new Set(localAlarms.map(a => a.id));
    const missingAlarms = cloudAlarmsSnap.docs
      .map(d => d.data() as StoredAlarm)
      .filter(a => a && a.id && !localAlarmIds.has(a.id));
    if (missingAlarms.length > 0) {
      await saveAlarms([...localAlarms, ...missingAlarms]);
      summary.pulled += missingAlarms.length;
    }

    const localHistoryIds = new Set(localHistory.map(h => h.id));
    const missingHistory = cloudHistorySnap.docs
      .map(d => d.data() as AlarmHistoryItem)
      .filter(h => h && h.id && !localHistoryIds.has(h.id));

    // Push local records up (merge keeps cloud complete on every device).
    await Promise.all([
      ...localAlarms.map(a =>
        setDoc(
          doc(alarmsOf(uid), a.id),
          { ...a, userId: uid, updatedAt: serverTimestamp() },
          { merge: true },
        ),
      ),
      ...localHistory.map(h =>
        setDoc(doc(historyOf(uid), h.id), { ...h, userId: uid }, { merge: true }),
      ),
    ]);
    summary.pushed += localAlarms.length + localHistory.length;

    if (missingHistory.length > 0) {
      await saveAlarmHistory([...missingHistory, ...localHistory]);
      summary.pulled += missingHistory.length;
    }
  } catch (error) {
    console.error('Cloud sync: initial sync failed:', error);
  }
  return summary;
};
