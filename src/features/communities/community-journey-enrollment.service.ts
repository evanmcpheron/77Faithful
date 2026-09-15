import { app } from '@td/services/firebase/firebase.instance';
import type {
	IEnrollCommunityJourneyRequest,
	IEnrollCommunityJourneyResult,
} from '@td/types/community/community-function.types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCommunityCalendarDate,
	parseCommunityJourneyPreview,
	parseCommunityTimeZoneId,
	parseEnrollCommunityJourneyRequest,
} from './community-journey';

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid enrollment confirmation.');
	return value as Record<string, unknown>;
};
const identifier = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid enrollment confirmation.');
	return value;
};
export const parseEnrollmentConfirmation = (
	value: unknown,
): IEnrollCommunityJourneyResult => {
	const input = record(value);
	const keys = [
		'communityJourneyEnrollmentId',
		'communityJourney',
		'enrolledAt',
		'startingTimeZoneId',
		'groupDisplayStartDate',
		'personalStartDateBehavior',
	];
	if (
		Object.keys(input).length !== keys.length ||
		!keys.every((key) => key in input) ||
		input['personalStartDateBehavior'] !== 'ParticipantCalendarDay1'
	)
		throw new Error('Invalid enrollment confirmation.');
	const enrolledAt = record(input['enrolledAt']);
	if (
		Object.keys(enrolledAt).length !== 2 ||
		!Number.isSafeInteger(enrolledAt['seconds']) ||
		!Number.isInteger(enrolledAt['nanoseconds']) ||
		Number(enrolledAt['nanoseconds']) < 0 ||
		Number(enrolledAt['nanoseconds']) >= 1_000_000_000
	)
		throw new Error('Invalid enrollment confirmation.');
	return {
		communityJourneyEnrollmentId: identifier(
			input['communityJourneyEnrollmentId'],
		),
		communityJourney: parseCommunityJourneyPreview(
			input['communityJourney'],
		),
		enrolledAt: {
			seconds: enrolledAt['seconds'] as number,
			nanoseconds: enrolledAt['nanoseconds'] as number,
		},
		startingTimeZoneId: parseCommunityTimeZoneId(
			input['startingTimeZoneId'],
		),
		groupDisplayStartDate: parseCommunityCalendarDate(
			input['groupDisplayStartDate'],
		),
		personalStartDateBehavior: 'ParticipantCalendarDay1',
	};
};
export const enrollInCommunityJourney = async (
	request: IEnrollCommunityJourneyRequest,
): Promise<IEnrollCommunityJourneyResult> =>
	parseEnrollmentConfirmation(
		(
			await httpsCallable<object, unknown>(
				getFunctions(app),
				'enrollCommunityJourney',
			)(parseEnrollCommunityJourneyRequest(request))
		).data,
	);
