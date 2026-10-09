import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// Example: nightly cleanup of disabled alarms older than 90 days.
// Wake-up checks / push reminders go here (FCM) in milestone 2.
export const nightlyAlarmCleanup = onSchedule('every day 03:00', async () => {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const snap = await db.collection('alarms').where('enabled', '==', false).get();
  const batch = db.batch();
  let count = 0;
  snap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.updatedAt && data.updatedAt < cutoff) {
      batch.delete(docSnap.ref);
      count += 1;
    }
  });
  await batch.commit();
  // eslint-disable-next-line no-console
  console.log(`nightlyAlarmCleanup: deleted ${count} stale alarms`);
});
