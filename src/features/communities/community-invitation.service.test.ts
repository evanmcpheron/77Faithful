import {
	createCommunityInvitationOperationId,
	getCommunityInvitationReason,
	getCurrentCommunityInvitation,
	issueCommunityInvitation,
	revokeCommunityInvitation,
	rotateCommunityInvitation,
} from './community-invitation.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
const mockRandomUUID = jest.fn(() => 'operation-1');
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({
	randomUUID: () => mockRandomUUID(),
}));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));

const invitation = {
	communityId: 'group',
	invitationId: 'invitation-1',
	code: '23456-789AB-CDEFG-HJKMN',
	expiresAt: { seconds: 1_800_000_000, nanoseconds: 0 },
};

beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});

it('retrieves and runtime-validates the current invitation without creating one', async () => {
	mockCall.mockResolvedValue({ data: { invitation } });
	expect(await getCurrentCommunityInvitation('group')).toEqual(invitation);
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'getCurrentCommunityInvitation',
	);
	expect(mockCall).toHaveBeenCalledWith({ communityId: 'group' });

	mockCall.mockResolvedValueOnce({ data: { invitation: null } });
	expect(await getCurrentCommunityInvitation('group')).toBeNull();
});

it('calls the issue, rotate, and revoke contracts with validated requests', async () => {
	mockCall
		.mockResolvedValueOnce({ data: { invitation } })
		.mockResolvedValueOnce({
			data: {
				invitation: { ...invitation, invitationId: 'invitation-2' },
			},
		})
		.mockResolvedValueOnce({
			data: {
				communityId: 'group',
				invitationId: 'invitation-2',
				revokedAt: { seconds: 1_700_000_000, nanoseconds: 0 },
			},
		});
	await issueCommunityInvitation({
		communityId: 'group',
		operationId: 'issue-1',
	});
	await rotateCommunityInvitation({
		communityId: 'group',
		operationId: 'rotate-1',
	});
	await revokeCommunityInvitation({
		communityId: 'group',
		invitationId: 'invitation-2',
		operationId: 'revoke-1',
	});
	expect(mockCallable.mock.calls.map((call) => call[1])).toEqual([
		'issueCommunityInvitation',
		'rotateCommunityInvitation',
		'revokeCommunityInvitation',
	]);
	expect(mockCall.mock.calls).toEqual([
		[{ communityId: 'group', operationId: 'issue-1' }],
		[{ communityId: 'group', operationId: 'rotate-1' }],
		[
			{
				communityId: 'group',
				invitationId: 'invitation-2',
				operationId: 'revoke-1',
			},
		],
	]);
});

it('rejects malformed responses and exposes only canonical reason codes', async () => {
	mockCall.mockResolvedValue({
		data: { invitation: { ...invitation, code: 'secret' } },
	});
	await expect(getCurrentCommunityInvitation('group')).rejects.toThrow(
		'Invalid community invitation code.',
	);
	expect(
		getCommunityInvitationReason({
			details: { reason: 'OrganizerRequired' },
		}),
	).toBe('OrganizerRequired');
	expect(
		getCommunityInvitationReason({ details: { reason: 'Other' } }),
	).toBeNull();
});

it('creates an opaque operation identifier without persisting invitation data', () => {
	expect(createCommunityInvitationOperationId()).toBe('operation-1');
	expect(mockRandomUUID).toHaveBeenCalledTimes(1);
});
