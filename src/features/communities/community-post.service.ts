import { app } from '@td/services/firebase/firebase.instance';
import type {
	ICreateCommunityPostRequest,
	ICreateCommunityPostResult,
	ICreateCommunityReplyRequest,
	ICreateCommunityReplyResult,
	IDeleteCommunityPostRequest,
	IDeleteCommunityPostResult,
	IDeleteCommunityReplyRequest,
	IDeleteCommunityReplyResult,
	IEditCommunityPostRequest,
	IEditCommunityPostResult,
	IEditCommunityReplyRequest,
	IEditCommunityReplyResult,
	IGetCommunityPostRequest,
	IGetCommunityPostResult,
	IListCommunityPostsRequest,
	IListCommunityPostsResult,
	IListCommunityPrayerSupportRequest,
	IListCommunityPrayerSupportResult,
	IListCommunityRepliesRequest,
	IListCommunityRepliesResult,
	ISetCommunityPrayerAcknowledgmentRequest,
	ISetCommunityPrayerAcknowledgmentResult,
	ISetCommunityPrayerRequestStatusRequest,
	ISetCommunityPrayerRequestStatusResult,
	TCommunityPostReasonCode,
} from '@td/types/community/community-post-function.types';
import type {
	ICommunityPost,
	ICommunityReply,
	TCommunityPostContent,
} from '@td/types/community/community-post.types';
import type { IPersistedTimestamp } from '@td/types/shared/persistence.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCreateCommunityPostRequest,
	parseCreateCommunityReplyRequest,
	parseDeleteCommunityPostRequest,
	parseDeleteCommunityReplyRequest,
	parseEditCommunityPostRequest,
	parseEditCommunityReplyRequest,
	parseGetCommunityPostRequest,
	parseListCommunityPostsRequest,
	parseListCommunityPrayerSupportRequest,
	parseListCommunityRepliesRequest,
	parseSetCommunityPrayerAcknowledgmentRequest,
	parseSetCommunityPrayerRequestStatusRequest,
} from './community-post';

const postReasons: readonly TCommunityPostReasonCode[] = [
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'InvalidCursor',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'MembershipUnavailable',
	'OrganizerRequired',
	'PostUnavailable',
	'PostAuthorRequired',
	'ReplyUnavailable',
	'ReplyAuthorRequired',
	'PrayerRequestRequired',
	'RevisionConflict',
	'OperationPayloadMismatch',
	'PostDataUnavailable',
];

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community post response.');
	return value as Record<string, unknown>;
};

const identifier = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid community post response.');
	return value;
};

const timestamp = (value: unknown): IPersistedTimestamp => {
	const input = record(value);
	if (
		typeof input['seconds'] !== 'number' ||
		!Number.isInteger(input['seconds']) ||
		typeof input['nanoseconds'] !== 'number' ||
		!Number.isInteger(input['nanoseconds']) ||
		input['nanoseconds'] < 0 ||
		input['nanoseconds'] > 999_999_999
	)
		throw new Error('Invalid community post response.');
	return {
		seconds: input['seconds'],
		nanoseconds: input['nanoseconds'],
	};
};

const revision = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 0 ||
		value > 2_147_483_646
	)
		throw new Error('Invalid community post response.');
	return value;
};

const content = (value: unknown): TCommunityPostContent => {
	const input = record(value);
	const postType = input['postType'];
	const text = input['text'];
	if (typeof text !== 'string' || !text.trim() || text.length > 10_000)
		throw new Error('Invalid community post response.');
	if (postType === 'PrayerRequest') {
		if (
			!['Current', 'NoLongerCurrent', 'Answered'].includes(
				String(input['prayerRequestStatus']),
			)
		)
			throw new Error('Invalid community post response.');
		return {
			postType,
			text,
			prayerRequestStatus: input['prayerRequestStatus'] as
				'Current' | 'NoLongerCurrent' | 'Answered',
		};
	}
	if (
		postType !== 'Discussion' &&
		postType !== 'OrganizerAnnouncement' &&
		postType !== 'SharedReflectionCopy'
	)
		throw new Error('Invalid community post response.');
	return { postType, text };
};

