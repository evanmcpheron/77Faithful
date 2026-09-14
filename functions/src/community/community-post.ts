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
import {
	HttpsError,
	onCall,
	type CallableRequest,
} from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunityPostLimits,
	parseCreateCommunityPostRequest,
	parseDeleteCommunityPostRequest,
	parseEditCommunityPostRequest,
	parseGetCommunityPostRequest,
	parseListCommunityPostsRequest,
} from '../../generated/features/communities/community-post';
import type {
	ICreateCommunityPostRequest,
	ICreateCommunityPostResult,
	IDeleteCommunityPostRequest,
	IDeleteCommunityPostResult,
	IEditCommunityPostRequest,
	IEditCommunityPostResult,
	IGetCommunityPostResult,
	IListCommunityPostsRequest,
	IListCommunityPostsResult,
	TCommunityPostReasonCode,
} from '../../generated/types/community/community-post-function.types';
import type {
	ICommunityPost,
	TCommunityPostContent,
	TCommunityPostType,
	TPrayerRequestStatus,
} from '../../generated/types/community/community-post.types';
import { resolveCommunityDisplayName } from './read-community';

export interface ICommunityPostDependencies {
	database?: Firestore;
	now?: Timestamp;
}

export interface ICommunityAccess {
	community: DocumentData;
	displayName: string;
	isOrganizer: boolean;
}

interface IPostCursor {
	version: 1;
	kind: 'CommunityPosts';
	communityId: string;
	seconds: number;
	nanoseconds: number;
	postId: string;
}

type TPostMutationRequest =
	| ICreateCommunityPostRequest
	| IEditCommunityPostRequest
	| IDeleteCommunityPostRequest;

const identifierPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const postTypes: readonly TCommunityPostType[] = [
	'PrayerRequest',
	'Discussion',
	'OrganizerAnnouncement',
	'SharedReflectionCopy',
];
const prayerStatuses: readonly TPrayerRequestStatus[] = [
	'Current',
	'NoLongerCurrent',
	'Answered',
];

export const postError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityPostReasonCode,
): HttpsError => new HttpsError(code, message, { reason });

export const dataUnavailable = (): HttpsError =>
	postError(
		'internal',
		'This community post request could not be completed.',
		'PostDataUnavailable',
	);

export const requirePostAccount = (auth: CallableRequest['auth']): string => {
	if (!auth)
		throw postError(
			'unauthenticated',
			'Sign in to use community posts.',
			'AuthenticationRequired',
		);
	if (auth.token.email_verified !== true)
		throw postError(
			'permission-denied',
			'Confirm your email to use community posts.',
			'EmailVerificationRequired',
		);
	return auth.uid;
};

export const parseInput = <T>(
	parser: (value: unknown) => T,
	value: unknown,
): T => {
	try {
		return parser(value);
	} catch {
		throw postError(
			'invalid-argument',
			'Choose valid community post details.',
			'InvalidInput',
		);
	}
};

export const isIdentifier = (value: unknown): value is string =>
	typeof value === 'string' && identifierPattern.test(value);

export const requireTimestamp = (value: unknown): Timestamp => {
	if (!(value instanceof Timestamp)) throw dataUnavailable();
	return value;
};

export const requireRevision = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 0 ||
		value > CommunityPostLimits.maxRevision
	)
		throw dataUnavailable();
	return value;
};

const requireCommunity = (
	snapshot: DocumentSnapshot,
	communityId: string,
): DocumentData => {
	const community = snapshot.data();
	if (
		!community ||
		community.schemaVersion !== 1 ||
		community.lifecycle?.status === undefined ||
		!['Active', 'Closed'].includes(community.lifecycle.status) ||
		!isIdentifier(community.organizerUserId) ||
		snapshot.id !== communityId
	)
		throw postError(
			'not-found',
			'This community is unavailable.',
			'CommunityUnavailable',
		);
	return community;
};

export const requireAccountAndCommunity = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
): Promise<{ community: DocumentData; displayName: string }> => {
	const [profile, communitySnapshot] = await Promise.all([
		transaction.get(database.doc(`users/${userId}`)),
		transaction.get(database.doc(`communities/${communityId}`)),
	]);
	if (!profile.exists)
		throw postError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	return {
		community: requireCommunity(communitySnapshot, communityId),
		displayName: resolveCommunityDisplayName(profile.data()?.preferredName),
	};
};

