import type {
	ICreateCommunityPostRequest,
	ICreateCommunityReplyRequest,
	IDeleteCommunityPostRequest,
	IDeleteCommunityReplyRequest,
	IEditCommunityPostRequest,
	IEditCommunityReplyRequest,
	IGetCommunityPostRequest,
	IListCommunityPostsRequest,
	IListCommunityPrayerSupportRequest,
	IListCommunityRepliesRequest,
	IListOwnCommunityContributionsRequest,
	ISetCommunityPrayerAcknowledgmentRequest,
	ISetCommunityPrayerRequestStatusRequest,
} from '../../types/community/community-post-function.types';
import type { TCommunityPostContent } from '../../types/community/community-post.types';

export const CommunityPostLimits = {
	identifier: 128,
	text: 10_000,
	defaultPageSize: 20,
	maxPageSize: 50,
	cursor: 512,
	maxRevision: 2_147_483_646,
	maxActiveMembers: 500,
} as const;

const identifierPattern = /^[a-zA-Z0-9_-]+$/;
const cursorPattern = /^[a-zA-Z0-9_-]+$/;
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community post data.');
	return value as Record<string, unknown>;
};

const hasExactKeys = (
	value: Record<string, unknown>,
	keys: readonly string[],
): boolean =>
	Object.keys(value).length === keys.length &&
	keys.every((key) => key in value);

const hasOnlyKeys = (
	value: Record<string, unknown>,
	keys: readonly string[],
): boolean => Object.keys(value).every((key) => keys.includes(key));

const identifier = (value: unknown): string => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > CommunityPostLimits.identifier ||
		!identifierPattern.test(value)
	)
		throw new Error('Invalid community post identifier.');
	return value;
};

const text = (value: unknown): string => {
	if (typeof value !== 'string')
		throw new Error('Invalid community post text.');
	const normalized = value.trim();
	if (
		normalized.length < 1 ||
		normalized.length > CommunityPostLimits.text ||
		controlCharacterPattern.test(normalized)
	)
		throw new Error('Invalid community post text.');
	return normalized;
};

const revision = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 0 ||
		value > CommunityPostLimits.maxRevision
	)
		throw new Error('Invalid community post revision.');
	return value;
};

const content = (value: unknown): TCommunityPostContent => {
	const input = record(value);
	const postType = input['postType'];
	if (postType === 'PrayerRequest') {
		if (
			!hasExactKeys(input, ['postType', 'text', 'prayerRequestStatus']) ||
			input['prayerRequestStatus'] !== 'Current'
		)
			throw new Error('Invalid community prayer request.');
		return {
			postType,
			text: text(input['text']),
			prayerRequestStatus: 'Current',
		};
	}
	if (
		postType !== 'Discussion' &&
		postType !== 'OrganizerAnnouncement' &&
		postType !== 'SharedReflectionCopy'
	)
		throw new Error('Invalid community post type.');
	if (!hasExactKeys(input, ['postType', 'text']))
		throw new Error('Invalid community post content.');
	return { postType, text: text(input['text']) };
};

export const parseCreateCommunityPostRequest = (
	value: unknown,
): ICreateCommunityPostRequest => {
	const input = record(value);
	if (!hasExactKeys(input, ['communityId', 'content', 'operationId']))
		throw new Error('Invalid community post creation request.');
	return {
		communityId: identifier(input['communityId']),
		content: content(input['content']),
		operationId: identifier(input['operationId']),
	};
};

export const parseGetCommunityPostRequest = (
	value: unknown,
): IGetCommunityPostRequest => {
	const input = record(value);
	if (!hasExactKeys(input, ['communityId', 'postId']))
		throw new Error('Invalid community post request.');
	return {
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
	};
};

export const parseListCommunityPostsRequest = (
	value: unknown,
): IListCommunityPostsRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['communityId', 'pageSize', 'cursor']) ||
		!('communityId' in input)
	)
		throw new Error('Invalid community post list request.');
	const pageSize = input['pageSize'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunityPostLimits.maxPageSize)
	)
		throw new Error('Invalid community post page size.');
	const cursor = input['cursor'];
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' ||
			cursor.length < 1 ||
			cursor.length > CommunityPostLimits.cursor ||
			!cursorPattern.test(cursor))
	)
		throw new Error('Invalid community post cursor.');
	return {
		communityId: identifier(input['communityId']),
		pageSize:
			pageSize === undefined
				? CommunityPostLimits.defaultPageSize
				: pageSize,
		...(cursor === undefined ? {} : { cursor }),
	};
};

