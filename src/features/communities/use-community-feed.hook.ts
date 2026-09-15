import type { ICommunityPost } from '@td/types/community/community-post.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	getCommunityPostReason,
	listCommunityPosts,
	listCommunityPrayerSupport,
} from './community-post.service';

const pageSize = 20;
const unavailableReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'MembershipUnavailable',
]);

export interface ICommunityPrayerSupportSummary {
	supportCount: number;
	viewerIsPraying: boolean;
}

export type TCommunityFeedState =
	| { status: 'Idle' | 'Loading' | 'Unavailable' | 'Error' }
	| {
			status: 'Ready';
			posts: ICommunityPost[];
			nextCursor: string | null;
			prayerSupport: Record<
				string,
				ICommunityPrayerSupportSummary | undefined
			>;
			isRefreshing: boolean;
			refreshError: boolean;
			isLoadingMore: boolean;
			loadMoreError: boolean;
	  };

const comparePosts = (left: ICommunityPost, right: ICommunityPost): number => {
	if (left.createdAt.seconds !== right.createdAt.seconds)
		return right.createdAt.seconds - left.createdAt.seconds;
	if (left.createdAt.nanoseconds !== right.createdAt.nanoseconds)
		return right.createdAt.nanoseconds - left.createdAt.nanoseconds;
	return right.postId.localeCompare(left.postId);
};

export const mergeCommunityPostPages = (
	current: ICommunityPost[],
	incoming: ICommunityPost[],
): ICommunityPost[] => {
	const posts = new Map(current.map((post) => [post.postId, post]));
	for (const post of incoming) posts.set(post.postId, post);
	return [...posts.values()].sort(comparePosts);
};

const validatesPage = (posts: ICommunityPost[], communityId: string): boolean =>
	posts.every((post) => post.communityId === communityId);

const loadPrayerSupport = async (
	communityId: string,
	posts: ICommunityPost[],
): Promise<{
	summaries: Record<string, ICommunityPrayerSupportSummary>;
	permissionLost: boolean;
}> => {
	const prayerPosts = posts.filter(
		(post) =>
			post.publication.status === 'Published' &&
			post.publication.content.postType === 'PrayerRequest',
	);
	const settled = await Promise.allSettled(
		prayerPosts.map(async (post) => {
			const result = await listCommunityPrayerSupport({
				communityId,
				postId: post.postId,
				pageSize: 1,
			});
			if (result.postId !== post.postId)
				throw new Error(
					'Unexpected community prayer support response.',
				);
			return {
				postId: post.postId,
				summary: {
					supportCount: result.supportCount,
					viewerIsPraying: result.viewerIsPraying,
				},
			};
		}),
	);
	const summaries: Record<string, ICommunityPrayerSupportSummary> = {};
	let permissionLost = false;
	settled.forEach((result) => {
		if (result.status === 'fulfilled') {
			summaries[result.value.postId] = result.value.summary;
			return;
		}
		const reason = getCommunityPostReason(result.reason);
		if (reason && unavailableReasons.has(reason)) permissionLost = true;
	});
	return { summaries, permissionLost };
};

