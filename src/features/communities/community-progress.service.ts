import { app } from '@td/services/firebase/firebase.instance';
import type {
	IGetCommunityProgressSharingResult,
	ISetCommunityProgressSharingRequest,
	ISetCommunityProgressSharingResult,
	TCommunityAggregateProgressResult,
	TCommunityProgressConsent,
} from '@td/types/community/community-progress.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseGetCommunityAggregateProgressRequest,
	parseGetCommunityProgressSharingRequest,
	parseSetCommunityProgressSharingRequest,
} from './community-progress';

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid progress response.');
	return value as Record<string, unknown>;
};
const identifier = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid progress response.');
	return value;
};
const timestamp = (value: unknown) => {
	const input = record(value);
	if (
		Object.keys(input).length !== 2 ||
		typeof input['seconds'] !== 'number' ||
		!Number.isInteger(input['seconds']) ||
		typeof input['nanoseconds'] !== 'number' ||
		!Number.isInteger(input['nanoseconds']) ||
		input['nanoseconds'] < 0 ||
		input['nanoseconds'] >= 1_000_000_000
	)
		throw new Error('Invalid progress response.');
	return { seconds: input['seconds'], nanoseconds: input['nanoseconds'] };
};
const consent = (value: unknown): TCommunityProgressConsent => {
	const input = record(value);
	if (input['status'] === 'Private' && Object.keys(input).length === 1)
		return { status: 'Private' };
	if (input['status'] === 'Shared' && Object.keys(input).length === 2)
		return {
			status: 'Shared',
			consentedAt: timestamp(input['consentedAt']),
		};
	throw new Error('Invalid progress response.');
};
export const parseSharingResult = (
	value: unknown,
): IGetCommunityProgressSharingResult => {
	const input = record(value);
	if (Object.keys(input).length !== 4)
		throw new Error('Invalid progress response.');
	return {
		communityId: identifier(input['communityId']),
		communityJourneyId: identifier(input['communityJourneyId']),
		individualProgress: consent(input['individualProgress']),
		aggregateProgress: consent(input['aggregateProgress']),
	};
};
export const parseAggregateResult = (
	value: unknown,
): TCommunityAggregateProgressResult => {
	const input = record(value);
	if (
		Object.keys(input).length !== 3 ||
		typeof input['guidance'] !== 'string'
	)
		throw new Error('Invalid progress response.');
	if (input['status'] === 'Suppressed' && input['progress'] === null)
		return {
			status: 'Suppressed',
			progress: null,
			guidance: input['guidance'],
		};
	if (input['status'] !== 'Available')
		throw new Error('Invalid progress response.');
	const progress = record(input['progress']);
	if (Object.keys(progress).length !== 7)
		throw new Error('Invalid progress response.');
	const count = (key: string): number => {
		const value = progress[key];
		if (
			typeof value !== 'number' ||
			!Number.isSafeInteger(value) ||
			value < 0
		)
			throw new Error('Invalid progress response.');
		return value;
	};
	const result = {
		communityId: identifier(progress['communityId']),
		communityJourneyId: identifier(progress['communityJourneyId']),
		contributingMemberCount: count('contributingMemberCount'),
		activeJourneyCount: count('activeJourneyCount'),
		completedJourneyCount: count('completedJourneyCount'),
		endedEarlyJourneyCount: count('endedEarlyJourneyCount'),
		calculatedAt: timestamp(progress['calculatedAt']),
	};
	if (
		result.activeJourneyCount +
			result.completedJourneyCount +
			result.endedEarlyJourneyCount !==
		result.contributingMemberCount
	)
		throw new Error('Invalid progress response.');
	return {
		status: 'Available',
		progress: result,
		guidance: input['guidance'],
	};
};
const call = async (name: string, request: object): Promise<unknown> =>
	(await httpsCallable<object, unknown>(getFunctions(app), name)(request))
		.data;
export const progressOperationId = (): string => randomUUID();
export const getProgressSharing = async (
	communityId: string,
	communityJourneyId: string,
) => {
	const result = parseSharingResult(
		await call(
			'getCommunityProgressSharing',
			parseGetCommunityProgressSharingRequest({
				communityId,
				communityJourneyId,
			}),
		),
	);
	if (
		result.communityId !== communityId ||
		result.communityJourneyId !== communityJourneyId
	)
		throw new Error('Unexpected progress scope.');
	return result;
};
export const setProgressSharing = async (
	request: ISetCommunityProgressSharingRequest,
): Promise<ISetCommunityProgressSharingResult> => {
	const result = parseSharingResult(
		await call(
			'setCommunityProgressSharing',
			parseSetCommunityProgressSharingRequest(request),
		),
	);
	if (
		result.communityId !== request.communityId ||
		result.communityJourneyId !== request.communityJourneyId
	)
		throw new Error('Unexpected progress scope.');
	return result;
};
export const getAggregateProgress = async (
	communityId: string,
	communityJourneyId: string,
) => {
	const result = parseAggregateResult(
		await call(
			'getCommunityAggregateProgress',
			parseGetCommunityAggregateProgressRequest({
				communityId,
				communityJourneyId,
			}),
		),
	);
	if (
		result.status === 'Available' &&
		(result.progress.communityId !== communityId ||
			result.progress.communityJourneyId !== communityJourneyId)
	)
		throw new Error('Unexpected progress scope.');
	return result;
};
export const progressReason = (error: unknown): string | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return typeof details.reason === 'string' ? details.reason : null;
};
