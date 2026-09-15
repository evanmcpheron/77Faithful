import {
	FieldPath,
	getFirestore,
	Timestamp,
	type DocumentData,
	type DocumentSnapshot,
	type Firestore,
	type Query,
	type QueryDocumentSnapshot,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
	CommunityReaderLimits,
	parseGetCommunityContextRequest,
	parseListCommunitiesPageRequest,
	parseListCommunityMembersRequest,
} from '../../generated/features/communities/community-reader';
import type {
	IGetCommunityContextResult,
	IListCommunitiesPageResult,
	IListCommunityMembersResult,
	TCommunityReaderReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityMemberSummary,
	TCommunityRole,
} from '../../generated/types/community/community-membership.types';
import type {
	ICommunityCapabilities,
	ICommunitySummary,
	TCommunityStatus,
} from '../../generated/types/community/community.types';
import {
	hasActiveCommunityMembership,
	readCommunitySummary,
	requireCommunityAccount,
	resolveCommunityDisplayName,
} from './read-community';

type TCursorKind = 'communities' | 'members';

interface IReaderCursor {
	version: 1;
	kind: TCursorKind;
	scopeId: string;
	seconds: number;
	nanoseconds: number;
	documentId: string;
}

interface IAuthorizedCommunity {
	community: DocumentData;
	membership: DocumentData;
}

const readerError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityReaderReasonCode,
): HttpsError => new HttpsError(code, message, { reason });

const isSafeDocumentId = (value: unknown): value is string =>
	typeof value === 'string' &&
	value.length >= 1 &&
	value.length <= 128 &&
	!value.includes('/');

const encodeCursor = (
	kind: TCursorKind,
	scopeId: string,
	snapshot: QueryDocumentSnapshot,
): string => {
	const joinedAt: unknown = snapshot.get('joinedAt');
	if (!(joinedAt instanceof Timestamp))
		throw readerError(
			'internal',
			'This community list could not be loaded.',
			'CommunityUnavailable',
		);
	return Buffer.from(
		JSON.stringify({
			version: 1,
			kind,
			scopeId,
			seconds: joinedAt.seconds,
			nanoseconds: joinedAt.nanoseconds,
			documentId: snapshot.id,
		} satisfies IReaderCursor),
	).toString('base64url');
};

const decodeCursor = (
	value: string,
	expectedKind: TCursorKind,
	expectedScopeId: string,
): IReaderCursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
			throw new Error('Not a cursor record.');
		const cursor = decoded as Record<string, unknown>;
		if (
			Object.keys(cursor).length !== 6 ||
			cursor['version'] !== 1 ||
			cursor['kind'] !== expectedKind ||
			cursor['scopeId'] !== expectedScopeId ||
			typeof cursor['seconds'] !== 'number' ||
			!Number.isSafeInteger(cursor['seconds']) ||
			typeof cursor['nanoseconds'] !== 'number' ||
			!Number.isInteger(cursor['nanoseconds']) ||
			cursor['nanoseconds'] < 0 ||
			cursor['nanoseconds'] > 999999999 ||
			!isSafeDocumentId(cursor['documentId'])
		)
			throw new Error('Malformed cursor.');
		return {
			version: 1,
			kind: expectedKind,
			scopeId: expectedScopeId,
			seconds: cursor['seconds'],
			nanoseconds: cursor['nanoseconds'],
			documentId: cursor['documentId'],
		};
	} catch {
		throw readerError(
			'invalid-argument',
			'This community list position is unavailable. Start the list again.',
			'InvalidCursor',
		);
	}
};

const withCursor = (
	query: Query,
	cursor: string | undefined,
	kind: TCursorKind,
	scopeId: string,
): Query => {
	if (!cursor) return query;
	const parsed = decodeCursor(cursor, kind, scopeId);
	return query.startAfter(
		new Timestamp(parsed.seconds, parsed.nanoseconds),
		parsed.documentId,
	);
};

