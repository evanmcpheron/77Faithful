import { app } from '@td/services/firebase/firebase.instance';
import type {
	IGetCommunityContextRequest,
	IGetCommunityContextResult,
	IListCommunityMembersRequest,
	IListCommunityMembersResult,
	TCommunityReaderReasonCode,
} from '@td/types/community/community-function.types';
import type {
	ICommunityContext,
	ICommunitySummary,
} from '@td/types/community/community.types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { parseCreateCommunityResult } from './community-creation';
import {
	parseGetCommunityContextRequest,
	parseGetCommunityContextResult,
	parseListCommunityMembersRequest,
	parseListCommunityMembersResult,
} from './community-reader';

const communityReaderReasons: readonly TCommunityReaderReasonCode[] = [
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'InvalidCursor',
	'AccountUnavailable',
	'CommunityUnavailable',
];

export const getCommunityReaderReason = (
	error: unknown,
): TCommunityReaderReasonCode | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return (
		communityReaderReasons.find((reason) => reason === details.reason) ??
		null
	);
};

export const getCommunityContext = async (
	communityId: string,
): Promise<ICommunityContext> => {
	const request = parseGetCommunityContextRequest({ communityId });
	const callable = httpsCallable<
		IGetCommunityContextRequest,
		IGetCommunityContextResult
	>(getFunctions(app), 'getCommunityContext');
	return parseGetCommunityContextResult((await callable(request)).data)
		.context;
};

export const listCommunityMembers = async (
	input: IListCommunityMembersRequest,
): Promise<IListCommunityMembersResult> => {
	const request = parseListCommunityMembersRequest(input);
	const callable = httpsCallable<IListCommunityMembersRequest, unknown>(
		getFunctions(app),
		'listCommunityMembers',
	);
	return parseListCommunityMembersResult((await callable(request)).data);
};

export const getCommunity = async (
	communityId: string,
): Promise<ICommunitySummary> => {
	if (!/^[a-zA-Z0-9_-]{1,128}$/.test(communityId))
		throw new Error('Invalid community ID.');
	const callable = httpsCallable<
		Pick<ICommunitySummary, 'communityId'>,
		unknown
	>(getFunctions(app), 'getCommunity');
	return parseCreateCommunityResult({
		community: (await callable({ communityId })).data,
	}).community;
};

export const listCommunities = async (): Promise<ICommunitySummary[]> => {
	const callable = httpsCallable<void, unknown>(
		getFunctions(app),
		'listCommunities',
	);
	const result = (await callable()).data;
	if (!Array.isArray(result)) throw new Error('Invalid community list.');
	return result.map(
		(community: unknown) =>
			parseCreateCommunityResult({ community }).community,
	);
};