const parsePost = (value: unknown): ICommunityPost => {
	const input = record(value);
	const author = record(input['author']);
	const publication = record(input['publication']);
	const status = publication['status'];
	if (input['schemaVersion'] !== 1)
		throw new Error('Invalid community post response.');
	const base = {
		schemaVersion: 1 as const,
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
		author: {
			userId: identifier(author['userId']),
			displayName:
				typeof author['displayName'] === 'string' &&
				author['displayName'].length <= 80
					? author['displayName']
					: (() => {
							throw new Error('Invalid community post response.');
						})(),
		},
		revision: revision(input['revision']),
		...(input['replyCount'] === undefined
			? {}
			: { replyCount: revision(input['replyCount']) }),
		createdAt: timestamp(input['createdAt']),
		updatedAt: timestamp(input['updatedAt']),
		editedAt:
			input['editedAt'] === null ? null : timestamp(input['editedAt']),
	};
	if (status === 'Published')
		return {
			...base,
			publication: { status, content: content(publication['content']) },
		};
	if (status === 'AuthorDeleted')
		return {
			...base,
			publication: {
				status,
				postType: contentType(publication['postType']),
				deletedAt: timestamp(publication['deletedAt']),
			},
		};
	if (status === 'ModeratorRemoved')
		return {
			...base,
			publication: {
				status,
				postType: contentType(publication['postType']),
				removedAt: timestamp(publication['removedAt']),
			},
		};
	throw new Error('Invalid community post response.');
};

const parseReply = (value: unknown): ICommunityReply => {
	const input = record(value);
	const author = record(input['author']);
	const publication = record(input['publication']);
	const status = publication['status'];
	if (input['schemaVersion'] !== 1)
		throw new Error('Invalid community post response.');
	const base = {
		schemaVersion: 1 as const,
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
		replyId: identifier(input['replyId']),
		author: {
			userId: identifier(author['userId']),
			displayName:
				typeof author['displayName'] === 'string' &&
				author['displayName'].length <= 80
					? author['displayName']
					: (() => {
							throw new Error('Invalid community post response.');
						})(),
		},
		revision: revision(input['revision']),
		createdAt: timestamp(input['createdAt']),
		updatedAt: timestamp(input['updatedAt']),
		editedAt:
			input['editedAt'] === null ? null : timestamp(input['editedAt']),
	};
	if (status === 'Published') {
		if (
			typeof publication['text'] !== 'string' ||
			!publication['text'].trim() ||
			publication['text'].length > 10_000
		)
			throw new Error('Invalid community post response.');
		return {
			...base,
			publication: { status, text: publication['text'] },
		};
	}
	if (status === 'AuthorDeleted')
		return {
			...base,
			publication: {
				status,
				deletedAt: timestamp(publication['deletedAt']),
			},
		};
	if (status === 'ModeratorRemoved')
		return {
			...base,
			publication: {
				status,
				removedAt: timestamp(publication['removedAt']),
			},
		};
	throw new Error('Invalid community post response.');
};

const contentType = (value: unknown): TCommunityPostContent['postType'] => {
	if (
		value !== 'PrayerRequest' &&
		value !== 'Discussion' &&
		value !== 'OrganizerAnnouncement' &&
		value !== 'SharedReflectionCopy'
	)
		throw new Error('Invalid community post response.');
	return value;
};

const boolean = (value: unknown): boolean => {
	if (typeof value !== 'boolean')
		throw new Error('Invalid community post response.');
	return value;
};

export const createCommunityPostOperationId = (): string => randomUUID();

export const getCommunityPostReason = (
	error: unknown,
): TCommunityPostReasonCode | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return postReasons.find((reason) => reason === details.reason) ?? null;
};

