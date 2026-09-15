import type {
	IBlockCommunityMemberRequest,
	IListBlockedCommunityMembersRequest,
	IUnblockCommunityMemberRequest,
} from '../../types/community/community-block.types';
import type {
	IClaimCommunitySafetyReportRequest,
	IGetCommunitySafetyReportRequest,
	IListCommunitySafetyReportsRequest,
	IReportCommunityContentRequest,
	IReviewCommunityReportRequest,
	TCommunityReportTarget,
} from '../../types/community/community-moderation.types';

export const CommunitySafetyLimits = {
	explanation: 1000,
	pageSize: 50,
	cursor: 512,
	reportAttemptsPerTenMinutes: 5,
	postAttemptsPerTenMinutes: 10,
	maxSubmittedText: 10000,
} as const;

const identifierPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const cursorPattern = /^[a-zA-Z0-9_-]{1,512}$/;
const controls = /[\u0000-\u001f\u007f]/;

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid safety request.');
	return value as Record<string, unknown>;
};

const keys = (
	value: Record<string, unknown>,
	allowed: string[],
	required: string[],
) => {
	if (
		Object.keys(value).some((key) => !allowed.includes(key)) ||
		required.some((key) => !(key in value))
	)
		throw new Error('Unexpected safety request fields.');
};

const id = (value: unknown): string => {
	if (typeof value !== 'string' || !identifierPattern.test(value))
		throw new Error('Invalid identifier.');
	return value;
};

const explanation = (value: unknown): string => {
	if (typeof value !== 'string') throw new Error('Invalid explanation.');
	const trimmed = value.trim();
	if (
		!trimmed ||
		trimmed.length > CommunitySafetyLimits.explanation ||
		controls.test(trimmed)
	)
		throw new Error('Invalid explanation.');
	return trimmed;
};

export const parseGetCommunitySafetyReportRequest = (
	value: unknown,
): IGetCommunitySafetyReportRequest => {
	const input = record(value);
	keys(input, ['reportId'], ['reportId']);
	return { reportId: id(input['reportId']) };
};

export const parseClaimCommunitySafetyReportRequest = (
	value: unknown,
): IClaimCommunitySafetyReportRequest => {
	const input = record(value);
	keys(
		input,
		['reportId', 'expectedRevision', 'operationId'],
		['reportId', 'expectedRevision', 'operationId'],
	);
	const revision = input['expectedRevision'];
	if (
		typeof revision !== 'number' ||
		!Number.isInteger(revision) ||
		revision < 0 ||
		revision >= 2_147_483_647
	)
		throw new Error('Invalid revision.');
	return {
		reportId: id(input['reportId']),
		expectedRevision: revision,
		operationId: id(input['operationId']),
	};
};

export const parseListCommunitySafetyReportsRequest = (
	value: unknown,
): IListCommunitySafetyReportsRequest => {
	const input = record(value ?? {});
	keys(input, ['pageSize', 'cursor'], []);
	const pageSize = input['pageSize'];
	const cursor = input['cursor'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunitySafetyLimits.pageSize)
	)
		throw new Error('Invalid page size.');
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' ||
			cursor.length > CommunitySafetyLimits.cursor ||
			!/^[a-zA-Z0-9_-]+$/.test(cursor))
	)
		throw new Error('Invalid cursor.');
	return {
		...(pageSize === undefined ? {} : { pageSize }),
		...(cursor === undefined ? {} : { cursor }),
	};
};

