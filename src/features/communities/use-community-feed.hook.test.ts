import type { ICommunityPost } from '@td/types/community/community-post.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	getCommunityPostReason,
	listCommunityPosts,
	listCommunityPrayerSupport,
} from './community-post.service';
import {
	mergeCommunityPostPages,
	useCommunityFeed,
} from './use-community-feed.hook';

jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		const { useEffect: useReactEffect } = jest.requireActual('react');
		useReactEffect(callback, [callback]);
	},
}));
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation-1' }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: jest.fn(),
}));
jest.mock('./community-post.service');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const post = (
	postId: string,
	seconds: number,
	postType: 'Discussion' | 'PrayerRequest' = 'Discussion',
): ICommunityPost => ({
	schemaVersion: 1,
	communityId: 'group',
	postId,
	author: { userId: 'member', displayName: 'Jordan' },
	revision: 1,
	replyCount: 0,
	createdAt: { seconds, nanoseconds: 0 },
	updatedAt: { seconds, nanoseconds: 0 },
	editedAt: null,
	publication: {
		status: 'Published',
		content:
			postType === 'PrayerRequest'
				? {
						postType,
						text: 'Please pray.',
						prayerRequestStatus: 'Current',
					}
				: { postType, text: 'Discuss this.' },
	},
});

let current: ReturnType<typeof useCommunityFeed>;
let renderer: ReactTestRenderer | null = null;
const Probe = ({ userId }: { userId: string }) => {
	const value = useCommunityFeed(userId, 'group', true);
	useEffect(() => {
		current = value;
	}, [value]);
	return null;
};

beforeEach(() => {
	jest.clearAllMocks();
	renderer = null;
	jest.mocked(getCommunityPostReason).mockReturnValue(null);
	jest.mocked(listCommunityPrayerSupport).mockResolvedValue({
		postId: 'prayer',
		supporters: [],
		supportCount: 2,
		viewerIsPraying: true,
		nextCursor: null,
	});
});
afterEach(() => {
	if (renderer) act(() => renderer?.unmount());
});

it('deduplicates pages and preserves newest-first timestamp and ID ordering', () => {
	const newest = post('b', 20);
	const sameTimeEarlierId = post('a', 20);
	const oldest = post('z', 10);
	expect(
		mergeCommunityPostPages(
			[oldest, sameTimeEarlierId],
			[newest, oldest],
		).map((item) => item.postId),
	).toEqual(['b', 'a', 'z']);
});

it('loads paginated posts without duplicates and retains prayer support counts', async () => {
	jest.mocked(listCommunityPosts)
		.mockResolvedValueOnce({
			posts: [post('new', 30), post('prayer', 20, 'PrayerRequest')],
			nextCursor: 'next',
		})
		.mockResolvedValueOnce({
			posts: [post('prayer', 20, 'PrayerRequest'), post('old', 10)],
			nextCursor: null,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	expect(current.state.status).toBe('Ready');
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.prayerSupport['prayer']).toEqual({
		supportCount: 2,
		viewerIsPraying: true,
	});
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.posts.map((item) => item.postId)).toEqual([
		'new',
		'prayer',
		'old',
	]);
	expect(listCommunityPosts).toHaveBeenLastCalledWith({
		communityId: 'group',
		pageSize: 20,
		cursor: 'next',
	});
});

it('replaces the first page on refresh so a newly submitted post appears', async () => {
	jest.mocked(listCommunityPosts)
		.mockResolvedValueOnce({ posts: [post('old', 10)], nextCursor: null })
		.mockResolvedValueOnce({
			posts: [post('created', 20), post('old', 10)],
			nextCursor: null,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	await act(async () => current.refresh());
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.posts.map((item) => item.postId)).toEqual([
		'created',
		'old',
	]);
});

it('keeps load-more failure retryable without replacing loaded posts', async () => {
	jest.mocked(listCommunityPosts)
		.mockResolvedValueOnce({ posts: [post('new', 20)], nextCursor: 'next' })
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce({ posts: [post('old', 10)], nextCursor: null });
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.loadMoreError).toBe(true);
	expect(current.state.posts.map((item) => item.postId)).toEqual(['new']);
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.posts.map((item) => item.postId)).toEqual([
		'new',
		'old',
	]);
});

it('clears loaded records after membership loss', async () => {
	jest.mocked(listCommunityPosts)
		.mockResolvedValueOnce({ posts: [post('new', 20)], nextCursor: null })
		.mockRejectedValueOnce({
			details: { reason: 'MembershipUnavailable' },
		});
	jest.mocked(getCommunityPostReason).mockReturnValueOnce(
		'MembershipUnavailable',
	);
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	await act(async () => current.refresh());
	expect(current.state).toEqual({ status: 'Unavailable' });
});

it('ignores late results after an account switch', async () => {
	let resolveFirst!: (value: {
		posts: ICommunityPost[];
		nextCursor: null;
	}) => void;
	jest.mocked(listCommunityPosts)
		.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFirst = resolve;
			}),
		)
		.mockResolvedValueOnce({
			posts: [post('other', 30)],
			nextCursor: null,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'first' }));
	});
	await act(async () => {
		renderer?.update(createElement(Probe, { userId: 'second' }));
	});
	await act(async () =>
		resolveFirst({ posts: [post('stale', 40)], nextCursor: null }),
	);
	if (current.state.status !== 'Ready') throw new Error('Feed not ready.');
	expect(current.state.posts.map((item) => item.postId)).toEqual(['other']);
});
