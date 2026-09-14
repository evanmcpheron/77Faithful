import { getDeviceId } from '@td/features/account/device-id.service';
import { app, db } from '@td/services/firebase/firebase.instance';
import type { ISetPracticeCompletionResult } from '@td/types/journey/journey-day.types';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	cachePracticeCompletion,
	getDaySessionAccount,
	getDaySessionGeneration,
	loadDaySession,
} from './journey-day-cache';
import type {
	ICompleteJourneyPracticeRequest,
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from './journey-day-session.types';

export const loadPracticeDay = async (
	userId: string,
	journeyId: string,
	dayNumber: number,
	force = false,
) => {
	const callable = httpsCallable<IGetJourneyDayRequest, IJourneyDaySession>(
		getFunctions(app),
		'getJourneyDay',
	);
	const request = {
		journeyId,
		dayNumber,
		observedPhoneTimeZoneId:
			Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
	return loadDaySession(
		userId,
		request,
		async () => (await callable(request)).data,
		force,
	);
};

export const savePracticeCompletion = async (
	input: Omit<
		ICompleteJourneyPracticeRequest,
		'origin' | 'observedPhoneTimeZoneId'
	>,
) => {
	const userId = getDaySessionAccount();
	const generation = getDaySessionGeneration();
	const deviceId = await getDeviceId();
	if (
		!userId ||
		userId !== getDaySessionAccount() ||
		generation !== getDaySessionGeneration()
	)
		throw new Error('Account changed.');
	const timestamp = Timestamp.now();
	const callable = httpsCallable<
		ICompleteJourneyPracticeRequest,
		ISetPracticeCompletionResult
	>(getFunctions(app), 'setJourneyPracticeCompletion');
	const result = (
		await callable({
			...input,
			observedPhoneTimeZoneId:
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			origin: {
				operationId: doc(collection(db, 'operationIds')).id,
				deviceId,
				recordedOnDeviceAt: {
					seconds: timestamp.seconds,
					nanoseconds: timestamp.nanoseconds,
				},
			},
		})
	).data;
	if (
		result.journeyId !== input.journeyId ||
		result.dayNumber !== input.dayNumber ||
		result.practiceId !== input.practiceId ||
		result.completion.status !==
			(input.isComplete ? 'Complete' : 'NotMarked')
	)
		throw new Error('Unexpected completion.');
	cachePracticeCompletion(userId, generation, result);
	return result;
};