const getAuthorizedCommunity = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
): Promise<IAuthorizedCommunity> => {
	const [profile, community, membership] = await Promise.all([
		transaction.get(database.doc(`users/${userId}`)),
		transaction.get(database.doc(`communities/${communityId}`)),
		transaction.get(
			database.doc(`communities/${communityId}/members/${userId}`),
		),
	]);
	if (!profile.exists)
		throw readerError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	const communityData = community.data();
	const membershipData = membership.data();
	if (
		!communityData ||
		!membershipData ||
		membershipData.userId !== userId ||
		membershipData.communityId !== communityId ||
		membershipData.lifecycle?.status !== 'Active'
	)
		throw readerError(
			'permission-denied',
			'This community is unavailable to your account.',
			'CommunityUnavailable',
		);
	return { community: communityData, membership: membershipData };
};

const deriveRole = (
	community: DocumentData,
	membership: DocumentData,
	userId: string,
): TCommunityRole =>
	community.organizerUserId === userId && membership.role === 'Organizer'
		? 'Organizer'
		: 'Member';

const deriveCapabilities = (
	role: TCommunityRole,
	status: TCommunityStatus,
): ICommunityCapabilities => {
	const isAvailable = status === 'Active';
	const isOrganizer = role === 'Organizer';
	return {
		canReadMembers: true,
		canCreatePost: isAvailable,
		canInviteMembers: isAvailable && isOrganizer,
		canManageMembers: isAvailable && isOrganizer,
		canEditCommunity: isAvailable && isOrganizer,
		canCloseCommunity: isAvailable && isOrganizer,
		canLeaveCommunity: true,
	};
};

const requireCommunityStatus = (community: DocumentData): TCommunityStatus => {
	const status: unknown = community.lifecycle?.status;
	if (status !== 'Active' && status !== 'Closed')
		throw readerError(
			'internal',
			'This community could not be loaded.',
			'CommunityUnavailable',
		);
	return status;
};

const requireCommunityRevision = (community: DocumentData): number => {
	const revision: unknown = community.revision;
	if (
		typeof revision !== 'number' ||
		!Number.isInteger(revision) ||
		revision < 0 ||
		revision > 2_147_483_646
	)
		throw readerError(
			'internal',
			'This community could not be loaded.',
			'CommunityUnavailable',
		);
	return revision;
};

const profileDisplayName = (profile: DocumentSnapshot): string =>
	resolveCommunityDisplayName(profile.data()?.preferredName);

export const getCommunityContextForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IGetCommunityContextResult> => {
	let input;
	try {
		input = parseGetCommunityContextRequest(value);
	} catch {
		throw readerError(
			'invalid-argument',
			'Choose a community to open.',
			'InvalidInput',
		);
	}
	return database.runTransaction(async (transaction) => {
		const authorized = await getAuthorizedCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const [summary, profile, activeMembers] = await Promise.all([
			readCommunitySummary(transaction, database, input.communityId),
			transaction.get(database.doc(`users/${userId}`)),
			transaction.get(
				database
					.collection(`communities/${input.communityId}/members`)
					.where('lifecycle.status', '==', 'Active')
					.limit(CommunityReaderLimits.memberCount + 1),
			),
		]);
		const deletionTasks = await Promise.all(
			activeMembers.docs.map((snapshot) =>
				transaction.get(
					database.doc(
						`communityAccountDeletionCleanup/${snapshot.id}`,
					),
				),
			),
		);
		const role = deriveRole(
			authorized.community,
			authorized.membership,
			userId,
		);
		const status = requireCommunityStatus(authorized.community);
		const validActiveMemberCount = activeMembers.docs.filter(
			(snapshot, index) => {
				const membership = snapshot.data();
				return (
					!deletionTasks[index].exists &&
					membership.userId === snapshot.id &&
					membership.communityId === input.communityId &&
					membership.lifecycle?.status === 'Active'
				);
			},
		).length;
		return {
			context: {
				community: summary,
				communityRevision: requireCommunityRevision(
					authorized.community,
				),
				membership: {
					communityId: input.communityId,
					userId,
					displayName: profileDisplayName(profile),
					role,
					status: 'Active',
				},
				capabilities: deriveCapabilities(role, status),
				activeMemberCount: {
					value: Math.min(
						validActiveMemberCount,
						CommunityReaderLimits.memberCount,
					),
					isExact:
						activeMembers.size <= CommunityReaderLimits.memberCount,
				},
			},
		};
	});
};