export const useCommunityFeed = (
	userId: string | null,
	communityId: string | undefined,
	canRead: boolean,
) => {
	const [state, setState] = useState<TCommunityFeedState>({
		status: canRead ? 'Loading' : 'Idle',
	});
	const requestGeneration = useRef(0);
	const refreshing = useRef(false);
	const loadingMore = useRef(false);

	useFocusEffect(
		useCallback(() => {
			const generation = ++requestGeneration.current;
			refreshing.current = false;
			loadingMore.current = false;
			if (!userId || !communityId || !canRead) {
				setState({ status: 'Idle' });
				return;
			}
			setState({ status: 'Loading' });
			void listCommunityPosts({ communityId, pageSize }).then(
				async (result) => {
					if (generation !== requestGeneration.current) return;
					if (!validatesPage(result.posts, communityId)) {
						setState({ status: 'Unavailable' });
						return;
					}
					const support = await loadPrayerSupport(
						communityId,
						result.posts,
					);
					if (generation !== requestGeneration.current) return;
					if (support.permissionLost) {
						setState({ status: 'Unavailable' });
						return;
					}
					setState({
						status: 'Ready',
						posts: mergeCommunityPostPages([], result.posts),
						nextCursor: result.nextCursor,
						prayerSupport: support.summaries,
						isRefreshing: false,
						refreshError: false,
						isLoadingMore: false,
						loadMoreError: false,
					});
				},
				(error: unknown) => {
					if (generation !== requestGeneration.current) return;
					const reason = getCommunityPostReason(error);
					setState({
						status:
							reason && unavailableReasons.has(reason)
								? 'Unavailable'
								: 'Error',
					});
				},
			);
			return () => {
				requestGeneration.current += 1;
				refreshing.current = false;
				loadingMore.current = false;
			};
		}, [userId, communityId, canRead]),
	);

	const refresh = useCallback(async () => {
		if (!userId || !communityId || !canRead || refreshing.current) return;
		refreshing.current = true;
		loadingMore.current = false;
		const generation = ++requestGeneration.current;
		setState((current) =>
			current.status === 'Ready'
				? { ...current, isRefreshing: true, refreshError: false }
				: { status: 'Loading' },
		);
		try {
			const result = await listCommunityPosts({ communityId, pageSize });
			if (generation !== requestGeneration.current) return;
			if (!validatesPage(result.posts, communityId)) {
				setState({ status: 'Unavailable' });
				return;
			}
			const support = await loadPrayerSupport(communityId, result.posts);
			if (generation !== requestGeneration.current) return;
			if (support.permissionLost) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({
				status: 'Ready',
				posts: mergeCommunityPostPages([], result.posts),
				nextCursor: result.nextCursor,
				prayerSupport: support.summaries,
				isRefreshing: false,
				refreshError: false,
				isLoadingMore: false,
				loadMoreError: false,
			});
		} catch (error: unknown) {
			if (generation !== requestGeneration.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState((current) =>
				current.status === 'Ready'
					? { ...current, isRefreshing: false, refreshError: true }
					: { status: 'Error' },
			);
		} finally {
			if (generation === requestGeneration.current)
				refreshing.current = false;
		}
	}, [userId, communityId, canRead]);

	const loadMore = useCallback(async () => {
		if (
			!userId ||
			!communityId ||
			!canRead ||
			state.status !== 'Ready' ||
			refreshing.current ||
			loadingMore.current
		)
			return;
		const cursor = state.nextCursor;
		if (!cursor) return;
		loadingMore.current = true;
		const generation = requestGeneration.current;
		const current = state;
		setState({ ...current, isLoadingMore: true, loadMoreError: false });
		try {
			const result = await listCommunityPosts({
				communityId,
				pageSize,
				cursor,
			});
			if (generation !== requestGeneration.current) return;
			if (!validatesPage(result.posts, communityId)) {
				setState({ status: 'Unavailable' });
				return;
			}
			const support = await loadPrayerSupport(communityId, result.posts);
			if (generation !== requestGeneration.current) return;
			if (support.permissionLost) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({
				...current,
				posts: mergeCommunityPostPages(current.posts, result.posts),
				nextCursor: result.nextCursor,
				prayerSupport: {
					...current.prayerSupport,
					...support.summaries,
				},
				isLoadingMore: false,
				loadMoreError: false,
			});
		} catch (error: unknown) {
			if (generation !== requestGeneration.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({ ...current, isLoadingMore: false, loadMoreError: true });
		} finally {
			if (generation === requestGeneration.current)
				loadingMore.current = false;
		}
	}, [userId, communityId, canRead, state]);

	return { state, refresh, loadMore };
};
