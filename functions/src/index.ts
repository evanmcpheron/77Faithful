import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { refreshTodayVerseSources } from './journey/refresh-today-verses';

import { getJourneyDayForAccount } from './journey/journey-day';
import {
	completeJourneyPracticeForAccount,
	saveJourneyReflectionForAccount,
} from './journey/journey-day-participation';
import {
	parseCompleteJourneyPracticeRequest,
	parseGetJourneyDayRequest,
	parseSaveJourneyReflectionRequest,
} from './journey/journey-day-request';
import {
	parseStartJourneyRequest,
	startJourneyForAccount,
} from './journey/start-journey';

initializeApp();
setGlobalOptions({ maxInstances: 10 });

export const startJourney = onCall(async (request) => {
	if (!request.auth)
		throw new HttpsError(
			'unauthenticated',
			'Sign in before starting your journey.',
		);
	if (request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Confirm your email before starting your journey.',
		);
	return startJourneyForAccount(
		request.auth.uid,
		parseStartJourneyRequest(request.data),
	);
});

export const getJourneyDay = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to open this day.',
		);
	return getJourneyDayForAccount(
		request.auth.uid,
		parseGetJourneyDayRequest(request.data),
	);
});

export const setJourneyPracticeCompletion = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to update this day.',
		);
	return completeJourneyPracticeForAccount(
		request.auth.uid,
		parseCompleteJourneyPracticeRequest(request.data),
	);
});

export const saveJourneyReflection = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to save your reflection.',
		);
	return saveJourneyReflectionForAccount(
		request.auth.uid,
		parseSaveJourneyReflectionRequest(request.data),
	);
});

export const refreshTodayVerses = onSchedule(
	{
		schedule: '0 3 * * 0',
		timeZone: 'Etc/UTC',
		secrets: ['API_BIBLE_KEY'],
		timeoutSeconds: 540,
		maxInstances: 1,
		retryCount: 0,
	},
	async () => {
		await refreshTodayVerseSources();
	},
);