const requireActiveMembership = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
	community: DocumentData,
): Promise<ICommunityAccess> => {
	const membership = await transaction.get(
		database.doc(`communities/${communityId}/members/${userId}`),
	);
	const data = membership.data();
	if (
		!data ||
		data.schemaVersion !== 1 ||
		data.userId !== userId ||
		data.communityId !== communityId ||
		(data.role !== 'Organizer' && data.role !== 'Member') ||
		data.lifecycle?.status !== 'Active'
	)
		throw postError(
			'permission-denied',
			'This community is unavailable to your account.',
			'MembershipUnavailable',
		);
	const profile = await transaction.get(database.doc(`users/${userId}`));
	if (!profile.exists)
		throw postError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	return {
		community,
		displayName: resolveCommunityDisplayName(profile.data()?.preferredName),
		isOrganizer:
			community.organizerUserId === userId && data.role === 'Organizer',
	};
};

export const getCommunityAccess = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
): Promise<ICommunityAccess> => {
	const communitySnapshot = await transaction.get(
		database.doc(`communities/${communityId}`),
	);
	const community = requireCommunity(communitySnapshot, communityId);
	return requireActiveMembership(
		transaction,
		database,
		userId,
		communityId,
		community,
	);
};

export const requireActiveCommunity = (community: DocumentData): void => {
	if (community.lifecycle.status === 'Closed')
		throw postError(
			'failed-precondition',
			'This community is a read-only archive.',
			'CommunityClosed',
		);
	if (community.lifecycle.status !== 'Active') throw dataUnavailable();
};

const parsePostContent = (value: unknown): TCommunityPostContent => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw dataUnavailable();
	const content = value as Record<string, unknown>;
	const postType = content['postType'];
	const text = content['text'];
	if (
		!postTypes.includes(postType as TCommunityPostType) ||
		typeof text !== 'string' ||
		text.length < 1 ||
		text.length > CommunityPostLimits.text
	)
		throw dataUnavailable();
	if (postType === 'PrayerRequest') {
		if (
			Object.keys(content).length !== 3 ||
			!prayerStatuses.includes(
				content['prayerRequestStatus'] as TPrayerRequestStatus,
			)
		)
			throw dataUnavailable();
		return {
			postType,
			text,
			prayerRequestStatus: content[
				'prayerRequestStatus'
			] as TPrayerRequestStatus,
		};
	}
	if (Object.keys(content).length !== 2) throw dataUnavailable();
	return {
		postType: postType as Exclude<TCommunityPostType, 'PrayerRequest'>,
		text,
	};
};

export const postProjection = (
	snapshot: DocumentSnapshot,
	communityId: string,
): ICommunityPost => {
	const post = snapshot.data();
	if (
		!post ||
		post.schemaVersion !== 1 ||
		post.communityId !== communityId ||
		!post.author ||
		!isIdentifier(post.author.userId) ||
		typeof post.author.displayName !== 'string' ||
		post.author.displayName.length > 80 ||
		!post.publication ||
		typeof post.publication !== 'object'
	)
		throw dataUnavailable();
	const createdAt = requireTimestamp(post.createdAt);
	const updatedAt = requireTimestamp(post.updatedAt);
	const editedAt =
		post.editedAt === null ? null : requireTimestamp(post.editedAt);
	const revision = requireRevision(post.revision);
	const publication = post.publication as Record<string, unknown>;
	const status = publication['status'];
	if (status === 'Published') {
		if (Object.keys(publication).length !== 2) throw dataUnavailable();
		return {
			postId: snapshot.id,
			schemaVersion: 1,
			communityId,
			author: {
				userId: post.author.userId,
				displayName: post.author.displayName,
			},
			revision,
			editedAt,
			publication: {
				status,
				content: parsePostContent(publication['content']),
			},
			createdAt,
			updatedAt,
		};
	}
	if (status !== 'AuthorDeleted' && status !== 'ModeratorRemoved')
		throw dataUnavailable();
	const timestampKey = status === 'AuthorDeleted' ? 'deletedAt' : 'removedAt';
	if (
		Object.keys(publication).length !== 3 ||
		!postTypes.includes(publication['postType'] as TCommunityPostType)
	)
		throw dataUnavailable();
	const tombstone = {
		status,
		postType: publication['postType'] as TCommunityPostType,
		[timestampKey]: requireTimestamp(publication[timestampKey]),
	};
	return {
		postId: snapshot.id,
		schemaVersion: 1,
		communityId,
		author: {
			userId: post.author.userId,
			displayName: post.author.displayName,
		},
		revision,
		editedAt,
		publication:
			status === 'AuthorDeleted'
				? {
						status,
						postType: tombstone.postType,
						deletedAt: tombstone.deletedAt as Timestamp,
					}
				: {
						status,
						postType: tombstone.postType,
						removedAt: tombstone.removedAt as Timestamp,
					},
		createdAt,
		updatedAt,
	};
};

