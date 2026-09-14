import { db } from '@td/services/firebase/firebase.instance';
import { doc, onSnapshot } from 'firebase/firestore';
import { clearDaySessions } from './journey-day-cache';

export const subscribeDaySessionInvalidation = (userId: string) => {
	let active = true;
	let preferences: string | undefined;
	const invalidate = () => {
		if (active) clearDaySessions();
	};
	const stopPreferences = onSnapshot(
		doc(db, 'users', userId, 'preferences', 'current'),
		(snapshot) => {
			if (!active || snapshot.metadata.hasPendingWrites) return;
			const next = JSON.stringify(
				snapshot.data()?.['bibleVersionId'] ?? null,
			);
			if (preferences !== next) {
				preferences = next;
				invalidate();
			}
		},
		invalidate,
	);
	return () => {
		active = false;
		stopPreferences();
	};
};
