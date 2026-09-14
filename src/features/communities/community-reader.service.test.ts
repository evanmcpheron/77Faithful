import {
	getCommunity,
	getCommunityContext,
	getCommunityReaderReason,
	listCommunities,
} from './community-reader.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));
const community = {
	communityId: 'group',
	name: 'Grace Church',
	purpose: '',
	organizer: { userId: 'owner', displayName: 'Anna' },
	status: 'Active',
};
const context = {
	community,
	communityRevision: 4,
	membership: {
		communityId: 'group',
		userId: 'owner',
		displayName: 'Anna',
		role: 'Organizer',
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost: true,
		canInviteMembers: true,
		canManageMembers: true,
		canEditCommunity: true,
		canCloseCommunity: true,
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 3, isExact: true },
};
beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});
it('loads the canonical summary from the authenticated function', async () => {
	mockCall.mockResolvedValue({
		data: { ...community, privateExtra: 'hidden' },
	});
	expect(await getCommunity('group')).toEqual(community);
	expect(mockCallable).toHaveBeenCalledWith('functions', 'getCommunity');
	expect(mockCall).toHaveBeenCalledWith({ communityId: 'group' });
});
it('lists communities without accepting a caller-supplied user identity', async () => {
	mockCall.mockResolvedValue({ data: [community] });
	expect(await listCommunities()).toEqual([community]);
	expect(mockCallable).toHaveBeenCalledWith('functions', 'listCommunities');
	expect(mockCall).toHaveBeenCalledWith();
});
it('allows an absent profile name without inventing a fallback name', async () => {
	mockCall.mockResolvedValue({
		data: { ...community, organizer: { userId: 'owner', displayName: '' } },
	});
	expect((await getCommunity('group')).organizer.displayName).toBe('');
});
it('loads and validates the canonical role-aware community context', async () => {
	mockCall.mockResolvedValue({ data: { context } });
	expect(await getCommunityContext('group')).toEqual(context);
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'getCommunityContext',
	);
	expect(mockCall).toHaveBeenCalledWith({ communityId: 'group' });
});
it('rejects malformed context responses and reads only canonical denial reasons', async () => {
	mockCall.mockResolvedValueOnce({
		data: { context: { ...context, activeMemberCount: { value: -1 } } },
	});
	await expect(getCommunityContext('group')).rejects.toThrow(
		'Invalid community context response.',
	);
	expect(
		getCommunityReaderReason({
			details: { reason: 'CommunityUnavailable' },
		}),
	).toBe('CommunityUnavailable');
	expect(
		getCommunityReaderReason({ details: { reason: 'UnexpectedReason' } }),
	).toBeNull();
});
it('rejects a missing, fractional, or out-of-range community revision', async () => {
	const { communityRevision: _missing, ...withoutRevision } = context;
	for (const invalidContext of [
		withoutRevision,
		{ ...context, communityRevision: 1.5 },
		{ ...context, communityRevision: 2_147_483_647 },
	]) {
		mockCall.mockResolvedValueOnce({ data: { context: invalidContext } });
		await expect(getCommunityContext('group')).rejects.toThrow(
			'Invalid community context response.',
		);
	}
});
it('propagates denied access and rejects malformed responses', async () => {
	mockCall.mockRejectedValueOnce(new Error('permission-denied'));
	await expect(getCommunity('group')).rejects.toThrow('permission-denied');
	mockCall.mockResolvedValue({ data: {} });
	await expect(getCommunity('group')).rejects.toThrow();
	await expect(listCommunities()).rejects.toThrow();
	await expect(getCommunity('../other')).rejects.toThrow();
});
