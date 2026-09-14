import {
	createCommunityAdministrationOperationId,
	getCommunityAdministrationReason,
	leaveCommunity,
	removeCommunityMember,
	transferCommunityOrganizer,
} from './community-administration.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation-id' }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});

it('creates operation IDs and reads only canonical administration reasons', () => {
	expect(createCommunityAdministrationOperationId()).toBe('operation-id');
	expect(
		getCommunityAdministrationReason({
			details: { reason: 'RevisionConflict' },
		}),
	).toBe('RevisionConflict');
	expect(
		getCommunityAdministrationReason({ details: { reason: 'Private' } }),
	).toBeNull();
});

it('calls and validates leave community', async () => {
	mockCall.mockResolvedValue({
		data: {
			communityId: 'group',
			leftAt: { seconds: 10, nanoseconds: 20 },
		},
	});
	await expect(
		leaveCommunity({ communityId: 'group', operationId: 'operation-id' }),
	).resolves.toEqual({
		communityId: 'group',
		leftAt: { seconds: 10, nanoseconds: 20 },
	});
	expect(mockCallable).toHaveBeenCalledWith('functions', 'leaveCommunity');
});

it('calls removal without accepting private data in the response', async () => {
	mockCall.mockResolvedValue({
		data: {
			communityId: 'group',
			memberUserId: 'member',
			removedAt: { seconds: 10, nanoseconds: 20 },
		},
	});
	await removeCommunityMember({
		communityId: 'group',
		memberUserId: 'member',
		privateReason: 'Membership ended by the community organizer.',
		operationId: 'operation-id',
	});
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'removeCommunityMember',
	);
	mockCall.mockResolvedValueOnce({
		data: {
			communityId: 'group',
			memberUserId: 'member',
			removedAt: { seconds: 10, nanoseconds: 20 },
			privateReason: 'private',
		},
	});
	await expect(
		removeCommunityMember({
			communityId: 'group',
			memberUserId: 'member',
			privateReason: 'Membership ended by the community organizer.',
			operationId: 'operation-id',
		}),
	).rejects.toThrow('Invalid community administration result.');
});

it('submits the authoritative expected revision for transfer', async () => {
	mockCall.mockResolvedValue({
		data: {
			community: {
				communityId: 'group',
				name: 'Grace Church',
				purpose: '',
				organizer: { userId: 'member', displayName: 'Maria' },
				status: 'Active',
			},
		},
	});
	await transferCommunityOrganizer({
		communityId: 'group',
		nextOrganizerUserId: 'member',
		expectedRevision: 4,
		operationId: 'operation-id',
	});
	expect(mockCall).toHaveBeenCalledWith({
		communityId: 'group',
		nextOrganizerUserId: 'member',
		expectedRevision: 4,
		operationId: 'operation-id',
	});
});
