import {
	getFirestore,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { parseCreateCommunityResult } from '../../generated/features/communities/community-creation';
import type { TCommunityReaderReasonCode } from '../../generated/types/community/community-function.types';
import type { ICommunitySummary } from '../../generated/types/community/community.types';
import { onCall } from './community-callable';

const readerReason = (reason: TCommunityReaderReasonCode) => ({ reason });

export const requireCommunityAccount = (
	auth: CallableRequest['auth'],
): string => {
	if (!auth)
		throw new HttpsError(
			'unauthenticated',
			'Sign in to open your communities.',
			readerReason('AuthenticationRequired'),
		);
	if (auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Confirm your email to open your communities.',
			readerReason('EmailVerificationRequired'),
		);
	return auth.uid;
};

export const resolveCommunityDisplayName = (preferredName: unknown): string =>
	typeof preferredName === 'string' && preferredName.length <= 80
		? preferredName.trim()
		: '';

export const readCommunitySummary = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
): Promise<ICommunitySummary> => {
	const community = (
		await transaction.get(database.doc(`communities/${communityId}`))
	).data();
	if (!community)
		throw new HttpsError('not-found', 'This community is unavailable.');
	const organizerId: unknown = community.organizerUserId;
	if (
		typeof organizerId !== 'string' ||
		!organizerId ||
		organizerId.includes('/')
	)
		throw new HttpsError('internal', 'This community could not be loaded.');
	const profile = (
		await transaction.get(database.doc(`users/${organizerId}`))
	).data();
	return parseCreateCommunityResult({
		community: {
			communityId,
			name: community.name,
			purpose: community.purpose,
			organizer: {
				userId: organizerId,
				displayName: resolveCommunityDisplayName(
					profile?.preferredName,
				),
			},
			status: community.lifecycle?.status,
			...(community.settings?.participationExpectations !== undefined
				? {
						participationExpectations:
							community.settings.participationExpectations,
					}
				: {}),
		},
	}).community;
};

export const hasActiveCommunityMembership = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
): Promise<boolean> => {
	const member = (
		await transaction.get(
			database.doc(`communities/${communityId}/members/${userId}`),
		)
	).data();
	return (
		member?.userId === userId &&
		member?.communityId === communityId &&
		member?.lifecycle?.status === 'Active'
	);
};

export const getCommunityForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<ICommunitySummary> => {
	if (
		!value ||
		typeof value !== 'object' ||
		!('communityId' in value) ||
		Object.keys(value).length !== 1 ||
		typeof value.communityId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(value.communityId)
	)
		throw new HttpsError('invalid-argument', 'Choose a community to open.');
	const communityId = value.communityId;
	return database.runTransaction(async (transaction) => {
		if (
			!(await transaction.get(database.doc(`users/${userId}`))).exists ||
			!(await hasActiveCommunityMembership(
				transaction,
				database,
				userId,
				communityId,
			))
		)
			throw new HttpsError(
				'permission-denied',
				'This community is unavailable to your account.',
			);
		return readCommunitySummary(transaction, database, communityId);
	});
};

export const listCommunitiesForAccount = async (
	userId: string,
	database = getFirestore(),
): Promise<ICommunitySummary[]> =>
	database.runTransaction(async (transaction) => {
		if (!(await transaction.get(database.doc(`users/${userId}`))).exists)
			throw new HttpsError(
				'failed-precondition',
				'Your account is unavailable. Please sign in again.',
			);
		const memberships = await transaction.get(
			database.collection(`users/${userId}/communityMemberships`),
		);
		const communities: ICommunitySummary[] = [];
		for (const snapshot of memberships.docs) {
			const membership = snapshot.data();
			if (
				membership.userId !== userId ||
				membership.communityId !== snapshot.id ||
				membership.lifecycle?.status !== 'Active'
			)
				continue;
			// The account index is for discovery; the community membership owns access.
			if (
				await hasActiveCommunityMembership(
					transaction,
					database,
					userId,
					snapshot.id,
				)
			)
				communities.push(
					await readCommunitySummary(
						transaction,
						database,
						snapshot.id,
					),
				);
		}
		return communities;
	});

export const getCommunity = onCall(async (request) =>
	getCommunityForAccount(requireCommunityAccount(request.auth), request.data),
);
export const listCommunities = onCall(async (request) => {
	const userId = requireCommunityAccount(request.auth);
	if (
		request.data != null &&
		(typeof request.data !== 'object' ||
			Array.isArray(request.data) ||
			Object.keys(request.data).length > 0)
	)
		throw new HttpsError(
			'invalid-argument',
			'Community listing does not accept account parameters.',
		);
	return listCommunitiesForAccount(userId);
});
