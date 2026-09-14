import {
	getJourneyCalendarDate,
	getJourneyDayNumber,
} from '@td/features/journey/journey-calendar';
import type { IGetJourneyDayRequest } from '@td/features/journey/journey-day-session.types';
import { db } from '@td/services/firebase/firebase.instance';
import { FormationStructure } from '@td/types/formation/formation-course.types';
import type {
	IJourneyDetails,
	IJourneyDocument,
} from '@td/types/journey/journey.types';
import { JourneyStatus } from '@td/types/journey/journey.types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import {
	getCachedDaySession,
	getDaySessionCalendar,
	getDaySessionGeneration,
} from '../journey/journey-day-cache';
import { loadPracticeDay } from '../journey/journey-practice.service';

let lastToday: {
	userId: string;
	request: IGetJourneyDayRequest;
	generation: number;
} | null = null;
export const getCachedToday = (userId: string) => {
	if (
		lastToday?.userId !== userId ||
		lastToday.generation !== getDaySessionGeneration()
	)
		return null;
	const session = getCachedDaySession(userId, lastToday.request);
	return session ? ({ status: 'Ready', session } as const) : null;
};

export const loadToday = async (
	userId: string,
	instant = new Date(),
	force = false,
	resolvedJourney?: Pick<IJourneyDetails, 'journeyId' | 'journey'> | null,
) => {
	const calendar = getDaySessionCalendar();
	const generation = getDaySessionGeneration();
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	let activeJourney = resolvedJourney;
	// Standalone callers can still resolve the journey; Today supplies the provider result.
	if (activeJourney === undefined) {
		const snapshot = await getDocs(
			query(
				collection(db, 'users', userId, 'journeys'),
				where('state.status', '==', JourneyStatus.Active),
				limit(1),
			),
		);
		const document = snapshot.docs[0];
		activeJourney = document
			? {
					journeyId: document.id,
					journey: document.data() as IJourneyDocument,
				}
			: null;
	}
	if (
		generation !== getDaySessionGeneration() ||
		calendar !== getDaySessionCalendar()
	)
		throw new Error('Day session changed.');
	if (!activeJourney) {
		lastToday = null;
		return { status: 'NoActiveJourney' } as const;
	}
	if (
		activeJourney.journey.userId !== userId ||
		activeJourney.journey.state?.status !== JourneyStatus.Active
	)
		throw new Error('Unexpected active journey.');
	const startDate: unknown = activeJourney.journey.startDate;
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
	if (
		lastToday?.request.journeyId !== activeJourney.journeyId ||
		lastToday.request.dayNumber !== dayNumber
	)
		lastToday = null;
	if (dayNumber > FormationStructure.DayCount)
		return { status: 'Completed' } as const;
	if (dayNumber < 1) return { status: 'NotStarted' } as const;
	const request = {
		journeyId: activeJourney.journeyId,
		dayNumber,
		observedPhoneTimeZoneId: timeZone,
	};
	const session = await loadPracticeDay(
		userId,
		activeJourney.journeyId,
		dayNumber,
		force,
	);
	if (
		generation !== getDaySessionGeneration() ||
		calendar !== getDaySessionCalendar()
	)
		throw new Error('Day session changed.');
	lastToday = { userId, request, generation };
	return { status: 'Ready', session } as const;
};

export { savePracticeCompletion as saveTodayCompletion } from '@td/features/journey/journey-practice.service';
