import { getDeviceId } from '@td/features/account/device-id.service';
import { app, db } from '@td/services/firebase/firebase.instance';
import type { ISetPracticeCompletionResult } from '@td/types/journey/journey-day.types';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
	ICompleteJourneyPracticeRequest,
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from './journey-day-session.types';

export const loadPracticeDay = async (
	userId: string,
	journeyId: string,
	dayNumber: number,
) => {
	const callable = httpsCallable<IGetJourneyDayRequest, IJourneyDaySession>(
		getFunctions(app),
		'getJourneyDay',
	);
	const { data } = await callable({
		journeyId,
		dayNumber,
		observedPhoneTimeZoneId:
			Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
	if (
		data.day.userId !== userId ||
		data.day.journeyId !== journeyId ||
		data.day.dayNumber !== dayNumber
	)
		throw new Error('Unexpected journey day.');
	return data;
};

export const savePracticeCompletion = async (
	input: Omit<
		ICompleteJourneyPracticeRequest,
		'origin' | 'observedPhoneTimeZoneId'
	>,
) => {
	const timestamp = Timestamp.now();
	const callable = httpsCallable<
		ICompleteJourneyPracticeRequest,
		ISetPracticeCompletionResult
	>(getFunctions(app), 'setJourneyPracticeCompletion');
	return (
		await callable({
			...input,
			observedPhoneTimeZoneId:
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			origin: {
				operationId: doc(collection(db, 'operationIds')).id,
				deviceId: await getDeviceId(),
				recordedOnDeviceAt: {
					seconds: timestamp.seconds,
					nanoseconds: timestamp.nanoseconds,
				},
			},
		})
	).data;
};
