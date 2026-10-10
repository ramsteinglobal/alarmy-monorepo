import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

type Alarm = Record<string, any> & { id: string };

const alarmsCollection = collection(db, 'alarms');

export function subscribeToUserAlarms(userId: string, onChange: (alarms: Alarm[]) => void) {
  const q = query(alarmsCollection, where('userId', '==', userId));
  return onSnapshot(q, snapshot => {
    onChange(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Alarm, 'id'>) })));
  });
}

export async function createAlarm(alarm: Omit<Alarm, 'id'>) {
  return addDoc(alarmsCollection, alarm);
}

export async function updateAlarm(id: string, patch: Partial<Alarm>) {
  return updateDoc(doc(db, 'alarms', id), patch);
}

export async function deleteAlarm(id: string) {
  return deleteDoc(doc(db, 'alarms', id));
}
