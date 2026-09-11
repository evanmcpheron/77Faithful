import {
	getJourneyCalendarDate,
	getJourneyDayNumber,
} from '@td/features/journey/journey-calendar';
import type {
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from '@td/features/journey/journey-day-session.types';
import { app, db } from '@td/services/firebase/firebase.instance';
import { FormationStructure } from '@td/types/formation/formation-course.types';
import { JourneyStatus } from '@td/types/journey/journey.types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const loadToday = async (userId: string, instant = new Date()) => {
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const snapshot = await getDocs(
		query(
			collection(db, 'users', userId, 'journeys'),
			where('state.status', '==', JourneyStatus.Active),
			limit(1),
		),
	);
	const activeJourney = snapshot.docs[0];
	if (!activeJourney) return { status: 'NoActiveJourney' } as const;
	const startDate: unknown = activeJourney.data()['startDate'];
	if (
		typeof startDate !== 'string' ||
		!/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
		!Number.isFinite(Date.parse(`${startDate}T00:00:00Z`))
	)
		throw new Error('Invalid journey start date.');
	const dayNumber = getJourneyDayNumber(
		startDate,
		getJourneyCalendarDate(instant, timeZone),
	);
	if (dayNumber > FormationStructure.DayCount)
		return { status: 'Completed' } as const;
	if (dayNumber < 1) return { status: 'NotStarted' } as const;
	const callable = httpsCallable<IGetJourneyDayRequest, IJourneyDaySession>(
		getFunctions(app),
		'getJourneyDay',
	);
	const { data: session } = await callable({
		journeyId: activeJourney.id,
		dayNumber,
		observedPhoneTimeZoneId: timeZone,
	});
	if (
		session.day.userId !== userId ||
		session.day.journeyId !== activeJourney.id ||
		session.day.dayNumber !== dayNumber
	)
		throw new Error('Unexpected journey day.');
	return { status: 'Ready', session } as const;
};

export { savePracticeCompletion as saveTodayCompletion } from '@td/features/journey/journey-practice.service';
