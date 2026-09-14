import { app } from '@td/services/firebase/firebase.instance';
import type { ICommunitySummary } from '@td/types/community/community.types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { parseCreateCommunityResult } from './community-creation';

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
