import { CommunityReportReason } from '@td/types/community/community-moderation.types';
import {
	blockCommunityMember,
	createCommunitySafetyOperationId,
	getCommunitySafetyReason,
	listBlockedCommunityMembers,
	reportCommunityContent,
	unblockCommunityMember,
} from './community-safety.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation-1' }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});

const targets = [
	{ targetType: 'Post' as const, postId: 'post-1' },
	{ targetType: 'Reply' as const, postId: 'post-1', replyId: 'reply-1' },
	{ targetType: 'Member' as const, userId: 'organizer-1' },
	{ targetType: 'Community' as const },
];

it.each(targets)(
	'submits a canonical $targetType target and private explanation',
	async (target) => {
		mockCall.mockResolvedValue({
			data: { reportId: 'report-1', status: 'Submitted' },
		});
		const result = await reportCommunityContent({
			communityId: 'closed-archive',
			target,
			reason: CommunityReportReason.PrivacyViolation,
			explanation: '  Private concern.  ',
			operationId: 'operation-1',
		});
		expect(result).toEqual({ reportId: 'report-1', status: 'Submitted' });
		expect(mockCallable).toHaveBeenCalledWith(
			'functions',
			'reportCommunityContent',
		);
		expect(mockCall.mock.calls[0][0]).toEqual({
			communityId: 'closed-archive',
			target,
			reason: 'PrivacyViolation',
			explanation: 'Private concern.',
			operationId: 'operation-1',
		});
	},
);

it.each(Object.values(CommunityReportReason))(
	'accepts server reason %s',
	async (reason) => {
		mockCall.mockResolvedValue({
			data: { reportId: 'report-1', status: 'Submitted' },
		});
		await expect(
			reportCommunityContent({
				communityId: 'group',
				target: { targetType: 'Community' },
				reason,
				operationId: 'operation-1',
			}),
		).resolves.toHaveProperty('status', 'Submitted');
	},
);

it('rejects unsupported targets and invalid receipts without claiming success', async () => {
	await expect(
		reportCommunityContent({
			communityId: 'group',
			target: {
				targetType: 'Message',
				conversationId: 'c',
				messageId: 'm',
			},
			reason: 'Other',
			operationId: 'operation-1',
		}),
	).rejects.toThrow();
	expect(mockCall).not.toHaveBeenCalled();
	mockCall.mockResolvedValue({
		data: { reportId: 'report-1', status: 'Resolved' },
	});
	await expect(
		reportCommunityContent({
			communityId: 'group',
			target: { targetType: 'Community' },
			reason: 'Other',
			operationId: 'operation-1',
		}),
	).rejects.toThrow('Invalid community safety response.');
});

it('keeps stale targets and server failures visible to the caller', async () => {
	const error = { details: { reason: 'TargetUnavailable' } };
	mockCall.mockRejectedValue(error);
	await expect(
		reportCommunityContent({
			communityId: 'group',
			target: { targetType: 'Post', postId: 'post-1' },
			reason: 'Other',
			operationId: 'operation-1',
		}),
	).rejects.toBe(error);
	expect(getCommunitySafetyReason(error)).toBe('TargetUnavailable');
	expect(
		getCommunitySafetyReason({ details: { reason: 'SecretReviewDetail' } }),
	).toBeNull();
});

it('validates block, unblock, and the owner-only blocked list responses', async () => {
	expect(createCommunitySafetyOperationId()).toBe('operation-1');
	mockCall
		.mockResolvedValueOnce({
			data: { memberUserId: 'member-1', isBlocked: true },
		})
		.mockResolvedValueOnce({
			data: {
				members: [{ blockedUserId: 'member-1', displayName: 'Jordan' }],
				nextCursor: null,
			},
		})
		.mockResolvedValueOnce({
			data: { memberUserId: 'member-1', isBlocked: false },
		});
	await expect(
		blockCommunityMember({
			communityId: 'group',
			memberUserId: 'member-1',
			operationId: 'operation-1',
		}),
	).resolves.toHaveProperty('isBlocked', true);
	await expect(
		listBlockedCommunityMembers({ pageSize: 20 }),
	).resolves.toEqual({
		members: [{ blockedUserId: 'member-1', displayName: 'Jordan' }],
		nextCursor: null,
	});
	await expect(
		unblockCommunityMember({
			memberUserId: 'member-1',
			operationId: 'operation-2',
		}),
	).resolves.toHaveProperty('isBlocked', false);
	expect(mockCallable.mock.calls.map((call) => call[1])).toEqual([
		'blockCommunityMember',
		'listBlockedCommunityMembers',
		'unblockCommunityMember',
	]);
});
