import {
	getFirestore,
	Timestamp,
	type Firestore,
} from 'firebase-admin/firestore';
import { auth } from 'firebase-functions/v1';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createHash } from 'node:crypto';
import type {
	ICommunityPost,
	ICommunityReply,
} from '../../generated/types/community/community-post.types';

const digestPattern = /^[a-f0-9]{64}$/;
const batchSize = 20;

export const redactDeletedAuthors = async <
	T extends ICommunityPost | ICommunityReply,
>(
	transaction: FirebaseFirestore.Transaction,
	database: Firestore,
	records: T[],
): Promise<T[]> => {
	const userIds = [...new Set(records.map((record) => record.author.userId))];
	const tasks = await Promise.all(
		userIds.map((userId) =>
			transaction.get(
				database.doc(`communityAccountDeletionCleanup/${userId}`),
			),
		),
	);
	const deleted = new Map(
		userIds.map((userId, index) => [userId, tasks[index]]),
	);
	return records.map((record) => {
		const task = deleted.get(record.author.userId);
		if (!task?.exists) return record;
		const queuedAt = task.get('queuedAt');
		const at = queuedAt instanceof Timestamp ? queuedAt : Timestamp.now();
		const publication = record.publication;
		return {
			...record,
			author: {
				userId: record.author.userId,
				displayName: 'Former participant',
			},
			publication:
				publication.status === 'Published'
					? 'postId' in record
						? {
								status: 'AuthorDeleted',
								postType:
									'content' in publication
										? publication.content.postType
										: 'Discussion',
								deletedAt: {
									seconds: at.seconds,
									nanoseconds: at.nanoseconds,
								},
							}
						: {
								status: 'AuthorDeleted',
								deletedAt: {
									seconds: at.seconds,
									nanoseconds: at.nanoseconds,
								},
							}
					: publication,
		} as T;
	});
};

export const queueCommunityExitCleanup = (
	transaction: FirebaseFirestore.Transaction,
	database: Firestore,
	communityId: string,
	userId: string,
	now: Timestamp,
): void => {
	transaction.set(
		database.doc(
			`communityExitCleanup/${createHash('sha256')
				.update(`${communityId}\u0000${userId}`)
				.digest('hex')}`,
		),
		{
			communityId,
			userId,
			queuedAt: now,
		},
	);
};

const closeOrphanedCommunity = async (
	database: Firestore,
	communityId: string,
	userId: string,
): Promise<void> => {
	await database.runTransaction(async (transaction) => {
		const reference = database.doc(`communities/${communityId}`);
		const community = await transaction.get(reference);
		const data = community.data();
		if (
			!data ||
			data.organizerUserId !== userId ||
			data.lifecycle?.status !== 'Active'
		)
			return;
		const now = Timestamp.now();
		const invitationId = data.activeInvitationId;
		const invitationReference =
			typeof invitationId === 'string'
				? reference.collection('invitations').doc(invitationId)
				: null;
		const invitation = invitationReference
			? await transaction.get(invitationReference)
			: null;
		const digest = invitation?.get('tokenDigest');
		if (invitation?.exists)
			transaction.update(invitationReference!, {
				lifecycle: { status: 'Revoked', revokedAt: now },
				updatedAt: now,
			});
		if (typeof digest === 'string' && digestPattern.test(digest))
			transaction.delete(
				database.doc(`communityInvitationDigests/${digest}`),
			);
		transaction.update(reference, {
			lifecycle: { status: 'Closed', closedAt: now },
			activeInvitationId: null,
			revision: typeof data.revision === 'number' ? data.revision + 1 : 1,
			updatedAt: now,
		});
	});
};

