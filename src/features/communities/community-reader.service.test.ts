import { getCommunity, listCommunities } from './community-reader.service';

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
it('propagates denied access and rejects malformed responses', async () => {
	mockCall.mockRejectedValueOnce(new Error('permission-denied'));
	await expect(getCommunity('group')).rejects.toThrow('permission-denied');
	mockCall.mockResolvedValue({ data: {} });
	await expect(getCommunity('group')).rejects.toThrow();
	await expect(listCommunities()).rejects.toThrow();
	await expect(getCommunity('../other')).rejects.toThrow();
});
