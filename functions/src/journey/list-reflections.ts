import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
	getJourneyCalendarDate,
	getJourneyDayNumber,
} from '../../generated/features/journey/journey-calendar';
import {
	REFLECTION_PAGE_SIZE,
	type IReflectionCursor,
	type IReflectionPage,
} from '../../generated/features/journey/reflections.types';
import type { IJourneyDayDocument } from '../../generated/types/journey/journey-day.types';
import type { IJourneyDocument } from '../../generated/types/journey/journey.types';
import { parseGetJourneyDayRequest } from './journey-day-request';

export const parseReflectionCursor = (
	value: unknown,
): IReflectionCursor | null => {
	if (value == null) return null;
	if (
		typeof value !== 'object' ||
		!('journeyId' in value) ||
		!('beforeDayNumber' in value) ||
		typeof value.journeyId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(value.journeyId) ||
		typeof value.beforeDayNumber !== 'number' ||
		!Number.isInteger(value.beforeDayNumber) ||
		value.beforeDayNumber < 0 ||
		value.beforeDayNumber > 77
	)
		throw new HttpsError(
			'invalid-argument',
			'Reopen your reflections and try again.',
		);
	return {
		journeyId: value.journeyId,
		beforeDayNumber: value.beforeDayNumber,
	};
};

export const listReflections = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to view your reflections.',
		);
	const { observedPhoneTimeZoneId } = parseGetJourneyDayRequest({
		journeyId: 'history',
		dayNumber: 1,
		observedPhoneTimeZoneId: request.data?.observedPhoneTimeZoneId,
	});
	const page = await getReflectionsForAccount(
		request.auth.uid,
		observedPhoneTimeZoneId,
		getFirestore(),
		new Date(),
		parseReflectionCursor(request.data?.cursor),
	);
	// Older app versions still expect an array; their response is bounded too.
	return request.data?.paginated === true ? page : page.entries;
});

export const getReflectionsForAccount = async (
	userId: string,
	observedPhoneTimeZoneId: string,
	database: Firestore = getFirestore(),
	instant = new Date(),
	cursor: IReflectionCursor | null = null,
): Promise<IReflectionPage> => {
	const today = getJourneyCalendarDate(instant, observedPhoneTimeZoneId);
	const snapshot = await database
		.collection(`users/${userId}/journeys`)
		.get();
	const journeys = snapshot.docs
		.map((document) => ({
			document,
			journey: document.data() as IJourneyDocument,
		}))
		.filter(({ journey }) => journey.userId === userId)
		.sort(
			(a, b) =>
				b.journey.startDate.localeCompare(a.journey.startDate) ||
				b.document.id.localeCompare(a.document.id),
		);
	const startIndex = cursor
		? journeys.findIndex(({ document }) => document.id === cursor.journeyId)
		: 0;
	if (startIndex < 0)
		throw new HttpsError(
			'invalid-argument',
			'Reopen your reflections and try again.',
		);
	const page: IReflectionPage = { entries: [], nextCursor: null };
	let scannedDays = 0;
	for (let index = startIndex; index < journeys.length; index++) {
		const { document, journey } = journeys[index]!;
		const lastReachedDay =
			journey.state.status === 'EndedEarly'
				? journey.state.lastReachedDayNumber
				: journey.state.status === 'Completed'
					? 77
					: Math.min(
							77,
							getJourneyDayNumber(journey.startDate, today),
						);
		let before =
			index === startIndex && cursor ? cursor.beforeDayNumber : 78;
		while (Math.min(lastReachedDay, before - 1) >= 1) {
			const days = await document.ref
				.collection('days')
				.where('dayNumber', '<=', Math.min(lastReachedDay, before - 1))
				.orderBy('dayNumber', 'desc')
				.limit(8)
				.get();
			if (days.empty) break;
			for (const daySnapshot of days.docs) {
				const day = daySnapshot.data() as IJourneyDayDocument;
				before = day.dayNumber;
				scannedDays++;
				if (
					day.userId === userId &&
					day.journeyId === document.id &&
					day.reflection?.text?.trim()
				) {
					page.entries.push({
						userId,
						journeyId: document.id,
						dayNumber: day.dayNumber,
						calendarDate: day.calendarDate,
						reflection: {
							revisionId: day.reflection.revisionId,
							text: day.reflection.text,
							updatedAt: {
								seconds: day.reflection.updatedAt.seconds,
								nanoseconds:
									day.reflection.updatedAt.nanoseconds,
							},
						},
					});
				}
				if (
					page.entries.length === REFLECTION_PAGE_SIZE ||
					scannedDays >= 32
				) {
					page.nextCursor =
						daySnapshot !== days.docs[days.docs.length - 1] ||
						days.size === 8 ||
						index < journeys.length - 1
							? {
									journeyId: document.id,
									beforeDayNumber: before,
								}
							: null;
					return page;
				}
			}
			if (days.size < 8) break;
		}
	}
	return page;
};