const encodeCursor = (
	communityId: string,
	snapshot: QueryDocumentSnapshot,
): string => {
	const createdAt = requireTimestamp(snapshot.get('createdAt'));
	return Buffer.from(
		JSON.stringify({
			version: 1,
			kind: 'CommunityPosts',
			communityId,
			seconds: createdAt.seconds,
			nanoseconds: createdAt.nanoseconds,
			postId: snapshot.id,
		} satisfies IPostCursor),
	).toString('base64url');
};

const decodeCursor = (value: string, communityId: string): IPostCursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
			throw new Error('Invalid cursor record.');
		const cursor = decoded as Record<string, unknown>;
		if (
			Object.keys(cursor).length !== 6 ||
			cursor['version'] !== 1 ||
			cursor['kind'] !== 'CommunityPosts' ||
			cursor['communityId'] !== communityId ||
			typeof cursor['seconds'] !== 'number' ||
			!Number.isSafeInteger(cursor['seconds']) ||
			typeof cursor['nanoseconds'] !== 'number' ||
			!Number.isInteger(cursor['nanoseconds']) ||
			cursor['nanoseconds'] < 0 ||
			cursor['nanoseconds'] > 999_999_999 ||
			!isIdentifier(cursor['postId'])
		)
			throw new Error('Invalid cursor values.');
		return {
			version: 1,
			kind: 'CommunityPosts',
			communityId,
			seconds: cursor['seconds'],
			nanoseconds: cursor['nanoseconds'],
			postId: cursor['postId'],
		};
	} catch {
		throw postError(
			'invalid-argument',
			'This feed position is unavailable. Start the feed again.',
			'InvalidCursor',
		);
	}
};

const requestDigest = (input: TPostMutationRequest): string => {
	const request = { ...input } as Record<string, unknown>;
	delete request['operationId'];
	return createHash('sha256')
		.update(JSON.stringify(request), 'utf8')
		.digest('hex');
};

const operationReference = (
	database: Firestore,
	userId: string,
	kind: 'Create' | 'Edit' | 'Delete',
	operationId: string,
) =>
	database.doc(
		`users/${userId}/communityPost${kind}Operations/${operationId}`,
	);

const contributionReference = (
	database: Firestore,
	userId: string,
	communityId: string,
	postId: string,
) =>
	database.doc(
		`users/${userId}/communityPostContributions/${createHash('sha256')
			.update(`${communityId}\u0000${postId}`, 'utf8')
			.digest('hex')}`,
	);

const assertReceipt = (
	receipt: DocumentSnapshot,
	input: TPostMutationRequest,
): DocumentData | null => {
	if (!receipt.exists) return null;
	const data = receipt.data();
	if (!data || data.requestDigest !== requestDigest(input))
		throw postError(
			'already-exists',
			'This operation ID was already used for different post details.',
			'OperationPayloadMismatch',
		);
	return data;
};

const requirePublishedAuthor = (
	post: ICommunityPost,
	userId: string,
	access?: ICommunityAccess,
): Extract<ICommunityPost['publication'], { status: 'Published' }> => {
	if (post.author.userId !== userId)
		throw postError(
			'permission-denied',
			'Only the author can change these words.',
			'PostAuthorRequired',
		);
	if (post.publication.status !== 'Published')
		throw postError(
			'failed-precondition',
			'This post is no longer available to change.',
			'PostUnavailable',
		);
	if (
		post.publication.content.postType === 'OrganizerAnnouncement' &&
		access !== undefined &&
		!access.isOrganizer
	)
		throw postError(
			'permission-denied',
			'Only the current organizer can change an announcement.',
			'OrganizerRequired',
		);
	return post.publication;
};

