import { db } from '@td/services/firebase/firebase.instance';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { clearDaySessions } from './journey-day-cache';

export const subscribeDaySessionInvalidation = (userId: string) => {
	let active = true;
	let preferences: string | undefined;
	let journeys: string | undefined;
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
	const stopJourneys = onSnapshot(
		collection(db, 'users', userId, 'journeys'),
		(snapshot) => {
			if (!active || snapshot.metadata.hasPendingWrites) return;
			const next = JSON.stringify(
				snapshot.docs.map((journey) => {
					const data = journey.data();
					return [
						journey.id,
						data['state'],
						data['course'],
						data['startDate'],
						data['practiceScheduleRevision'],
					];
				}),
			);
			if (journeys !== next) {
				journeys = next;
				invalidate();
			}
		},
		invalidate,
	);
	return () => {
		active = false;
		stopPreferences();
		stopJourneys();
	};
};