export const parseReviewCommunityReportRequest = (
	value: unknown,
): IReviewCommunityReportRequest => {
	const input = record(value);
	keys(
		input,
		[
			'reportId',
			'expectedRevision',
			'expectedTargetRevision',
			'reviewedCurrentTextDigest',
			'requestedAction',
			'explanation',
			'operationId',
		],
		[
			'reportId',
			'expectedRevision',
			'expectedTargetRevision',
			'requestedAction',
			'explanation',
			'operationId',
		],
	);
	for (const field of ['expectedRevision', 'expectedTargetRevision']) {
		const revision = input[field];
		if (
			typeof revision !== 'number' ||
			!Number.isInteger(revision) ||
			revision < 0 ||
			revision >= 2_147_483_647
		)
			throw new Error('Invalid revision.');
	}
	if (
		![
			'RemoveContent',
			'RemoveMember',
			'CloseCommunity',
			'NoAction',
		].includes(input['requestedAction'] as string)
	)
		throw new Error('Invalid decision.');
	const reviewedCurrentTextDigest = input['reviewedCurrentTextDigest'];
	if (
		reviewedCurrentTextDigest !== undefined &&
		(typeof reviewedCurrentTextDigest !== 'string' ||
			!/^[a-f0-9]{64}$/.test(reviewedCurrentTextDigest))
	)
		throw new Error('Invalid current content acknowledgement.');
	return {
		reportId: id(input['reportId']),
		expectedRevision: input['expectedRevision'] as number,
		expectedTargetRevision: input['expectedTargetRevision'] as number,
		requestedAction: input[
			'requestedAction'
		] as IReviewCommunityReportRequest['requestedAction'],
		explanation: explanation(input['explanation']),
		operationId: id(input['operationId']),
		...(reviewedCurrentTextDigest === undefined
			? {}
			: { reviewedCurrentTextDigest }),
	};
};

const target = (value: unknown): TCommunityReportTarget => {
	const input = record(value);
	switch (input['targetType']) {
		case 'Post':
			keys(input, ['targetType', 'postId'], ['postId']);
			return { targetType: 'Post', postId: id(input['postId']) };
		case 'Reply':
			keys(
				input,
				['targetType', 'postId', 'replyId'],
				['postId', 'replyId'],
			);
			return {
				targetType: 'Reply',
				postId: id(input['postId']),
				replyId: id(input['replyId']),
			};
		case 'Member':
			keys(input, ['targetType', 'userId'], ['userId']);
			return { targetType: 'Member', userId: id(input['userId']) };
		case 'Community':
			keys(input, ['targetType'], []);
			return { targetType: 'Community' };
		default:
			throw new Error('Unsupported report target.');
	}
};

export const parseReportCommunityContentRequest = (
	value: unknown,
): IReportCommunityContentRequest => {
	const input = record(value);
	keys(
		input,
		['communityId', 'target', 'reason', 'explanation', 'operationId'],
		['communityId', 'target', 'reason', 'operationId'],
	);
	const reason = input['reason'];
	if (
		![
			'Harassment',
			'CoerciveReligiousPressure',
			'FinancialSolicitation',
			'PrivacyViolation',
			'UnsafeMedicalClaims',
			'AbuseOfSpiritualAuthority',
			'Other',
		].includes(reason as string)
	)
		throw new Error('Invalid report reason.');
	return {
		communityId: id(input['communityId']),
		target: target(input['target']),
		reason: reason as IReportCommunityContentRequest['reason'],
		...(input['explanation'] === undefined
			? {}
			: { explanation: explanation(input['explanation']) }),
		operationId: id(input['operationId']),
	};
};

export const parseBlockCommunityMemberRequest = (
	value: unknown,
): IBlockCommunityMemberRequest => {
	const input = record(value);
	keys(
		input,
		['communityId', 'memberUserId', 'operationId'],
		['communityId', 'memberUserId', 'operationId'],
	);
	return {
		communityId: id(input['communityId']),
		memberUserId: id(input['memberUserId']),
		operationId: id(input['operationId']),
	};
};

export const parseUnblockCommunityMemberRequest = (
	value: unknown,
): IUnblockCommunityMemberRequest => {
	const input = record(value);
	keys(
		input,
		['memberUserId', 'operationId'],
		['memberUserId', 'operationId'],
	);
	return {
		memberUserId: id(input['memberUserId']),
		operationId: id(input['operationId']),
	};
};

export const parseListBlockedCommunityMembersRequest = (
	value: unknown,
): IListBlockedCommunityMembersRequest => {
	const input = record(value);
	keys(input, ['pageSize', 'cursor'], []);
	const pageSize = input['pageSize'];
	const cursor = input['cursor'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunitySafetyLimits.pageSize)
	)
		throw new Error('Invalid page size.');
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' || !cursorPattern.test(cursor))
	)
		throw new Error('Invalid cursor.');
	return {
		...(pageSize === undefined ? {} : { pageSize }),
		...(cursor === undefined ? {} : { cursor }),
	};
};