const requireExpectedRevision = (
	post: ICommunityPost,
	expectedRevision: number,
): void => {
	if (post.revision !== expectedRevision)
		throw postError(
			'aborted',
			'This post changed. Review it and try again.',
			'RevisionConflict',
		);
};

export const createCommunityPostForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<ICreateCommunityPostResult> => {
	const input = parseInput(parseCreateCommunityPostRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database
		.collection(`communities/${input.communityId}/posts`)
		.doc();
	const receiptReference = operationReference(
		database,
		userId,
		'Create',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveCommunity(access.community);
		if (
			input.content.postType === 'OrganizerAnnouncement' &&
			!access.isOrganizer
		)
			throw postError(
				'permission-denied',
				'Only the current organizer can publish an announcement.',
				'OrganizerRequired',
			);
		const receipt = await transaction.get(receiptReference);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.communityId !== input.communityId ||
				!isIdentifier(previous.postId) ||
				previous.revision !== 0 ||
				!(previous.createdAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				communityId: input.communityId,
				postId: previous.postId,
				revision: 0,
				createdAt: previous.createdAt,
			};
		}
		const post = {
			schemaVersion: 1,
			communityId: input.communityId,
			author: { userId, displayName: access.displayName },
			revision: 0,
			editedAt: null,
			publication: { status: 'Published', content: input.content },
			createdAt: now,
			updatedAt: now,
		};
		transaction.create(postReference, post);
		transaction.create(
			contributionReference(
				database,
				userId,
				input.communityId,
				postReference.id,
			),
			{
				schemaVersion: 1,
				userId,
				communityId: input.communityId,
				postId: postReference.id,
				postType: input.content.postType,
				publicationStatus: 'Published',
				createdAt: now,
				updatedAt: now,
			},
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			communityId: input.communityId,
			postId: postReference.id,
			revision: 0,
			createdAt: now,
		});
		return {
			communityId: input.communityId,
			postId: postReference.id,
			revision: 0,
			createdAt: now,
		};
	});
};

export const getCommunityPostForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IGetCommunityPostResult> => {
	const input = parseInput(parseGetCommunityPostRequest, value);
	return database.runTransaction(async (transaction) => {
		await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const snapshot = await transaction.get(
			database.doc(
				`communities/${input.communityId}/posts/${input.postId}`,
			),
		);
		if (!snapshot.exists)
			throw postError(
				'not-found',
				'This post is unavailable.',
				'PostUnavailable',
			);
		return { post: postProjection(snapshot, input.communityId) };
	});
};

export const listCommunityPostsForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunityPostsResult> => {
	let input: IListCommunityPostsRequest;
	try {
		input = parseListCommunityPostsRequest(value);
	} catch {
		const candidate =
			value && typeof value === 'object' && !Array.isArray(value)
				? (value as Record<string, unknown>)['cursor']
				: undefined;
		if (
			candidate !== undefined &&
			(typeof candidate !== 'string' ||
				candidate.length < 1 ||
				candidate.length > CommunityPostLimits.cursor ||
				!/^[a-zA-Z0-9_-]+$/.test(candidate))
		)
			throw postError(
				'invalid-argument',
				'This feed position is unavailable. Start the feed again.',
				'InvalidCursor',
			);
		throw postError(
			'invalid-argument',
			'Choose a valid community post feed.',
			'InvalidInput',
		);
	}
	return database.runTransaction(async (transaction) => {
		await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		let query: Query = database
			.collection(`communities/${input.communityId}/posts`)
			.orderBy('createdAt', 'desc')
			.orderBy(FieldPath.documentId(), 'desc');
		if (input.cursor) {
			const cursor = decodeCursor(input.cursor, input.communityId);
			query = query.startAfter(
				new Timestamp(cursor.seconds, cursor.nanoseconds),
				cursor.postId,
			);
		}
		const pageSize = input.pageSize ?? CommunityPostLimits.defaultPageSize;
		const snapshots = await transaction.get(query.limit(pageSize + 1));
		const page = snapshots.docs.slice(0, pageSize);
		return {
			posts: page.map((snapshot) =>
				postProjection(snapshot, input.communityId),
			),
			nextCursor:
				snapshots.size > pageSize && page.length > 0
					? encodeCursor(input.communityId, page[page.length - 1])
					: null,
		};
	});
};