export const listCommunityPageForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunitiesPageResult> => {
	let input;
	try {
		input = parseListCommunitiesPageRequest(value);
	} catch {
		throw readerError(
			'invalid-argument',
			'Choose a valid community list page.',
			'InvalidInput',
		);
	}
	return database.runTransaction(async (transaction) => {
		if (!(await transaction.get(database.doc(`users/${userId}`))).exists)
			throw readerError(
				'failed-precondition',
				'Your account is unavailable. Please sign in again.',
				'AccountUnavailable',
			);
		let query: Query = database
			.collection(`users/${userId}/communityMemberships`)
			.where('lifecycle.status', '==', 'Active')
			.orderBy('joinedAt', 'asc')
			.orderBy(FieldPath.documentId(), 'asc');
		query = withCursor(query, input.cursor, 'communities', userId).limit(
			(input.pageSize ?? CommunityReaderLimits.defaultPageSize) + 1,
		);
		const candidates = (await transaction.get(query)).docs;
		const pageSize =
			input.pageSize ?? CommunityReaderLimits.defaultPageSize;
		const page = candidates.slice(0, pageSize);
		const communities: ICommunitySummary[] = [];
		for (const snapshot of page) {
			const membership = snapshot.data();
			if (
				membership.userId !== userId ||
				membership.communityId !== snapshot.id ||
				!(await hasActiveCommunityMembership(
					transaction,
					database,
					userId,
					snapshot.id,
				))
			)
				continue;
			communities.push(
				await readCommunitySummary(transaction, database, snapshot.id),
			);
		}
		return {
			communities,
			nextCursor:
				candidates.length > pageSize && page.length > 0
					? encodeCursor('communities', userId, page[page.length - 1])
					: null,
		};
	});
};

export const listCommunityMembersForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunityMembersResult> => {
	let input;
	try {
		input = parseListCommunityMembersRequest(value);
	} catch {
		throw readerError(
			'invalid-argument',
			'Choose a valid community member list page.',
			'InvalidInput',
		);
	}
	return database.runTransaction(async (transaction) => {
		const authorized = await getAuthorizedCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		let query: Query = database
			.collection(`communities/${input.communityId}/members`)
			.where('lifecycle.status', '==', 'Active')
			.orderBy('joinedAt', 'asc')
			.orderBy(FieldPath.documentId(), 'asc');
		query = withCursor(
			query,
			input.cursor,
			'members',
			input.communityId,
		).limit((input.pageSize ?? CommunityReaderLimits.defaultPageSize) + 1);
		const candidates = (await transaction.get(query)).docs;
		const pageSize =
			input.pageSize ?? CommunityReaderLimits.defaultPageSize;
		const page = candidates.slice(0, pageSize);
		const profiles = await Promise.all(
			page.map((snapshot) =>
				transaction.get(database.doc(`users/${snapshot.id}`)),
			),
		);
		const deletionTasks = await Promise.all(
			page.map((snapshot) =>
				transaction.get(
					database.doc(
						`communityAccountDeletionCleanup/${snapshot.id}`,
					),
				),
			),
		);
		const members: ICommunityMemberSummary[] = [];
		for (const [index, snapshot] of page.entries()) {
			const membership = snapshot.data();
			if (
				deletionTasks[index].exists ||
				membership.userId !== snapshot.id ||
				membership.communityId !== input.communityId ||
				membership.lifecycle?.status !== 'Active'
			)
				continue;
			members.push({
				communityId: input.communityId,
				userId: snapshot.id,
				displayName: profileDisplayName(profiles[index]),
				role:
					authorized.community.organizerUserId === snapshot.id &&
					membership.role === 'Organizer'
						? 'Organizer'
						: 'Member',
			});
		}
		return {
			members,
			nextCursor:
				candidates.length > pageSize && page.length > 0
					? encodeCursor(
							'members',
							input.communityId,
							page[page.length - 1],
						)
					: null,
		};
	});
};

export const getCommunityContext = onCall(async (request) =>
	getCommunityContextForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);

export const listCommunityPage = onCall(async (request) =>
	listCommunityPageForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);

export const listCommunityMembers = onCall(async (request) =>
	listCommunityMembersForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