export const createCommunityPost = async (
	input: ICreateCommunityPostRequest,
): Promise<ICreateCommunityPostResult> => {
	const request = parseCreateCommunityPostRequest(input);
	const callable = httpsCallable<ICreateCommunityPostRequest, unknown>(
		getFunctions(app),
		'createCommunityPost',
	);
	const result = record((await callable(request)).data);
	return {
		communityId: identifier(result['communityId']),
		postId: identifier(result['postId']),
		revision: revision(result['revision']),
		createdAt: timestamp(result['createdAt']),
	};
};

export const getCommunityPost = async (
	input: IGetCommunityPostRequest,
): Promise<IGetCommunityPostResult> => {
	const request = parseGetCommunityPostRequest(input);
	const callable = httpsCallable<IGetCommunityPostRequest, unknown>(
		getFunctions(app),
		'getCommunityPost',
	);
	return { post: parsePost(record((await callable(request)).data)['post']) };
};

export const listCommunityPosts = async (
	input: IListCommunityPostsRequest,
): Promise<IListCommunityPostsResult> => {
	const request = parseListCommunityPostsRequest(input);
	const callable = httpsCallable<IListCommunityPostsRequest, unknown>(
		getFunctions(app),
		'listCommunityPosts',
	);
	const result = record((await callable(request)).data);
	if (!Array.isArray(result['posts']))
		throw new Error('Invalid community post response.');
	const nextCursor = result['nextCursor'];
	if (
		nextCursor !== null &&
		(typeof nextCursor !== 'string' ||
			!/^[a-zA-Z0-9_-]{1,512}$/.test(nextCursor))
	)
		throw new Error('Invalid community post response.');
	return {
		posts: result['posts'].map(parsePost),
		nextCursor,
	};
};

export const listCommunityPrayerSupport = async (
	input: IListCommunityPrayerSupportRequest,
): Promise<IListCommunityPrayerSupportResult> => {
	const request = parseListCommunityPrayerSupportRequest(input);
	const callable = httpsCallable<IListCommunityPrayerSupportRequest, unknown>(
		getFunctions(app),
		'listCommunityPrayerSupport',
	);
	const result = record((await callable(request)).data);
	if (!Array.isArray(result['supporters']))
		throw new Error('Invalid community post response.');
	const nextCursor = result['nextCursor'];
	if (
		nextCursor !== null &&
		(typeof nextCursor !== 'string' ||
			!/^[a-zA-Z0-9_-]{1,512}$/.test(nextCursor))
	)
		throw new Error('Invalid community post response.');
	return {
		postId: identifier(result['postId']),
		supporters: result['supporters'].map((value) => {
			const supporter = record(value);
			return {
				userId: identifier(supporter['userId']),
				displayName:
					typeof supporter['displayName'] === 'string' &&
					supporter['displayName'].length <= 80
						? supporter['displayName']
						: (() => {
								throw new Error(
									'Invalid community post response.',
								);
							})(),
				acknowledgedAt: timestamp(supporter['acknowledgedAt']),
			};
		}),
		supportCount: revision(result['supportCount']),
		viewerIsPraying: boolean(result['viewerIsPraying']),
		nextCursor,
	};
};

export const editCommunityPost = async (
	input: IEditCommunityPostRequest,
): Promise<IEditCommunityPostResult> => {
	const request = parseEditCommunityPostRequest(input);
	const callable = httpsCallable<IEditCommunityPostRequest, unknown>(
		getFunctions(app),
		'editCommunityPost',
	);
	const result = record((await callable(request)).data);
	return {
		postId: identifier(result['postId']),
		revision: revision(result['revision']),
		editedAt: timestamp(result['editedAt']),
	};
};

export const deleteCommunityPost = async (
	input: IDeleteCommunityPostRequest,
): Promise<IDeleteCommunityPostResult> => {
	const request = parseDeleteCommunityPostRequest(input);
	const callable = httpsCallable<IDeleteCommunityPostRequest, unknown>(
		getFunctions(app),
		'deleteCommunityPost',
	);
	const result = record((await callable(request)).data);
	return {
		postId: identifier(result['postId']),
		deletedAt: timestamp(result['deletedAt']),
	};
};