export const parseListOwnCommunityContributionsRequest = (
	value: unknown,
): IListOwnCommunityContributionsRequest => {
	const input = record(value);
	if (!hasOnlyKeys(input, ['pageSize', 'cursor']))
		throw new Error('Invalid contribution request.');
	const pageSize = input['pageSize'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunityPostLimits.maxPageSize)
	)
		throw new Error('Invalid contribution page size.');
	const cursor = input['cursor'];
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' ||
			cursor.length < 1 ||
			cursor.length > CommunityPostLimits.cursor ||
			!cursorPattern.test(cursor))
	)
		throw new Error('Invalid contribution cursor.');
	return {
		pageSize:
			pageSize === undefined
				? CommunityPostLimits.defaultPageSize
				: pageSize,
		...(cursor === undefined ? {} : { cursor }),
	};
};

export const parseEditCommunityPostRequest = (
	value: unknown,
): IEditCommunityPostRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'text',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid community post edit request.');
	return {
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
		text: text(input['text']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseDeleteCommunityPostRequest = (
	value: unknown,
): IDeleteCommunityPostRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid community post deletion request.');
	return {
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

const parseReplyTarget = (
	value: unknown,
): { communityId: string; postId: string } => {
	const input = record(value);
	return {
		communityId: identifier(input['communityId']),
		postId: identifier(input['postId']),
	};
};

export const parseListCommunityRepliesRequest = (
	value: unknown,
): IListCommunityRepliesRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['communityId', 'postId', 'pageSize', 'cursor']) ||
		!('communityId' in input) ||
		!('postId' in input)
	)
		throw new Error('Invalid community reply list request.');
	const target = parseReplyTarget(input);
	const pageSize = input['pageSize'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunityPostLimits.maxPageSize)
	)
		throw new Error('Invalid community reply page size.');
	const cursor = input['cursor'];
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' ||
			cursor.length < 1 ||
			cursor.length > CommunityPostLimits.cursor ||
			!cursorPattern.test(cursor))
	)
		throw new Error('Invalid community reply cursor.');
	return {
		...target,
		pageSize:
			pageSize === undefined
				? CommunityPostLimits.defaultPageSize
				: pageSize,
		...(cursor === undefined ? {} : { cursor }),
	};
};

export const parseCreateCommunityReplyRequest = (
	value: unknown,
): ICreateCommunityReplyRequest => {
	const input = record(value);
	if (!hasExactKeys(input, ['communityId', 'postId', 'text', 'operationId']))
		throw new Error('Invalid community reply creation request.');
	return {
		...parseReplyTarget(input),
		text: text(input['text']),
		operationId: identifier(input['operationId']),
	};
};

export const parseEditCommunityReplyRequest = (
	value: unknown,
): IEditCommunityReplyRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'replyId',
			'text',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid community reply edit request.');
	return {
		...parseReplyTarget(input),
		replyId: identifier(input['replyId']),
		text: text(input['text']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseDeleteCommunityReplyRequest = (
	value: unknown,
): IDeleteCommunityReplyRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'replyId',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid community reply deletion request.');
	return {
		...parseReplyTarget(input),
		replyId: identifier(input['replyId']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseSetCommunityPrayerRequestStatusRequest = (
	value: unknown,
): ISetCommunityPrayerRequestStatusRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'prayerRequestStatus',
			'expectedRevision',
			'operationId',
		]) ||
		!['Current', 'NoLongerCurrent', 'Answered'].includes(
			input['prayerRequestStatus'] as string,
		)
	)
		throw new Error('Invalid community prayer status request.');
	return {
		...parseReplyTarget(input),
		prayerRequestStatus: input[
			'prayerRequestStatus'
		] as ISetCommunityPrayerRequestStatusRequest['prayerRequestStatus'],
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseSetCommunityPrayerAcknowledgmentRequest = (
	value: unknown,
): ISetCommunityPrayerAcknowledgmentRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'postId',
			'isPraying',
			'operationId',
		]) ||
		typeof input['isPraying'] !== 'boolean'
	)
		throw new Error('Invalid community prayer acknowledgment request.');
	return {
		...parseReplyTarget(input),
		isPraying: input['isPraying'],
		operationId: identifier(input['operationId']),
	};
};

export const parseListCommunityPrayerSupportRequest = (
	value: unknown,
): IListCommunityPrayerSupportRequest =>
	parseListCommunityRepliesRequest(value);
