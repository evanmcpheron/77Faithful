import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { parseCreateCommunityRequest } from '../../generated/features/communities/community-creation';
import type { ICreateCommunityResult } from '../../generated/types/community/community-function.types';
import type { ICommunityMembershipDocument } from '../../generated/types/community/community-membership.types';
import type { ICommunityDocument } from '../../generated/types/community/community.types';
import {
	hasActiveCommunityMembership,
	readCommunitySummary,
	resolveCommunityDisplayName,
} from './read-community';

export const createCommunityForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<ICreateCommunityResult> => {
	let input;
	try {
		input = parseCreateCommunityRequest(value);
	} catch {
		throw new HttpsError(
			'invalid-argument',
			'Check your community name and description.',
		);
	}
	const profileReference = database.doc(`users/${userId}`);
	const operationReference = profileReference
		.collection('communityCreateOperations')
		.doc(input.operationId);
	const communityReference = database.collection('communities').doc();
	return database.runTransaction(async (transaction) => {
		const profile = await transaction.get(profileReference);
		if (!profile.exists)
			throw new HttpsError(
				'failed-precondition',
				'Your account is unavailable. Please sign in again.',
			);
		const operation = await transaction.get(operationReference);
		if (operation.exists) {
			const previous = operation.data();
			if (
				JSON.stringify(
					parseCreateCommunityRequest(previous?.request),
				) !== JSON.stringify(input)
			)
				throw new HttpsError(
					'already-exists',
					'This request has already been used for different community details.',
				);
			const communityId: unknown = previous?.communityId;
			if (
				typeof communityId !== 'string' ||
				!/^[a-zA-Z0-9_-]{1,128}$/.test(communityId)
			)
				throw new HttpsError(
					'internal',
					'The community request could not be loaded.',
				);
			if (
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
			return {
				community: await readCommunitySummary(
					transaction,
					database,
					communityId,
				),
			};
		}
		const now = Timestamp.now();
		const community: ICommunityDocument = {
			schemaVersion: 1,
			name: input.name,
			purpose: input.purpose,
			organizerUserId: userId,
			settings: input.settings,
			lifecycle: { status: 'Active' },
			activeInvitationId: null,
			revision: 0,
			createdAt: now,
			updatedAt: now,
		};
		const membership: ICommunityMembershipDocument = {
			schemaVersion: 1,
			communityId: communityReference.id,
			userId,
			role: 'Organizer',
			joinedAt: now,
			lifecycle: { status: 'Active' },
			createdAt: now,
			updatedAt: now,
		};
		const result: ICreateCommunityResult = {
			community: {
				communityId: communityReference.id,
				name: community.name,
				purpose: community.purpose,
				organizer: {
					userId,
					displayName: resolveCommunityDisplayName(
						profile.data()?.preferredName,
					),
				},
				status: 'Active',
				...input.settings,
			},
		};
		transaction.create(communityReference, community);
		transaction.create(
			communityReference.collection('members').doc(userId),
			membership,
		);
		transaction.create(
			profileReference
				.collection('communityMemberships')
				.doc(communityReference.id),
			membership,
		);
		transaction.create(operationReference, {
			request: input,
			communityId: communityReference.id,
		});
		return result;
	});
};

export const createCommunity = onCall(async (request) => {
	if (!request.auth)
		throw new HttpsError(
			'unauthenticated',
			'Sign in before creating a community.',
		);
	if (request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Confirm your email before creating a community.',
		);
	return createCommunityForAccount(request.auth.uid, request.data);
});
