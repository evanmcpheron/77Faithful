import { app } from '@td/services/firebase/firebase.instance';
import type {
	ICommunityReportDocument,
	ICommunitySafetyCurrentTarget,
	IGetCommunitySafetyReportRequest,
	IGetCommunitySafetyReportResult,
	IReviewCommunityReportRequest,
	IReviewCommunityReportResult,
	TCommunityReportTarget,
} from '@td/types/community/community-moderation.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseGetCommunitySafetyReportRequest,
	parseReviewCommunityReportRequest,
} from './community-safety';

const invalid = (): never => {
	throw new Error('Invalid safety review detail response.');
};
const record = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: invalid();
const id = (value: unknown): string =>
	typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value)
		? value
		: invalid();
const revision = (value: unknown): number =>
	typeof value === 'number' &&
	Number.isInteger(value) &&
	value >= 0 &&
	value < 2_147_483_647
		? value
		: invalid();
const timestamp = (value: unknown) => {
	const data = record(value);
	const seconds = data['seconds'];
	const nanoseconds = data['nanoseconds'];
	if (
		typeof seconds !== 'number' ||
		!Number.isInteger(seconds) ||
		typeof nanoseconds !== 'number' ||
		!Number.isInteger(nanoseconds) ||
		nanoseconds < 0 ||
		nanoseconds >= 1_000_000_000
	)
		return invalid();
	return { seconds, nanoseconds };
};
const optionalText = (value: unknown): string | undefined => {
	if (value === undefined) return undefined;
	return typeof value === 'string' ? value : invalid();
};
const target = (value: unknown): TCommunityReportTarget => {
	const data = record(value);
	switch (data['targetType']) {
		case 'Post':
			return { targetType: 'Post', postId: id(data['postId']) };
		case 'Reply':
			return {
				targetType: 'Reply',
				postId: id(data['postId']),
				replyId: id(data['replyId']),
			};
		case 'Member':
			return { targetType: 'Member', userId: id(data['userId']) };
		case 'Community':
			return { targetType: 'Community' };
		case 'Message':
			return {
				targetType: 'Message',
				conversationId: id(data['conversationId']),
				messageId: id(data['messageId']),
			};
		default:
			return invalid();
	}
};
const report = (value: unknown): ICommunityReportDocument => {
	const data = record(value);
	const evidence = record(data['evidence']);
	const review = record(data['review']);
	const reason = data['reason'];
	if (
		data['schemaVersion'] !== 1 ||
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
		return invalid();
	const status = review['status'];
	let parsedReview: ICommunityReportDocument['review'];
	if (status === 'Submitted') parsedReview = { status };
	else if (status === 'UnderReview')
		parsedReview = {
			status,
			reviewerUserId: id(review['reviewerUserId']),
			reviewStartedAt: timestamp(review['reviewStartedAt']),
		};
	else if (status === 'Resolved')
		parsedReview = {
			status,
			moderationActionId: id(review['moderationActionId']),
			reviewerUserId: id(review['reviewerUserId']),
			resolvedAt: timestamp(review['resolvedAt']),
		};
	else return invalid();
	const role = evidence['targetRole'];
	if (role !== undefined && role !== 'Organizer' && role !== 'Member')
		return invalid();
	return {
		schemaVersion: 1,
		communityId: id(data['communityId']),
		reporterUserId: id(data['reporterUserId']),
		target: target(data['target']),
		reason: reason as ICommunityReportDocument['reason'],
		...(optionalText(data['explanation']) !== undefined
			? { explanation: data['explanation'] as string }
			: {}),
		review: parsedReview,
		revision: revision(data['revision']),
		createdAt: timestamp(data['createdAt']),
		updatedAt: timestamp(data['updatedAt']),
		evidence: {
			targetRevision: revision(evidence['targetRevision']),
			...(optionalText(evidence['text']) !== undefined
				? { text: evidence['text'] as string }
				: {}),
			...(evidence['targetUserId'] !== undefined
				? { targetUserId: id(evidence['targetUserId']) }
				: {}),
			...(optionalText(evidence['targetDisplayName']) !== undefined
				? { targetDisplayName: evidence['targetDisplayName'] as string }
				: {}),
			...(role !== undefined ? { targetRole: role } : {}),
			...(optionalText(evidence['communityName']) !== undefined
				? { communityName: evidence['communityName'] as string }
				: {}),
			...(optionalText(evidence['communityPurpose']) !== undefined
				? { communityPurpose: evidence['communityPurpose'] as string }
				: {}),
		},
	};
};
const currentTarget = (value: unknown): ICommunitySafetyCurrentTarget => {
	const data = record(value);
	if (
		typeof data['status'] !== 'string' ||
		![
			'Published',
			'AuthorDeleted',
			'ModeratorRemoved',
			'Active',
			'Closed',
			'Left',
			'Removed',
		].includes(data['status'])
	)
		return invalid();
	const digest = data['textDigest'];
	if (
		digest !== undefined &&
		(typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest))
	)
		return invalid();
	const role = data['role'];
	if (role !== undefined && role !== 'Organizer' && role !== 'Member')
		return invalid();
	return {
		revision: revision(data['revision']),
		status: data['status'],
		...(optionalText(data['text']) !== undefined
			? { text: data['text'] as string }
			: {}),
		...(digest !== undefined ? { textDigest: digest as string } : {}),
		...(data['userId'] !== undefined ? { userId: id(data['userId']) } : {}),
		...(role !== undefined ? { role } : {}),
	};
};

export const createReviewOperationId = (): string => randomUUID();

export const getCommunitySafetyReport = async (
	input: IGetCommunitySafetyReportRequest,
): Promise<IGetCommunitySafetyReportResult> => {
	const request = parseGetCommunitySafetyReportRequest(input);
	const callable = httpsCallable<IGetCommunitySafetyReportRequest, unknown>(
		getFunctions(app),
		'getCommunitySafetyReport',
	);
	const data = record((await callable(request)).data);
	const reportId = id(data['reportId']);
	if (reportId !== request.reportId) return invalid();
	return {
		reportId,
		report: report(data['report']),
		currentTarget: currentTarget(data['currentTarget']),
	};
};

export const reviewCommunityReport = async (
	input: IReviewCommunityReportRequest,
): Promise<IReviewCommunityReportResult> => {
	const request = parseReviewCommunityReportRequest(input);
	const callable = httpsCallable<IReviewCommunityReportRequest, unknown>(
		getFunctions(app),
		'reviewCommunityReport',
	);
	const data = record((await callable(request)).data);
	if (
		id(data['reportId']) !== request.reportId ||
		data['status'] !== 'Resolved'
	)
		return invalid();
	return {
		reportId: request.reportId,
		moderationActionId: id(data['moderationActionId']),
		status: 'Resolved',
	};
};

export const safetyReviewReason = (error: unknown): string | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return typeof details.reason === 'string' ? details.reason : null;
};
