import { useAuth } from '@td/providers/auth/auth.hook';
import type { IPracticeCompletion } from '@td/types/journey/journey-day.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { IJourneyDaySession } from './journey-day-session.types';
import type { parsePracticeRoute } from './journey-practice-route';
import {
	loadPracticeDay,
	savePracticeCompletion,
} from './journey-practice.service';
import { getJourneyPractices } from './journey-practices';

export const useJourneyPractice = (
	route: ReturnType<typeof parsePracticeRoute>,
) => {
	const { account, isProfileReady } = useAuth();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const journeyId = route?.journeyId;
	const dayNumber = route?.dayNumber;
	const practiceId = route?.practiceId;
	const key = JSON.stringify([userId, journeyId, dayNumber, practiceId]);
	const [state, setState] = useState<{
		key: string;
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
	const refresh = useCallback(async () => {
		const request = ++generation.current;
		setError(null);
		setLoading(true);
		if (!userId || !journeyId || !dayNumber || !practiceId) {
			setLoading(false);
			return;
		}
		try {
			const session = await loadPracticeDay(userId, journeyId, dayNumber);
			if (
				!getJourneyPractices(session).some(
					(practice) => practice.id === practiceId,
				)
			)
				throw new Error('Practice not assigned.');
			if (request === generation.current) {
				setState({ key, session });
				setSaved(null);
			}
		} catch {
			if (request === generation.current)
				setError(
					'We couldn’t load this practice. Check your connection and try again.',
				);
		} finally {
			if (request === generation.current) setLoading(false);
		}
	}, [userId, journeyId, dayNumber, practiceId, key]);
	useFocusEffect(
		useCallback(() => {
			void refresh();
			return () => {
				generation.current++;
			};
		}, [refresh]),
	);
	const session = state?.key === key ? state.session : null;
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
				result.practiceId !== practice.id
			)
				throw new Error('Unexpected completion.');
			if (request === generation.current)
				setSaved({ key, completion: result.completion });
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
		loading,
		isSaving,
		error,
		refresh,
		complete,
	};
};
