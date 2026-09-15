import { app } from '@td/services/firebase/firebase.instance';
import type {
	IGetCommunityJourneyEnrollmentResult,
	IRetryCommunityJourneyActivationResult,
	IWithdrawCommunityJourneyEnrollmentResult,
} from '@td/types/community/community-function.types';
import type { TCommunityJourneyEnrollmentLifecycle } from '@td/types/community/community-journey.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCommunityCalendarDate,
	parseCommunityTimeZoneId,
	parseGetCommunityJourneyEnrollmentRequest,
	parseRetryCommunityJourneyActivationRequest,
	parseWithdrawCommunityJourneyEnrollmentRequest,
} from './community-journey';

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid enrollment response.');
	return value as Record<string, unknown>;
};
const id = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid enrollment response.');
	return value;
};
const timestamp = (value: unknown) => {
	const input = record(value);
	if (
		Object.keys(input).length !== 2 ||
		typeof input['seconds'] !== 'number' ||
		!Number.isSafeInteger(input['seconds']) ||
		typeof input['nanoseconds'] !== 'number' ||
		!Number.isInteger(input['nanoseconds']) ||
		input['nanoseconds'] < 0 ||
		input['nanoseconds'] >= 1_000_000_000
	)
		throw new Error('Invalid enrollment response.');
	return { seconds: input['seconds'], nanoseconds: input['nanoseconds'] };
};
const blockReasons = [
	'ActivePersonalJourney',
	'MembershipEnded',
	'CommunityJourneyCanceled',
	'CommunityClosed',
	'AccountUnavailable',
	'EmailVerificationRequired',
	'MissedStartDate',
	'ContentUnavailable',
	'SetupInvalid',
	'WritingUnavailable',
] as const;
const eligibility = [
	'Eligible',
	'Withdrawn',
	'Started',
	'StartBlocked',
	'MembershipEnded',
	'CommunityClosed',
	'ScheduleCanceled',
	'EnrollmentClosed',
	'ActivePersonalJourney',
] as const;
const lifecycle = (value: unknown): TCommunityJourneyEnrollmentLifecycle => {
	const input = record(value);
	switch (input['status']) {
		case 'Enrolled':
			if (Object.keys(input).length === 1) return { status: 'Enrolled' };
			break;
		case 'Started':
			if (Object.keys(input).length === 3)
				return {
					status: 'Started',
					journeyId: id(input['journeyId']),
					startedAt: timestamp(input['startedAt']),
				};
			break;
		case 'Withdrawn':
			if (Object.keys(input).length === 2)
				return {
					status: 'Withdrawn',
					withdrawnAt: timestamp(input['withdrawnAt']),
				};
			break;
		case 'StartBlocked':
			if (
				Object.keys(input).length === 3 &&
				blockReasons.some((reason) => reason === input['reason'])
			)
				return {
					status: 'StartBlocked',
					reason: input['reason'] as (typeof blockReasons)[number],
					blockedAt: timestamp(input['blockedAt']),
				};
			break;
	}
	throw new Error('Invalid enrollment response.');
};
export const parseOwnCommunityJourneyEnrollment = (
	value: unknown,
): IGetCommunityJourneyEnrollmentResult => {
	const outer = record(value);
	if (Object.keys(outer).length !== 1 || !('enrollment' in outer))
		throw new Error('Invalid enrollment response.');
	if (outer['enrollment'] === null) return { enrollment: null };
	const input = record(outer['enrollment']);
	const keys = [
		'communityJourneyEnrollmentId',
		'communityId',
		'communityJourneyId',
		'groupDisplayStartDate',
		'communityTimeZoneId',
		'startingTimeZoneId',
		'communityCalendarDate',
		'startingZoneCalendarDate',
		'personalStartDateBehavior',
		'activationEligibility',
		'lifecycle',
		'enrolledAt',
	];
	if (
		Object.keys(input).length !== keys.length ||
		!keys.every((key) => key in input) ||
		input['personalStartDateBehavior'] !== 'ParticipantCalendarDay1' ||
		!eligibility.some((item) => item === input['activationEligibility'])
	)
		throw new Error('Invalid enrollment response.');
	return {
		enrollment: {
			communityJourneyEnrollmentId: id(
				input['communityJourneyEnrollmentId'],
			),
			communityId: id(input['communityId']),
			communityJourneyId: id(input['communityJourneyId']),
			groupDisplayStartDate: parseCommunityCalendarDate(
				input['groupDisplayStartDate'],
			),
			communityTimeZoneId: parseCommunityTimeZoneId(
				input['communityTimeZoneId'],
			),
			startingTimeZoneId: parseCommunityTimeZoneId(
				input['startingTimeZoneId'],
			),
			communityCalendarDate: parseCommunityCalendarDate(
				input['communityCalendarDate'],
			),
			startingZoneCalendarDate: parseCommunityCalendarDate(
				input['startingZoneCalendarDate'],
			),
			personalStartDateBehavior: 'ParticipantCalendarDay1',
			activationEligibility: input[
				'activationEligibility'
			] as (typeof eligibility)[number],
			lifecycle: lifecycle(input['lifecycle']),
			enrolledAt: timestamp(input['enrolledAt']),
		},
	};
};
const call = async (name: string, request: object): Promise<unknown> =>
	(await httpsCallable<object, unknown>(getFunctions(app), name)(request))
		.data;
export const getOwnCommunityJourneyEnrollment = async (
	communityId: string,
	communityJourneyId: string,
): Promise<IGetCommunityJourneyEnrollmentResult> =>
	parseOwnCommunityJourneyEnrollment(
		await call(
			'getCommunityJourneyEnrollment',
			parseGetCommunityJourneyEnrollmentRequest({
				communityId,
				communityJourneyId,
			}),
		),
	);
export const withdrawOwnCommunityJourneyEnrollment = async (
	communityId: string,
	communityJourneyId: string,
	operationId: string,
): Promise<IWithdrawCommunityJourneyEnrollmentResult> => {
	const input = record(
		await call(
			'withdrawCommunityJourneyEnrollment',
			parseWithdrawCommunityJourneyEnrollmentRequest({
				communityId,
				communityJourneyId,
				operationId,
			}),
		),
	);
	if (Object.keys(input).length !== 2)
		throw new Error('Invalid withdrawal response.');
	return {
		communityJourneyEnrollmentId: id(input['communityJourneyEnrollmentId']),
		withdrawnAt: timestamp(input['withdrawnAt']),
	};
};
export const retryOwnCommunityJourneyActivation = async (
	communityId: string,
	communityJourneyId: string,
	operationId: string,
): Promise<IRetryCommunityJourneyActivationResult> => {
	const input = record(
		await call(
			'retryCommunityJourneyActivation',
			parseRetryCommunityJourneyActivationRequest({
				communityId,
				communityJourneyId,
				operationId,
			}),
		),
	);
	if (
		Object.keys(input).length !== 1 ||
		!['NotDue', 'Started', 'StartBlocked', 'Withdrawn'].includes(
			String(input['outcome']),
		)
	)
		throw new Error('Invalid activation response.');
	return {
		outcome: input[
			'outcome'
		] as IRetryCommunityJourneyActivationResult['outcome'],
	};
};
export const communityJourneyDetailOperationId = (): string => randomUUID();
export const communityJourneyDetailReason = (error: unknown): string | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return typeof details.reason === 'string' ? details.reason : null;
};
