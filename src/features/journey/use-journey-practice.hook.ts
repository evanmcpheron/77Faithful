import { useAuth } from '@td/providers/auth/auth.hook';
import type { IPracticeCompletion } from '@td/types/journey/journey-day.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
	getCachedDaySession,
	getDaySessionRevision,
} from './journey-day-cache';
import type { IJourneyDaySession } from './journey-day-session.types';
import type { parsePracticeRoute } from './journey-practice-route';
import {
	loadPracticeDay,
	savePracticeCompletion,
} from './journey-practice.service';
import { getJourneyPractices } from './journey-practices';
import { useDaySessionContext } from './use-day-session-context.hook';

export const useJourneyPractice = (
	route: ReturnType<typeof parsePracticeRoute>,
) => {
	const { account, isProfileReady } = useAuth();
	const router = useRouter();
	const context = useDaySessionContext();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const journeyId = route?.journeyId;
	const dayNumber = route?.dayNumber;
	const practiceId = route?.practiceId;
	const key = JSON.stringify([
		userId,
		journeyId,
		dayNumber,
		practiceId,
		context,
	]);
	const [state, setState] = useState<{
		key: string;
		revision: number;
		session: IJourneyDaySession;
	} | null>(null);
	const [saved, setSaved] = useState<{
		key: string;
		completion: IPracticeCompletion;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const generation = useRef(0);
	const saving = useRef(false);
	const refresh = useCallback(
		async (force = true) => {
			const request = ++generation.current;
			setError(null);
			setLoading(true);
			if (!userId || !journeyId || !dayNumber || !practiceId) {
				setLoading(false);
				return;
			}
			try {
				const session = await loadPracticeDay(
					userId,
					journeyId,
					dayNumber,
					force,
				);
				if (
					!getJourneyPractices(session).some(
						(practice) => practice.id === practiceId,
					)
				)
					throw new Error('Practice not assigned.');
				if (request === generation.current) {
					setState({
						key,
						revision: getDaySessionRevision(),
						session,
					});
					setSaved(null);
				}
			} catch {
				if (request === generation.current) {
					setState(null);
					setError(
						'We couldn’t load this practice. Check your connection and try again.',
					);
				}
			} finally {
				if (request === generation.current) setLoading(false);
			}
		},
		[userId, journeyId, dayNumber, practiceId, key],
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
	const cached =
		userId && journeyId && dayNumber
			? getCachedDaySession(userId, {
					journeyId,
					dayNumber,
					observedPhoneTimeZoneId:
						Intl.DateTimeFormat().resolvedOptions().timeZone,
				})
			: null;
	const candidate =
		cached ??
		(state?.key === key && state.revision === getDaySessionRevision()
			? state.session
			: null);
	const session =
		candidate &&
		getJourneyPractices(candidate).some(
			(practice) => practice.id === practiceId,
		)
			? candidate
			: null;
	const practice = session
		? getJourneyPractices(session).find((item) => item.id === practiceId)
		: undefined;
	const completion =
		saved?.key === key ? saved.completion : practice?.completion;
	const complete = async () => {
		if (
			!session ||
			!practice ||
			!completion ||
			completion.status === PracticeCompletionStatus.Complete ||
			saving.current ||
			loading ||
			error
		)
			return;
		saving.current = true;
		setIsSaving(true);
		const request = generation.current;
		try {
			const result = await savePracticeCompletion({
				journeyId: session.day.journeyId,
				dayNumber: session.day.dayNumber,
				practiceId: practice.id,
				isComplete: true,
				expectedCompletionRevision: completion.revision,
			});
			if (
				result.journeyId !== session.day.journeyId ||
				result.dayNumber !== session.day.dayNumber ||
				result.practiceId !== practice.id ||
				result.completion.status !== PracticeCompletionStatus.Complete
			)
				throw new Error('Unexpected completion.');
			if (request === generation.current) {
				setSaved({ key, completion: result.completion });
				router.navigate('/today');
			}
		} catch {
			if (request === generation.current)
				setError(
					'We couldn’t confirm completion. Refresh this practice before trying again.',
				);
		} finally {
			saving.current = false;
			setIsSaving(false);
		}
	};
	return {
		session,
		practice,
		completion,
		loading: loading && !session,
		isSaving,
		error,
		refresh,
		complete,
	};
};
