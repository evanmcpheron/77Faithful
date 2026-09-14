import { getJourneyCalendarDate } from '@td/features/journey/journey-calendar';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getDaySessionRevision } from '../journey/journey-day-cache';
import { useDaySessionContext } from '../journey/use-day-session-context.hook';
import { getTodayPractices } from './today-practices';
import { getCachedToday, loadToday } from './today.service';

export const useToday = () => {
	const { account, isProfileReady } = useAuth();
	const context = useDaySessionContext();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const [state, setState] = useState<{
		userId: string;
		context: string;
		revision: number;
		data: Awaited<ReturnType<typeof loadToday>>;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const generation = useRef(0);
	const refresh = useCallback(
		async (force = true) => {
			const request = ++generation.current;
			setError(null);
			// Keep the mounted panel during same-day refreshes, including return from a practice.
			const today = getJourneyCalendarDate(
				new Date(),
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			);
			setState((previous) =>
				previous?.userId === userId &&
				previous.context === context &&
				(previous.data.status !== 'Ready' ||
					previous.data.session.day.calendarDate === today)
					? previous
					: null,
			);
			if (!userId) return;
			try {
				const data = await loadToday(userId, new Date(), force);
				if (data.status === 'Ready') getTodayPractices(data.session);
				if (request === generation.current)
					setState({
						userId,
						context,
						revision: getDaySessionRevision(),
						data,
					});
			} catch {
				if (request === generation.current) {
					setState(null);
					setError(
						'We couldn’t load today’s practices. Check your connection and try again.',
					);
				}
			}
		},
		[userId, context],
	);
	useFocusEffect(
		useCallback(() => {
			void refresh(false);
			const subscription = AppState.addEventListener(
				'change',
				(status) => {
					if (status === 'active') void refresh(false);
				},
			);
			return () => {
				generation.current++;
				subscription.remove();
			};
		}, [refresh]),
	);
	const data =
		(userId ? getCachedToday(userId) : null) ??
		(state?.userId === userId &&
		state.context === context &&
		(state.data.status !== 'Ready' ||
			state.revision === getDaySessionRevision())
			? state.data
			: null);
	const session = data?.status === 'Ready' ? data.session : null;
	const practices = session ? getTodayPractices(session) : [];
	return { data, session, practices, error, refresh };
};
