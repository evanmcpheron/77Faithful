import { auth } from '@td/services/firebase/firebase-auth.instance';
import { app } from '@td/services/firebase/firebase.instance';
import type {
	ICommunitySafetyReportQueueItem,
	IListCommunitySafetyReportsRequest,
	IListCommunitySafetyReportsResult,
	TCommunityReportTarget,
} from '@td/types/community/community-moderation.types';
import { getIdTokenResult } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { parseListCommunitySafetyReportsRequest } from './community-safety';

const invalidResponse = (): never => {
	throw new Error('Invalid safety review response.');
};
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		return invalidResponse();
	return value as Record<string, unknown>;
};
const id = (value: unknown): string =>
	typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value)
		? value
		: invalidResponse();
const target = (value: unknown): TCommunityReportTarget => {
	const input = record(value);
	switch (input['targetType']) {
		case 'Post':
			return { targetType: 'Post', postId: id(input['postId']) };
		case 'Reply':
			return {
				targetType: 'Reply',
				postId: id(input['postId']),
				replyId: id(input['replyId']),
			};
		case 'Member':
			return { targetType: 'Member', userId: id(input['userId']) };
		case 'Community':
			return { targetType: 'Community' };
		case 'Message':
			return {
				targetType: 'Message',
				conversationId: id(input['conversationId']),
				messageId: id(input['messageId']),
			};
		default:
			return invalidResponse();
	}
};
const queueItem = (value: unknown): ICommunitySafetyReportQueueItem => {
	const input = record(value);
	const timestamp = record(input['createdAt']);
	const seconds = timestamp['seconds'];
	const nanoseconds = timestamp['nanoseconds'];
	if (
		![
			'Harassment',
			'CoerciveReligiousPressure',
			'FinancialSolicitation',
			'PrivacyViolation',
			'UnsafeMedicalClaims',
			'AbuseOfSpiritualAuthority',
			'Other',
		].includes(input['reason'] as string) ||
		!['Submitted', 'UnderReview'].includes(input['status'] as string) ||
		typeof input['revision'] !== 'number' ||
		!Number.isInteger(input['revision']) ||
		input['revision'] < 0 ||
		typeof seconds !== 'number' ||
		!Number.isInteger(seconds) ||
		typeof nanoseconds !== 'number' ||
		!Number.isInteger(nanoseconds) ||
		nanoseconds < 0 ||
		nanoseconds >= 1_000_000_000
	)
		return invalidResponse();
	return {
		reportId: id(input['reportId']),
		communityId: id(input['communityId']),
		reporterUserId: id(input['reporterUserId']),
		target: target(input['target']),
		reason: input['reason'] as ICommunitySafetyReportQueueItem['reason'],
		status: input['status'] as ICommunitySafetyReportQueueItem['status'],
		revision: input['revision'],
		createdAt: { seconds, nanoseconds },
	};
};

export const hasCommunitySafetyReviewerCapability = async (
	userId: string,
): Promise<boolean> => {
	const user = auth.currentUser;
	if (!user || user.uid !== userId || !user.emailVerified) return false;
	const token = await getIdTokenResult(user, true);
	return (
		auth.currentUser === user &&
		user.emailVerified &&
		token.claims['communitySafetyReviewer'] === true
	);
};

export const listCommunitySafetyReports = async (
	input: IListCommunitySafetyReportsRequest = {},
): Promise<IListCommunitySafetyReportsResult> => {
	const request = parseListCommunitySafetyReportsRequest(input);
	const callable = httpsCallable<IListCommunitySafetyReportsRequest, unknown>(
		getFunctions(app),
		'listCommunitySafetyReports',
	);
	const result = record((await callable(request)).data);
	if (
		!Array.isArray(result['reports']) ||
		(result['nextCursor'] !== null &&
			(typeof result['nextCursor'] !== 'string' ||
				!/^[a-zA-Z0-9_-]{1,512}$/.test(result['nextCursor'])))
	)
		return invalidResponse();
	const reports = result['reports'].map(queueItem);
	if (
		new Set(reports.map((report) => report.reportId)).size !==
		reports.length
	)
		return invalidResponse();
	return { reports, nextCursor: result['nextCursor'] as string | null };
};

export const isSafetyReviewDenied = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') return false;
	const code = 'code' in error ? error.code : null;
	const details = 'details' in error ? error.details : null;
	const reason =
		details && typeof details === 'object' && 'reason' in details
			? details.reason
			: null;
	return (
		code === 'functions/permission-denied' ||
		code === 'functions/unauthenticated' ||
		reason === 'ReviewerRequired' ||
		reason === 'AuthenticationRequired' ||
		reason === 'EmailVerificationRequired'
	);
};
