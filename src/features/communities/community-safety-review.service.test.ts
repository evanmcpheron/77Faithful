import { auth } from '@td/services/firebase/firebase-auth.instance';
import { getIdTokenResult, type IdTokenResult } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
	hasCommunitySafetyReviewerCapability,
	listCommunitySafetyReports,
} from './community-safety-review.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('@td/services/firebase/firebase-auth.instance', () => ({
	auth: { currentUser: null },
}));
jest.mock('firebase/auth', () => ({ getIdTokenResult: jest.fn() }));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));

const queueReport = {
	reportId: 'report1',
	communityId: 'community1',
	reporterUserId: 'reporter1',
	target: { targetType: 'Post', postId: 'post1' },
	reason: 'Harassment',
	status: 'Submitted',
	revision: 0,
	createdAt: { seconds: 1_700_000_000, nanoseconds: 0 },
};

const mutableAuth = auth as { currentUser: typeof auth.currentUser };

beforeEach(() => {
	jest.clearAllMocks();
	mutableAuth.currentUser = null;
});

it('requires the separate verified reviewer claim and rejects an account switch during refresh', async () => {
	const reviewer = { uid: 'reviewer', emailVerified: true };
	mutableAuth.currentUser = reviewer as typeof auth.currentUser;
	let resolveToken!: (value: IdTokenResult) => void;
	jest.mocked(getIdTokenResult).mockImplementation(
		() =>
			new Promise<IdTokenResult>((resolve) => {
				resolveToken = resolve;
			}),
	);
	const pending = hasCommunitySafetyReviewerCapability('reviewer');
	mutableAuth.currentUser = {
		uid: 'another',
		emailVerified: true,
	} as typeof auth.currentUser;
	resolveToken({
		claims: { communitySafetyReviewer: true },
		authTime: '',
		expirationTime: '',
		issuedAtTime: '',
		signInProvider: null,
		signInSecondFactor: null,
		token: '',
	});
	await expect(pending).resolves.toBe(false);
	await expect(
		hasCommunitySafetyReviewerCapability('reviewer'),
	).resolves.toBe(false);
});

it('denies organizer and member accounts without the platform claim', async () => {
	for (const userId of ['organizer', 'member']) {
		mutableAuth.currentUser = {
			uid: userId,
			emailVerified: true,
		} as typeof auth.currentUser;
		jest.mocked(getIdTokenResult).mockResolvedValueOnce({
			claims: { communitySafetyReviewer: false },
			authTime: '',
			expirationTime: '',
			issuedAtTime: '',
			signInProvider: null,
			signInSecondFactor: null,
			token: '',
		});
		await expect(
			hasCommunitySafetyReviewerCapability(userId),
		).resolves.toBe(false);
	}
});

it('validates the paged safe queue contract and projects only safe fields', async () => {
	const callable = jest.fn().mockResolvedValue({
		data: { reports: [queueReport], nextCursor: 'report1' },
	});
	jest.mocked(httpsCallable).mockReturnValue(
		callable as unknown as ReturnType<typeof httpsCallable>,
	);
	callable.mockResolvedValueOnce({
		data: {
			reports: [{ ...queueReport, explanation: 'restricted text' }],
			nextCursor: 'report1',
		},
	});
	await expect(listCommunitySafetyReports({ pageSize: 20 })).resolves.toEqual(
		{ reports: [queueReport], nextCursor: 'report1' },
	);
	callable.mockResolvedValueOnce({
		data: {
			reports: [{ ...queueReport, reason: 'Unknown' }],
			nextCursor: null,
		},
	});
	await expect(listCommunitySafetyReports()).rejects.toThrow(
		'Invalid safety review response.',
	);
});