const processDeletedAccountBatch = async (
	database: Firestore,
	userId: string,
): Promise<boolean> => {
	const installations = await database
		.collection('communityPushInstallations')
		.where('userId', '==', userId)
		.limit(batchSize)
		.get();
	if (!installations.empty) {
		const batch = database.batch();
		for (const installation of installations.docs)
			batch.delete(installation.ref);
		await batch.commit();
		return false;
	}
	const communities = await database
		.collection('communities')
		.where('organizerUserId', '==', userId)
		.where('lifecycle.status', '==', 'Active')
		.limit(batchSize)
		.get();
	if (!communities.empty) {
		for (const community of communities.docs)
			await closeOrphanedCommunity(database, community.id, userId);
		return false;
	}
	const indexes = await database
		.collection(`users/${userId}/communityPostContributions`)
		.limit(batchSize)
		.get();
	if (!indexes.empty) {
		for (const index of indexes.docs) {
			await database.runTransaction(async (transaction) => {
				const currentIndex = await transaction.get(index.ref);
				if (!currentIndex.exists) return;
				const data = currentIndex.data();
				if (
					!data ||
					typeof data.communityId !== 'string' ||
					typeof data.postId !== 'string'
				) {
					transaction.delete(index.ref);
					return;
				}
				const post = database.doc(
					`communities/${data.communityId}/posts/${data.postId}`,
				);
				const record =
					typeof data.replyId === 'string'
						? post.collection('replies').doc(data.replyId)
						: post;
				const snapshot = await transaction.get(record);
				if (
					snapshot.exists &&
					snapshot.get('author.userId') === userId &&
					snapshot.get('communityId') === data.communityId &&
					(typeof data.replyId !== 'string' ||
						snapshot.get('postId') === data.postId)
				) {
					const now = Timestamp.now();
					const publication = snapshot.get('publication');
					transaction.update(record, {
						author: { userId, displayName: 'Former participant' },
						...(publication?.status === 'Published'
							? {
									publication:
										typeof data.replyId === 'string'
											? {
													status: 'AuthorDeleted',
													deletedAt: now,
												}
											: {
													status: 'AuthorDeleted',
													postType:
														publication.content
															?.postType,
													deletedAt: now,
												},
									revision:
										(snapshot.get('revision') ?? 0) + 1,
									updatedAt: now,
								}
							: {}),
					});
				}
				transaction.delete(index.ref);
			});
		}
		return false;
	}
	for (const kind of ['posts', 'replies'] as const) {
		const orphaned = await database
			.collectionGroup(kind)
			.where('author.userId', '==', userId)
			.where('publication.status', '==', 'Published')
			.limit(batchSize)
			.get();
		if (!orphaned.empty) {
			for (const record of orphaned.docs) {
				const segments = record.ref.path.split('/');
				if (
					segments[0] !== 'communities' ||
					segments[2] !== 'posts' ||
					(kind === 'replies' && segments[4] !== 'replies')
				)
					continue;
				await database.runTransaction(async (transaction) => {
					const current = await transaction.get(record.ref);
					if (
						!current.exists ||
						current.get('author.userId') !== userId ||
						current.get('publication.status') !== 'Published'
					)
						return;
					const now = Timestamp.now();
					transaction.update(record.ref, {
						author: { userId, displayName: 'Former participant' },
						publication:
							kind === 'replies'
								? { status: 'AuthorDeleted', deletedAt: now }
								: {
										status: 'AuthorDeleted',
										postType: current.get(
											'publication.content.postType',
										),
										deletedAt: now,
									},
						revision: (current.get('revision') ?? 0) + 1,
						updatedAt: now,
					});
				});
			}
			return false;
		}
	}
	const memberships = await database
		.collection(`users/${userId}/communityMemberships`)
		.limit(batchSize)
		.get();
	if (!memberships.empty) {
		for (const index of memberships.docs) {
			const communityId = index.id;
			await database.runTransaction(async (transaction) => {
				const current = await transaction.get(index.ref);
				const memberRef = database.doc(
					`communities/${communityId}/members/${userId}`,
				);
				const member = await transaction.get(memberRef);
				if (member.exists && member.get('userId') === userId) {
					transaction.update(memberRef, {
						lifecycle: {
							status: 'Removed',
							removedAt: Timestamp.now(),
						},
						updatedAt: Timestamp.now(),
					});
				}
				if (current.exists) transaction.delete(index.ref);
			});
		}
		return false;
	}
	const support = await database
		.collectionGroup('prayerAcknowledgments')
		.where('supporter.userId', '==', userId)
		.limit(batchSize)
		.get();
	if (!support.empty) {
		const batch = database.batch();
		for (const record of support.docs) batch.delete(record.ref);
		await batch.commit();
		return false;
	}
	return true;
};

const processExitBatch = async (
	database: Firestore,
	task: FirebaseFirestore.QueryDocumentSnapshot,
): Promise<void> => {
	const data = task.data();
	if (
		typeof data.communityId !== 'string' ||
		typeof data.userId !== 'string'
	) {
		await task.ref.delete();
		return;
	}
	const membership = await database
		.doc(`communities/${data.communityId}/members/${data.userId}`)
		.get();
	if (membership.exists && membership.get('lifecycle.status') === 'Active') {
		await task.ref.delete();
		return;
	}
	const support = await database
		.collectionGroup('prayerAcknowledgments')
		.where('supporter.userId', '==', data.userId)
		.where('communityId', '==', data.communityId)
		.limit(batchSize)
		.get();
	if (!support.empty) {
		for (const record of support.docs) {
			await database.runTransaction(async (transaction) => {
				const [currentMembership, currentSupport] = await Promise.all([
					transaction.get(
						database.doc(
							`communities/${data.communityId}/members/${data.userId}`,
						),
					),
					transaction.get(record.ref),
				]);
				if (
					currentMembership.get('lifecycle.status') !== 'Active' &&
					currentSupport.exists &&
					currentSupport.get('communityId') === data.communityId &&
					currentSupport.get('supporter.userId') === data.userId
				)
					transaction.delete(record.ref);
			});
		}
	}
	if (support.docs.length < batchSize) await task.ref.delete();
};

export const processCommunityCleanup = async (
	database: Firestore = getFirestore(),
): Promise<void> => {
	const deleted = await database
		.collection('communityAccountDeletionCleanup')
		.limit(10)
		.get();
	for (const task of deleted.docs) {
		if (await processDeletedAccountBatch(database, task.id))
			await task.ref.delete();
	}
	const exits = await database
		.collection('communityExitCleanup')
		.limit(10)
		.get();
	for (const task of exits.docs) await processExitBatch(database, task);
};

export const communityAuthUserDeleted = auth.user().onDelete(async (user) => {
	const database = getFirestore();
	await database
		.doc(`communityAccountDeletionCleanup/${user.uid}`)
		.set({ queuedAt: Timestamp.now() });
	await processDeletedAccountBatch(database, user.uid);
});

export const resumeCommunityCleanup = onSchedule(
	{ schedule: 'every 1 minutes', maxInstances: 1, timeoutSeconds: 540 },
	async () => processCommunityCleanup(),
);