export const listCommunityReplies = async (
	input: IListCommunityRepliesRequest,
): Promise<IListCommunityRepliesResult> => {
	const request = parseListCommunityRepliesRequest(input);
	const callable = httpsCallable<IListCommunityRepliesRequest, unknown>(
		getFunctions(app),
		'listCommunityReplies',
	);
	const result = record((await callable(request)).data);
	if (!Array.isArray(result['replies']))
		throw new Error('Invalid community post response.');
	const nextCursor = result['nextCursor'];
	if (
		nextCursor !== null &&
		(typeof nextCursor !== 'string' ||
			!/^[a-zA-Z0-9_-]{1,512}$/.test(nextCursor))
	)
		throw new Error('Invalid community post response.');
	return {
		replies: result['replies'].map(parseReply),
		replyCount: revision(result['replyCount']),
		nextCursor,
	};
};

export const createCommunityReply = async (
	input: ICreateCommunityReplyRequest,
): Promise<ICreateCommunityReplyResult> => {
	const request = parseCreateCommunityReplyRequest(input);
	const callable = httpsCallable<ICreateCommunityReplyRequest, unknown>(
		getFunctions(app),
		'createCommunityReply',
	);
	const result = record((await callable(request)).data);
	return {
		postId: identifier(result['postId']),
		replyId: identifier(result['replyId']),
		revision: revision(result['revision']),
		createdAt: timestamp(result['createdAt']),
	};
};

export const editCommunityReply = async (
	input: IEditCommunityReplyRequest,
): Promise<IEditCommunityReplyResult> => {
	const request = parseEditCommunityReplyRequest(input);
	const callable = httpsCallable<IEditCommunityReplyRequest, unknown>(
		getFunctions(app),
		'editCommunityReply',
	);
	const result = record((await callable(request)).data);
	return {
		replyId: identifier(result['replyId']),
		revision: revision(result['revision']),
		editedAt: timestamp(result['editedAt']),
	};
};

export const deleteCommunityReply = async (
	input: IDeleteCommunityReplyRequest,
): Promise<IDeleteCommunityReplyResult> => {
	const request = parseDeleteCommunityReplyRequest(input);
	const callable = httpsCallable<IDeleteCommunityReplyRequest, unknown>(
		getFunctions(app),
		'deleteCommunityReply',
	);
	const result = record((await callable(request)).data);
	return {
		replyId: identifier(result['replyId']),
		deletedAt: timestamp(result['deletedAt']),
	};
};

export const setCommunityPrayerRequestStatus = async (
	input: ISetCommunityPrayerRequestStatusRequest,
): Promise<ISetCommunityPrayerRequestStatusResult> => {
	const request = parseSetCommunityPrayerRequestStatusRequest(input);
	const callable = httpsCallable<
		ISetCommunityPrayerRequestStatusRequest,
		unknown
	>(getFunctions(app), 'setCommunityPrayerRequestStatus');
	const result = record((await callable(request)).data);
	const prayerRequestStatus = result['prayerRequestStatus'];
	if (
		prayerRequestStatus !== 'Current' &&
		prayerRequestStatus !== 'NoLongerCurrent' &&
		prayerRequestStatus !== 'Answered'
	)
		throw new Error('Invalid community post response.');
	return {
		postId: identifier(result['postId']),
		prayerRequestStatus,
		revision: revision(result['revision']),
	};
};

export const setCommunityPrayerAcknowledgment = async (
	input: ISetCommunityPrayerAcknowledgmentRequest,
): Promise<ISetCommunityPrayerAcknowledgmentResult> => {
	const request = parseSetCommunityPrayerAcknowledgmentRequest(input);
	const callable = httpsCallable<
		ISetCommunityPrayerAcknowledgmentRequest,
		unknown
	>(getFunctions(app), 'setCommunityPrayerAcknowledgment');
	const result = record((await callable(request)).data);
	return {
		postId: identifier(result['postId']),
		isPraying: boolean(result['isPraying']),
		revision:
			result['revision'] === null ? null : revision(result['revision']),
		updatedAt: timestamp(result['updatedAt']),
	};
};
