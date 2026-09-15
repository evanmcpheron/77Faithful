import type { ICommunityMemberSummary } from '@td/types/community/community-membership.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	getCommunityReaderReason,
	listCommunityMembers,
} from './community-reader.service';

const pageSize = 20;
const unavailableReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'AccountUnavailable',
	'CommunityUnavailable',
]);

export type TCommunityMembersState =
	| { status: 'Idle' | 'Loading' | 'Unavailable' | 'Error' }
	| {
			status: 'Ready';
			members: ICommunityMemberSummary[];
			nextCursor: string | null;
			isLoadingMore: boolean;
			loadMoreError: boolean;
	  };

export const useCommunityMembers = (
	userId: string | null,
	communityId: string | undefined,
	canReadMembers: boolean,
) => {
	const [state, setState] = useState<TCommunityMembersState>({
		status: canReadMembers ? 'Loading' : 'Idle',
	});
	const [attempt, setAttempt] = useState(0);
	const requestGeneration = useRef(0);
	const loadingMore = useRef(false);

	useFocusEffect(
		useCallback(() => {
			const generation = ++requestGeneration.current;
			loadingMore.current = false;
			if (!userId || !communityId || !canReadMembers) {
				setState({ status: 'Idle' });
				return;
			}

			setState({ status: 'Loading' });
			void listCommunityMembers({ communityId, pageSize }).then(
				(result) => {
					if (generation !== requestGeneration.current) return;
					if (
						result.members.some(
							(member) => member.communityId !== communityId,
						)
					) {
						setState({ status: 'Unavailable' });
						return;
					}
					setState({
						status: 'Ready',
						members: result.members,
						nextCursor: result.nextCursor,
						isLoadingMore: false,
						loadMoreError: false,
					});
				},
				(error: unknown) => {
					if (generation !== requestGeneration.current) return;
					const reason = getCommunityReaderReason(error);
					setState({
						status:
							reason && unavailableReasons.has(reason)
								? 'Unavailable'
								: 'Error',
					});
				},
			);

			return () => {
				if (requestGeneration.current === generation)
					requestGeneration.current += 1;
			};
			// Retry changes intentionally rerun this focused-screen load.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId, communityId, canReadMembers, attempt]),
	);

	const refresh = useCallback(() => {
		setAttempt((value) => value + 1);
	}, []);

	const loadMore = useCallback(async () => {
		if (
			!userId ||
			!communityId ||
			!canReadMembers ||
			state.status !== 'Ready' ||
			!state.nextCursor ||
			loadingMore.current
		)
			return;
		loadingMore.current = true;
		const generation = requestGeneration.current;
		const cursor = state.nextCursor;
		setState({ ...state, isLoadingMore: true, loadMoreError: false });
		try {
			const result = await listCommunityMembers({
				communityId,
				pageSize,
				cursor,
			});
			if (generation !== requestGeneration.current) return;
			if (
				result.members.some(
					(member) => member.communityId !== communityId,
				)
			) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({
				status: 'Ready',
				members: [
					...state.members,
					...result.members.filter(
						(member) =>
							!state.members.some(
								(current) => current.userId === member.userId,
							),
					),
				],
				nextCursor: result.nextCursor,
				isLoadingMore: false,
				loadMoreError: false,
			});
		} catch (error: unknown) {
			if (generation !== requestGeneration.current) return;
			const reason = getCommunityReaderReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({ ...state, isLoadingMore: false, loadMoreError: true });
		} finally {
			if (generation === requestGeneration.current)
				loadingMore.current = false;
		}
	}, [userId, communityId, canReadMembers, state]);

	return { state, refresh, loadMore };
};
