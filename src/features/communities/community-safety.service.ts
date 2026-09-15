import { app } from '@td/services/firebase/firebase.instance';
import type {
	IBlockCommunityMemberRequest,
	ICommunityBlockResult,
	IListBlockedCommunityMembersRequest,
	IListBlockedCommunityMembersResult,
	IUnblockCommunityMemberRequest,
	TCommunitySafetyReasonCode,
} from '@td/types/community/community-block.types';
import type {
	IReportCommunityContentRequest,
	IReportCommunityContentResult,
} from '@td/types/community/community-moderation.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseBlockCommunityMemberRequest,
	parseListBlockedCommunityMembersRequest,
	parseReportCommunityContentRequest,
	parseUnblockCommunityMemberRequest,
} from './community-safety';

const safetyReasons: readonly TCommunitySafetyReasonCode[] = [
	'InvalidInput',
	'InvalidCursor',
	'AccountUnavailable',
	'CommunityUnavailable',
	'TargetUnavailable',
	'SelfTarget',
	'BlockedInteraction',
	'RateLimited',
	'SubmissionRejected',
	'SafetyConfigurationUnavailable',
	'OperationPayloadMismatch',
];

export const getCommunitySafetyReason = (
	error: unknown,
): TCommunitySafetyReasonCode | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return safetyReasons.find((reason) => reason === details.reason) ?? null;
};

export const createCommunitySafetyOperationId = (): string => randomUUID();

const resultRecord = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community safety response.');
	return value as Record<string, unknown>;
};

const identifier = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid community safety response.');
	return value;
};

const blockResult = (
	value: unknown,
	userId: string,
	expected: boolean,
): ICommunityBlockResult => {
	const result = resultRecord(value);
	if (
		identifier(result['memberUserId']) !== userId ||
		result['isBlocked'] !== expected
	)
		throw new Error('Invalid community safety response.');
	return { memberUserId: userId, isBlocked: expected };
};

export const reportCommunityContent = async (
	input: IReportCommunityContentRequest,
): Promise<IReportCommunityContentResult> => {
	const request = parseReportCommunityContentRequest(input);
	const callable = httpsCallable<IReportCommunityContentRequest, unknown>(
		getFunctions(app),
		'reportCommunityContent',
	);
	const result = resultRecord((await callable(request)).data);
	if (result['status'] !== 'Submitted')
		throw new Error('Invalid community safety response.');
	return { reportId: identifier(result['reportId']), status: 'Submitted' };
};

export const blockCommunityMember = async (
	input: IBlockCommunityMemberRequest,
): Promise<ICommunityBlockResult> => {
	const request = parseBlockCommunityMemberRequest(input);
	const callable = httpsCallable<IBlockCommunityMemberRequest, unknown>(
		getFunctions(app),
		'blockCommunityMember',
	);
	return blockResult(
		(await callable(request)).data,
		request.memberUserId,
		true,
	);
};

export const unblockCommunityMember = async (
	input: IUnblockCommunityMemberRequest,
): Promise<ICommunityBlockResult> => {
	const request = parseUnblockCommunityMemberRequest(input);
	const callable = httpsCallable<IUnblockCommunityMemberRequest, unknown>(
		getFunctions(app),
		'unblockCommunityMember',
	);
	return blockResult(
		(await callable(request)).data,
		request.memberUserId,
		false,
	);
};

export const listBlockedCommunityMembers = async (
	input: IListBlockedCommunityMembersRequest = {},
): Promise<IListBlockedCommunityMembersResult> => {
	const request = parseListBlockedCommunityMembersRequest(input);
	const callable = httpsCallable<
		IListBlockedCommunityMembersRequest,
		unknown
	>(getFunctions(app), 'listBlockedCommunityMembers');
	const result = resultRecord((await callable(request)).data);
	if (
		!Array.isArray(result['members']) ||
		(result['nextCursor'] !== null &&
			(typeof result['nextCursor'] !== 'string' ||
				result['nextCursor'].length > 512))
	)
		throw new Error('Invalid community safety response.');
	const members = result['members'].map((value: unknown) => {
		const member = resultRecord(value);
		const displayName = member['displayName'];
		if (typeof displayName !== 'string' || displayName.length > 80)
			throw new Error('Invalid community safety response.');
		return {
			blockedUserId: identifier(member['blockedUserId']),
			displayName,
		};
	});
	return { members, nextCursor: result['nextCursor'] as string | null };
};
