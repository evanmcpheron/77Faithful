import {
	createCommunityPost,
	createCommunityPostOperationId,
	editCommunityPost,
	getCommunityPost,
	getCommunityPostReason,
} from './community-post.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation-1' }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));

const timestamp = { seconds: 10, nanoseconds: 20 };
const post = {
	schemaVersion: 1,
	communityId: 'group',
	postId: 'post-1',
	author: { userId: 'owner', displayName: 'Anna' },
	revision: 2,
	createdAt: timestamp,
	updatedAt: timestamp,
	editedAt: null,
	publication: {
		status: 'Published',
		content: { postType: 'Discussion', text: 'Welcome.' },
	},
};

beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});

it('creates operation IDs and exposes only canonical reason codes', () => {
	expect(createCommunityPostOperationId()).toBe('operation-1');
	expect(
		getCommunityPostReason({ details: { reason: 'RevisionConflict' } }),
	).toBe('RevisionConflict');
	expect(
		getCommunityPostReason({ details: { reason: 'PrivateServerDetail' } }),
	).toBeNull();
});

it('validates and calls create and edit contracts', async () => {
	mockCall
		.mockResolvedValueOnce({
			data: {
				communityId: 'group',
				postId: 'post-1',
				revision: 0,
				createdAt: timestamp,
			},
		})
		.mockResolvedValueOnce({
			data: { postId: 'post-1', revision: 3, editedAt: timestamp },
		});
	await createCommunityPost({
		communityId: 'group',
		content: { postType: 'Discussion', text: ' Welcome. ' },
		operationId: 'operation-1',
	});
	await editCommunityPost({
		communityId: 'group',
		postId: 'post-1',
		text: 'Revised.',
		expectedRevision: 2,
		operationId: 'operation-2',
	});
	expect(mockCallable.mock.calls.map((call) => call[1])).toEqual([
		'createCommunityPost',
		'editCommunityPost',
	]);
	expect(mockCall.mock.calls[0][0].content.text).toBe('Welcome.');
});

it('runtime-validates a published post projection', async () => {
	mockCall.mockResolvedValue({ data: { post } });
	await expect(
		getCommunityPost({ communityId: 'group', postId: 'post-1' }),
	).resolves.toEqual({ post });
	expect(mockCallable).toHaveBeenCalledWith('functions', 'getCommunityPost');

	mockCall.mockResolvedValueOnce({
		data: { post: { ...post, schemaVersion: 99 } },
	});
	await expect(
		getCommunityPost({ communityId: 'group', postId: 'post-1' }),
	).rejects.toThrow('Invalid community post response.');
});
