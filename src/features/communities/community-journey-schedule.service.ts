import { app } from '@td/services/firebase/firebase.instance';
import type {
	ICancelCommunityJourneyRequest,
	ICancelCommunityJourneyResult,
	IConfigureCommunityJourneyRequest,
	IConfigureCommunityJourneyResult,
	IGetCommunityJourneyCourseOptionResult,
	IGetCommunityJourneyScheduleResult,
	IListCommunityJourneyHistoryResult,
	IReviseCommunityJourneyRequest,
	IReviseCommunityJourneyResult,
	TCommunityJourneyReasonCode,
} from '@td/types/community/community-function.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCancelCommunityJourneyRequest,
	parseCommunityJourneyPreview,
	parseConfigureCommunityJourneyRequest,
	parseGetCommunityJourneyScheduleRequest,
	parseListCommunityJourneyHistoryRequest,
	parseReviseCommunityJourneyRequest,
} from './community-journey';

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid schedule response.');
	return value as Record<string, unknown>;
};
const singleField = (value: unknown, key: string): unknown => {
	const input = record(value);
	if (Object.keys(input).length !== 1 || !(key in input))
		throw new Error('Invalid schedule response.');
	return input[key];
};
const reasons: readonly TCommunityJourneyReasonCode[] = [
	'InvalidInput',
	'InvalidCursor',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'OrganizerRequired',
	'CourseUnavailable',
	'ScheduleExists',
	'ScheduleUnavailable',
	'ScheduleFrozen',
	'EnrollmentClosed',
	'RevisionConflict',
	'OperationPayloadMismatch',
	'ScheduleDataUnavailable',
];
export const scheduleOperationId = (): string => randomUUID();
export const communityJourneyReason = (error: unknown): string | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	const reason = details.reason;
	return (
		reasons.find((item) => item === reason) ??
		['AuthenticationRequired', 'EmailVerificationRequired'].find(
			(item) => item === reason,
		) ??
		null
	);
};
const call = async (name: string, request: object): Promise<unknown> =>
	(await httpsCallable<object, unknown>(getFunctions(app), name)(request))
		.data;

export const getCommunityJourneySchedule = async (
	communityId: string,
): Promise<IGetCommunityJourneyScheduleResult> => {
	const value = singleField(
		await call(
			'getCommunityJourneySchedule',
			parseGetCommunityJourneyScheduleRequest({ communityId }),
		),
		'communityJourney',
	);
	return {
		communityJourney:
			value === null ? null : parseCommunityJourneyPreview(value),
	};
};
export const getCommunityJourneyCourseOption = async (
	communityId: string,
): Promise<IGetCommunityJourneyCourseOptionResult> => {
	const value = singleField(
		await call(
			'getCommunityJourneyCourseOption',
			parseGetCommunityJourneyScheduleRequest({ communityId }),
		),
		'course',
	);
	if (value === null) return { course: null };
	const input = record(value);
	if (
		Object.keys(input).length !== 2 ||
		typeof input['courseId'] !== 'string' ||
		typeof input['courseVersionId'] !== 'string'
	)
		throw new Error('Invalid course response.');
	if (
		!/^[a-zA-Z0-9_-]{1,128}$/.test(input['courseId']) ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(input['courseVersionId'])
	)
		throw new Error('Invalid course response.');
	return {
		course: {
			courseId: input['courseId'],
			courseVersionId: input['courseVersionId'],
		},
	};
};
export const listCommunityJourneyHistory = async (
	communityId: string,
): Promise<IListCommunityJourneyHistoryResult> => {
	const input = record(
		await call(
			'listCommunityJourneyHistory',
			parseListCommunityJourneyHistoryRequest({
				communityId,
				pageSize: 10,
			}),
		),
	);
	if (
		Object.keys(input).length !== 2 ||
		!Array.isArray(input['communityJourneys']) ||
		!(
			input['nextCursor'] === null ||
			typeof input['nextCursor'] === 'string'
		)
	)
		throw new Error('Invalid schedule history response.');
	return {
		communityJourneys: input['communityJourneys'].map(
			parseCommunityJourneyPreview,
		),
		nextCursor: input['nextCursor'],
	};
};
export const configureCommunityJourney = async (
	request: IConfigureCommunityJourneyRequest,
): Promise<IConfigureCommunityJourneyResult> => ({
	communityJourney: parseCommunityJourneyPreview(
		singleField(
			await call(
				'configureCommunityJourney',
				parseConfigureCommunityJourneyRequest(request),
			),
			'communityJourney',
		),
	),
});
export const reviseCommunityJourney = async (
	request: IReviseCommunityJourneyRequest,
): Promise<IReviseCommunityJourneyResult> => ({
	communityJourney: parseCommunityJourneyPreview(
		singleField(
			await call(
				'reviseCommunityJourney',
				parseReviseCommunityJourneyRequest(request),
			),
			'communityJourney',
		),
	),
});
export const cancelCommunityJourney = async (
	request: ICancelCommunityJourneyRequest,
): Promise<ICancelCommunityJourneyResult> => ({
	communityJourney: parseCommunityJourneyPreview(
		singleField(
			await call(
				'cancelCommunityJourney',
				parseCancelCommunityJourneyRequest(request),
			),
			'communityJourney',
		),
	),
});
