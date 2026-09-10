import { getJourneyCalendarDate } from '@td/features/journey/journey-calendar';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getTodayPractices } from './today-practices';
import { loadToday } from './today.service';

export const useToday = () => {
	const { account, isProfileReady } = useAuth();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const [state, setState] = useState<{
		userId: string;
		data: Awaited<ReturnType<typeof loadToday>>;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const generation = useRef(0);
	const refresh = useCallback(async () => {
		const request = ++generation.current;
		setError(null);
		// Keep the mounted panel during same-day refreshes, including return from a practice.
		const today = getJourneyCalendarDate(
			new Date(),
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		);
		setState((previous) =>
			previous?.userId === userId &&
			(previous.data.status !== 'Ready' ||
				previous.data.session.day.calendarDate === today)
				? previous
				: null,
		);
		if (!userId) return;
		try {
			const data = await loadToday(userId);
			if (data.status === 'Ready') getTodayPractices(data.session);
			if (request === generation.current) setState({ userId, data });
		} catch {
			if (request === generation.current)
				setError(
					'We couldn’t load today’s practices. Check your connection and try again.',
				);
		}
	}, [userId]);
	useFocusEffect(
		useCallback(() => {
			let calendar = getJourneyCalendarDate(
				new Date(),
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			);
			void refresh();
			const subscription = AppState.addEventListener(
				'change',
				(status) => {
					if (status === 'active') void refresh();
				},
			);
			const interval = setInterval(() => {
				const today = getJourneyCalendarDate(
					new Date(),
					Intl.DateTimeFormat().resolvedOptions().timeZone,
				);
				if (today !== calendar) {
					calendar = today;
					void refresh();
				}
			}, 1000);
			return () => {
				generation.current++;
				subscription.remove();
				clearInterval(interval);
			};
		}, [refresh]),
	);
	const data = state?.userId === userId ? state?.data : null;
	const session = data?.status === 'Ready' ? data.session : null;
	const practices = session ? getTodayPractices(session) : [];
	return { data, session, practices, error, refresh };
};
