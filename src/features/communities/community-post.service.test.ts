import {
	createCommunityPost,
	createCommunityPostOperationId,
	createCommunityReply,
	deleteCommunityPost,
	deleteCommunityReply,
	editCommunityPost,
	editCommunityReply,
	getCommunityPost,
	getCommunityPostReason,
	listCommunityPosts,
	listCommunityPrayerSupport,
	listCommunityReplies,
	listOwnCommunityContributions,
	setCommunityPrayerAcknowledgment,
	setCommunityPrayerRequestStatus,
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

const reply = {
	schemaVersion: 1,
	communityId: 'group',
	postId: 'post-1',
	replyId: 'reply-1',
	author: { userId: 'member', displayName: 'Jordan' },
	revision: 1,
	createdAt: timestamp,
	updatedAt: timestamp,
	editedAt: null,
	publication: { status: 'Published', text: 'I am praying.' },
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

it('reads only the canonical own-contribution projection without membership', async () => {
	mockCall.mockResolvedValue({
		data: {
			contributions: [
				{
					communityId: 'left-group',
					postId: 'post-1',
					kind: 'Post',
					publicationStatus: 'Published',
					revision: 2,
					createdAt: timestamp,
					text: 'My shared copy.',
				},
				{
					communityId: 'removed-group',
					postId: 'post-2',
					replyId: 'reply-1',
					kind: 'Reply',
					publicationStatus: 'AuthorDeleted',
					revision: 3,
					createdAt: timestamp,
				},
			],
			nextCursor: null,
		},
	});
	const result = await listOwnCommunityContributions({ pageSize: 20 });
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'listOwnCommunityContributions',
	);
	expect(result.contributions).toHaveLength(2);
	expect(result.contributions[1]).not.toHaveProperty('text');
	await expect(
		listOwnCommunityContributions({ pageSize: 0 }),
	).rejects.toThrow();
	mockCall.mockResolvedValue({
		data: {
			contributions: [
				{
					communityId: 'group',
					postId: 'post-1',
					kind: 'Post',
					publicationStatus: 'Published',
					revision: 1,
					createdAt: timestamp,
					text: 'Mine',
					otherReplyText: 'Another member',
				},
			],
			nextCursor: null,
		},
	});
	await expect(listOwnCommunityContributions({})).rejects.toThrow(
		'Invalid own contribution response.',
	);
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

it('runtime-validates feed and prayer support projections', async () => {
	mockCall
		.mockResolvedValueOnce({
			data: { posts: [post], nextCursor: 'cursor_1' },
		})
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				supporters: [
					{
						userId: 'member',
						displayName: 'Jordan',
						acknowledgedAt: timestamp,
					},
				],
				supportCount: 1,
				viewerIsPraying: true,
				nextCursor: null,
			},
		});
	await expect(
		listCommunityPosts({ communityId: 'group', pageSize: 20 }),
	).resolves.toEqual({ posts: [post], nextCursor: 'cursor_1' });
	await expect(
		listCommunityPrayerSupport({
			communityId: 'group',
			postId: 'post-1',
			pageSize: 1,
		}),
	).resolves.toEqual({
		postId: 'post-1',
		supporters: [
			{
				userId: 'member',
				displayName: 'Jordan',
				acknowledgedAt: timestamp,
			},
		],
		supportCount: 1,
		viewerIsPraying: true,
		nextCursor: null,
	});
	expect(mockCallable.mock.calls.map((call) => call[1])).toEqual([
		'listCommunityPosts',
		'listCommunityPrayerSupport',
	]);
});

it('rejects malformed feed and prayer support results', async () => {
	mockCall
		.mockResolvedValueOnce({ data: { posts: {}, nextCursor: null } })
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				supporters: [],
				supportCount: -1,
				viewerIsPraying: false,
				nextCursor: null,
			},
		});
	await expect(listCommunityPosts({ communityId: 'group' })).rejects.toThrow(
		'Invalid community post response.',
	);
	await expect(
		listCommunityPrayerSupport({
			communityId: 'group',
			postId: 'post-1',
		}),
	).rejects.toThrow('Invalid community post response.');
});

it('runtime-validates replies and calls every thread mutation contract', async () => {
	mockCall
		.mockResolvedValueOnce({
			data: { replies: [reply], replyCount: 1, nextCursor: null },
		})
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				replyId: 'reply-1',
				revision: 0,
				createdAt: timestamp,
			},
		})
		.mockResolvedValueOnce({
			data: { replyId: 'reply-1', revision: 2, editedAt: timestamp },
		})
		.mockResolvedValueOnce({
			data: { replyId: 'reply-1', deletedAt: timestamp },
		})
		.mockResolvedValueOnce({
			data: { postId: 'post-1', deletedAt: timestamp },
		})
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				prayerRequestStatus: 'Answered',
				revision: 3,
			},
		})
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				isPraying: true,
				revision: 1,
				updatedAt: timestamp,
			},
		});

	await listCommunityReplies({ communityId: 'group', postId: 'post-1' });
	await createCommunityReply({
		communityId: 'group',
		postId: 'post-1',
		text: 'I am praying.',
		operationId: 'operation-1',
	});
	await editCommunityReply({
		communityId: 'group',
		postId: 'post-1',
		replyId: 'reply-1',
		text: 'Still praying.',
		expectedRevision: 1,
		operationId: 'operation-2',
	});
	await deleteCommunityReply({
		communityId: 'group',
		postId: 'post-1',
		replyId: 'reply-1',
		expectedRevision: 2,
		operationId: 'operation-3',
	});
	await deleteCommunityPost({
		communityId: 'group',
		postId: 'post-1',
		expectedRevision: 2,
		operationId: 'operation-4',
	});
	await setCommunityPrayerRequestStatus({
		communityId: 'group',
		postId: 'post-1',
		prayerRequestStatus: 'Answered',
		expectedRevision: 2,
		operationId: 'operation-5',
	});
	await setCommunityPrayerAcknowledgment({
		communityId: 'group',
		postId: 'post-1',
		isPraying: true,
		operationId: 'operation-6',
	});

	expect(mockCallable.mock.calls.map((call) => call[1])).toEqual([
		'listCommunityReplies',
		'createCommunityReply',
		'editCommunityReply',
		'deleteCommunityReply',
		'deleteCommunityPost',
		'setCommunityPrayerRequestStatus',
		'setCommunityPrayerAcknowledgment',
	]);
});

it('rejects malformed reply and prayer mutation projections', async () => {
	mockCall
		.mockResolvedValueOnce({
			data: { replies: [reply], replyCount: -1, nextCursor: null },
		})
		.mockResolvedValueOnce({
			data: {
				postId: 'post-1',
				prayerRequestStatus: 'InferredAnswer',
				revision: 2,
			},
		});
	await expect(
		listCommunityReplies({ communityId: 'group', postId: 'post-1' }),
	).rejects.toThrow('Invalid community post response.');
	await expect(
		setCommunityPrayerRequestStatus({
			communityId: 'group',
			postId: 'post-1',
			prayerRequestStatus: 'Answered',
			expectedRevision: 1,
			operationId: 'operation-1',
		}),
	).rejects.toThrow('Invalid community post response.');
});
