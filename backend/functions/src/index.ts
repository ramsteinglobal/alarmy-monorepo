import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// Nightly cleanup of disabled alarms older than 90 days.
//
// The app stores alarms in per-user SUBcollections (users/{uid}/alarms), so
// this must be a collection-group query — a top-level collection('alarms')
// query would scan a collection the app never writes and delete nothing.
// The composite index (enabled ASC, updatedAt ASC) in firestore.indexes.json
// covers exactly this query.
export const nightlyAlarmCleanup = onSchedule('every day 03:00', async () => {
  // updatedAt is written with serverTimestamp(), i.e. a Firestore Timestamp.
  // Comparing it against a raw millis number would match nothing (numbers
  // sort before timestamps), so compare against a Date instead.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let count = 0;

  while (true) {
    const snap = await db
      .collectionGroup('alarms')
      .where('enabled', '==', false)
      .where('updatedAt', '<', cutoff)
      .limit(500)
      .get();

    if (snap.empty) {
      break;
    }

    const batch = db.batch();
    snap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    count += snap.size;
  }

  // eslint-disable-next-line no-console
  console.log(`nightlyAlarmCleanup: deleted ${count} stale alarms`);
});
