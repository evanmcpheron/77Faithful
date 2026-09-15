import { httpsCallable } from 'firebase/functions';
import {
	getCommunitySafetyReport,
	reviewCommunityReport,
} from './community-safety-review-detail.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'operation1') }));

const report = {
	schemaVersion: 1,
	communityId: 'community1',
	reporterUserId: 'reporter1',
	target: { targetType: 'Post', postId: 'post1' },
	reason: 'Harassment',
	explanation: 'Restricted explanation',
	review: { status: 'Submitted' },
	revision: 2,
	createdAt: { seconds: 1700000000, nanoseconds: 0 },
	updatedAt: { seconds: 1700000001, nanoseconds: 0 },
	evidence: {
		targetRevision: 1,
		text: 'Submitted copy',
		targetUserId: 'author1',
	},
};
const detail = {
	reportId: 'report1',
	report,
	currentTarget: {
		revision: 2,
		status: 'Published',
		text: 'Later edit',
		textDigest: 'a'.repeat(64),
	},
};

beforeEach(() => jest.clearAllMocks());

it('validates restricted detail and retains submitted evidence separately from current content', async () => {
	const callable = jest.fn().mockResolvedValue({ data: detail });
	jest.mocked(httpsCallable).mockReturnValue(
		callable as unknown as ReturnType<typeof httpsCallable>,
	);
	await expect(
		getCommunitySafetyReport({ reportId: 'report1' }),
	).resolves.toEqual(detail);
	expect(httpsCallable).toHaveBeenCalledWith(
		undefined,
		'getCommunitySafetyReport',
	);
	callable.mockResolvedValueOnce({
		data: {
			...detail,
			currentTarget: { ...detail.currentTarget, textDigest: 'bad' },
		},
	});
	await expect(
		getCommunitySafetyReport({ reportId: 'report1' }),
	).rejects.toThrow('Invalid safety review detail response.');
});

it.each([
	'RemoveContent',
	'RemoveMember',
	'CloseCommunity',
	'NoAction',
] as const)(
	'sends exact revision preconditions for %s and validates the receipt',
	async (requestedAction) => {
		const callable = jest.fn().mockResolvedValue({
			data: {
				reportId: 'report1',
				moderationActionId: 'action1',
				status: 'Resolved',
			},
		});
		jest.mocked(httpsCallable).mockReturnValue(
			callable as unknown as ReturnType<typeof httpsCallable>,
		);
		const request = {
			reportId: 'report1',
			expectedRevision: 2,
			expectedTargetRevision: 3,
			reviewedCurrentTextDigest: 'a'.repeat(64),
			requestedAction,
			explanation: 'Restricted decision',
			operationId: 'operation1',
		};
		await expect(reviewCommunityReport(request)).resolves.toEqual({
			reportId: 'report1',
			moderationActionId: 'action1',
			status: 'Resolved',
		});
		expect(callable).toHaveBeenCalledWith(request);
	},
);