export const editCommunityPostForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<IEditCommunityPostResult> => {
	const input = parseInput(parseEditCommunityPostRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const receiptReference = operationReference(
		database,
		userId,
		'Edit',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveCommunity(access.community);
		const [snapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(receiptReference),
		]);
		if (!snapshot.exists)
			throw postError(
				'not-found',
				'This post is unavailable.',
				'PostUnavailable',
			);
		const post = postProjection(snapshot, input.communityId);
		const publication = requirePublishedAuthor(post, userId, access);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.postId !== input.postId ||
				typeof previous.revision !== 'number' ||
				!(previous.editedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				postId: input.postId,
				revision: previous.revision,
				editedAt: previous.editedAt,
			};
		}
		requireExpectedRevision(post, input.expectedRevision);
		const nextContent =
			publication.content.postType === 'PrayerRequest'
				? { ...publication.content, text: input.text }
				: { postType: publication.content.postType, text: input.text };
		const revision = post.revision + 1;
		transaction.update(postReference, {
			publication: { status: 'Published', content: nextContent },
			revision,
			editedAt: now,
			updatedAt: now,
		});
		transaction.set(
			contributionReference(
				database,
				userId,
				input.communityId,
				input.postId,
			),
			{ updatedAt: now },
			{ merge: true },
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			postId: input.postId,
			revision,
			editedAt: now,
			completedAt: now,
		});
		return { postId: input.postId, revision, editedAt: now };
	});
};

export const deleteCommunityPostForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<IDeleteCommunityPostResult> => {
	const input = parseInput(parseDeleteCommunityPostRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const receiptReference = operationReference(
		database,
		userId,
		'Delete',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		await requireAccountAndCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const [snapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(receiptReference),
		]);
		if (!snapshot.exists)
			throw postError(
				'not-found',
				'This post is unavailable.',
				'PostUnavailable',
			);
		const post = postProjection(snapshot, input.communityId);
		if (post.author.userId !== userId)
			throw postError(
				'permission-denied',
				'Only the author can delete these words.',
				'PostAuthorRequired',
			);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				post.publication.status !== 'AuthorDeleted' ||
				previous.postId !== input.postId ||
				!(previous.deletedAt instanceof Timestamp) ||
				post.publication.deletedAt.seconds !==
					previous.deletedAt.seconds ||
				post.publication.deletedAt.nanoseconds !==
					previous.deletedAt.nanoseconds
			)
				throw dataUnavailable();
			return { postId: input.postId, deletedAt: previous.deletedAt };
		}
		const publication = requirePublishedAuthor(post, userId);
		requireExpectedRevision(post, input.expectedRevision);
		transaction.update(postReference, {
			publication: {
				status: 'AuthorDeleted',
				postType: publication.content.postType,
				deletedAt: now,
			},
			revision: post.revision + 1,
			updatedAt: now,
		});
		transaction.set(
			contributionReference(
				database,
				userId,
				input.communityId,
				input.postId,
			),
			{
				publicationStatus: 'AuthorDeleted',
				deletedAt: now,
				updatedAt: now,
			},
			{ merge: true },
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			postId: input.postId,
			deletedAt: now,
			completedAt: now,
		});
		return { postId: input.postId, deletedAt: now };
	});
};

export const createCommunityPost = onCall(async (request) =>
	createCommunityPostForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const getCommunityPost = onCall(async (request) =>
	getCommunityPostForAccount(requirePostAccount(request.auth), request.data),
);

export const listCommunityPosts = onCall(async (request) =>
	listCommunityPostsForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const editCommunityPost = onCall(async (request) =>
	editCommunityPostForAccount(requirePostAccount(request.auth), request.data),
);

export const deleteCommunityPost = onCall(async (request) =>
	deleteCommunityPostForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
