import { useAuth } from '@td/providers/auth/auth.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { hasCommunitySafetyReviewerCapability } from './community-safety-review.service';

export type TSafetyReviewAccess = 'Loading' | 'Allowed' | 'Denied' | 'Error';

export const useCommunitySafetyReviewAccess = () => {
	const { account, isInitializing } = useAuth();
	const userId = account?.userId ?? null;
	const [accessState, setAccessState] = useState<{
		userId: string | null;
		status: TSafetyReviewAccess;
	}>({ userId: null, status: 'Loading' });
	const generation = useRef(0);
	const check = useCallback(async () => {
		const currentGeneration = ++generation.current;
		setAccessState({ userId, status: 'Loading' });
		if (!userId || !account?.isEmailConfirmed) {
			setAccessState({ userId, status: 'Denied' });
			return;
		}
		try {
			const allowed = await hasCommunitySafetyReviewerCapability(userId);
			if (generation.current === currentGeneration)
				setAccessState({
					userId,
					status: allowed ? 'Allowed' : 'Denied',
				});
		} catch {
			if (generation.current === currentGeneration)
				setAccessState({ userId, status: 'Error' });
		}
	}, [userId, account?.isEmailConfirmed]);
	useFocusEffect(
		useCallback(() => {
			void check();
			const subscription = AppState.addEventListener(
				'change',
				(state) => {
					if (state === 'active') void check();
				},
			);
			return () => {
				generation.current += 1;
				subscription.remove();
			};
		}, [check]),
	);
	return {
		status:
			isInitializing || accessState.userId !== userId
				? ('Loading' as const)
				: accessState.status,
		retry: check,
	};
};
