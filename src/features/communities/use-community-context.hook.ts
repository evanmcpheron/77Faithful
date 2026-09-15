import type { ICommunityContext } from '@td/types/community/community.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
	getCommunityContext,
	getCommunityReaderReason,
} from './community-reader.service';

export type TCommunityContextState =
	| { status: 'Loading' }
	| { status: 'Unavailable' }
	| { status: 'Error' }
	| { status: 'Ready'; context: ICommunityContext };

const unavailableReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'AccountUnavailable',
	'CommunityUnavailable',
]);

export const useCommunityContext = (
	userId: string | null,
	communityId: string | undefined,
) => {
	const [state, setState] = useState<TCommunityContextState>(
		userId && communityId
			? { status: 'Loading' }
			: { status: 'Unavailable' },
	);
	const [attempt, setAttempt] = useState(0);
	const requestGeneration = useRef(0);
	const retry = useCallback(() => {
		setAttempt((value) => value + 1);
	}, []);

	useFocusEffect(
		useCallback(() => {
			const generation = ++requestGeneration.current;
			if (!userId || !communityId) {
				setState({ status: 'Unavailable' });
				return;
			}

			setState({ status: 'Loading' });
			void getCommunityContext(communityId).then(
				(context) => {
					if (generation !== requestGeneration.current) return;
					if (
						context.community.communityId !== communityId ||
						context.membership.communityId !== communityId ||
						context.membership.userId !== userId
					) {
						setState({ status: 'Unavailable' });
						return;
					}
					setState({ status: 'Ready', context });
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
			const foreground = AppState.addEventListener(
				'change',
				(nextState) => {
					if (nextState === 'active') retry();
				},
			);

			return () => {
				foreground.remove();
				if (requestGeneration.current === generation)
					requestGeneration.current += 1;
			};
			// Retry changes intentionally rerun this focused-screen load.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId, communityId, attempt, retry]),
	);

	return { state, retry };
};
