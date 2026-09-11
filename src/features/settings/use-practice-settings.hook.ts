import { getJourneyCalendarDate } from '@td/features/journey/journey-calendar';
import { useAuth } from '@td/providers/auth/auth.hook';
import type { TOptionalPracticeSelection } from '@td/types/formation/practice.types';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
	cancelPracticeSettings,
	confirmPracticeSettings,
	loadPracticeSettings,
} from './practice-settings.service';
import type {
	ICancelPracticeSettingsRequest,
	IConfirmPracticeSettingsRequest,
	TPracticeSettingsResult,
} from './practice-settings.types';

type TChange =
	| { kind: 'Confirm'; request: IConfirmPracticeSettingsRequest }
	| { kind: 'Cancel'; request: ICancelPracticeSettingsRequest };
const phoneZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const usePracticeSettings = () => {
	const { account, isProfileReady } = useAuth();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const [state, setState] = useState<{
		userId: string;
		data: TPracticeSettingsResult;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mutationError, setMutationError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [needsReview, setNeedsReview] = useState(false);
	const [hasUnconfirmedChange, setHasUnconfirmedChange] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [reviewVersion, setReviewVersion] = useState(0);
	const generation = useRef(0);
	const pending = useRef<{ userId: string; change: TChange } | null>(null);
	const saving = useRef(false);
	const mutationGeneration = useRef(0);
	const activeUser = useRef<string | null>(null);
	useEffect(
		() => () => {
			activeUser.current = null;
			mutationGeneration.current++;
		},
		[],
	);
	const refresh = useCallback(async () => {
		if (saving.current) return;
		const request = ++generation.current;
		setError(null);
		if (!userId) {
			setState(null);
			return;
		}
		try {
			const data = await loadPracticeSettings(phoneZone());
			if (request !== generation.current || activeUser.current !== userId)
				return;
			setState({ userId, data });
			// An ambiguous request must be retried with its original operation ID.
			if (!pending.current) {
				setNeedsReview(false);
				setMutationError(null);
				setReviewVersion((version) => version + 1);
			}
		} catch {
			if (request === generation.current && activeUser.current === userId)
				setError(
					'We couldn’t load your practices. Check your connection and try again.',
				);
		}
	}, [userId]);
	useFocusEffect(
		useCallback(() => {
			if (activeUser.current !== userId) {
				activeUser.current = userId;
				mutationGeneration.current++;
				saving.current = false;
				pending.current = null;
				setError(null);
				setMutationError(null);
				setNotice(null);
				setNeedsReview(false);
				setHasUnconfirmedChange(false);
				setIsSaving(false);
			}
			let calendar = `${phoneZone()}:${getJourneyCalendarDate(new Date(), phoneZone())}`;
			void refresh();
			const subscription = AppState.addEventListener(
				'change',
				(status) => {
					if (status === 'active') void refresh();
				},
			);
			const timer = setInterval(() => {
				const next = `${phoneZone()}:${getJourneyCalendarDate(new Date(), phoneZone())}`;
				if (next !== calendar) {
					calendar = next;
					void refresh();
				}
			}, 1000);
			return () => {
				generation.current++;
				subscription.remove();
				clearInterval(timer);
			};
		}, [refresh, userId]),
	);
	const data = state?.userId === userId ? state.data : null;
	const submit = async (change: TChange) => {
		if (!userId || saving.current) return false;
		const mutation = ++mutationGeneration.current;
		saving.current = true;
		setIsSaving(true);
		setMutationError(null);
		setNotice(null);
		generation.current++;
		pending.current = { userId, change };
		let confirmed = false;
		try {
			const selection =
				change.kind === 'Confirm'
					? await confirmPracticeSettings(change.request)
					: await cancelPracticeSettings(change.request);
			if (
				activeUser.current !== userId ||
				mutation !== mutationGeneration.current
			)
				return false;
			setState((previous) =>
				previous?.userId === userId &&
				previous.data.status === 'Ready' &&
				previous.data.selection.journeyId === selection.journeyId
					? { userId, data: { ...previous.data, selection } }
					: previous,
			);
			pending.current = null;
			setHasUnconfirmedChange(false);
			setNeedsReview(false);
			confirmed = true;
			setNotice(
				change.kind === 'Confirm'
					? 'Your practice change is confirmed.'
					: 'Your pending practice change is canceled.',
			);
			return true;
		} catch (failure) {
			if (
				activeUser.current !== userId ||
				mutation !== mutationGeneration.current
			)
				return false;
			const code =
				failure && typeof failure === 'object' && 'code' in failure
					? failure.code
					: null;
			const rejected = [
				'functions/failed-precondition',
				'functions/invalid-argument',
				'functions/permission-denied',
				'functions/unauthenticated',
				'functions/not-found',
				'functions/already-exists',
			].includes(String(code));
			if (rejected) pending.current = null;
			setNeedsReview(rejected);
			setHasUnconfirmedChange(!rejected);
			setMutationError(
				rejected
					? 'We couldn’t confirm this change. Reload Practices to review your current journey and choices.'
					: 'We couldn’t confirm the result yet. Check your connection and retry this change.',
			);
			return false;
		} finally {
			if (
				activeUser.current === userId &&
				mutation === mutationGeneration.current
			) {
				saving.current = false;
				setIsSaving(false);
				if (confirmed) void refresh();
			}
		}
	};
	const confirm = async (optionalPracticeIds: TOptionalPracticeSelection) => {
		if (
			data?.status !== 'Ready' ||
			!data.nextDay ||
			pending.current ||
			needsReview ||
			error
		)
			return false;
		return submit({
			kind: 'Confirm',
			request: {
				operationId: randomUUID(),
				journeyId: data.selection.journeyId,
				expectedScheduleRevision: data.selection.scheduleRevision,
				optionalPracticeIds,
				observedPhoneTimeZoneId: phoneZone(),
				reviewedEffectiveDayNumber: data.nextDay.dayNumber,
				reviewedEffectiveDate: data.nextDay.calendarDate,
			},
		});
	};
	const cancel = async () => {
		if (
			data?.status !== 'Ready' ||
			!data.selection.pendingChange ||
			pending.current ||
			needsReview ||
			error
		)
			return false;
		return submit({
			kind: 'Cancel',
			request: {
				operationId: randomUUID(),
				journeyId: data.selection.journeyId,
				practiceChangeId: data.selection.pendingChange.practiceChangeId,
				expectedScheduleRevision: data.selection.scheduleRevision,
				observedPhoneTimeZoneId: phoneZone(),
			},
		});
	};
	const retry = async () =>
		pending.current?.userId === userId
			? submit(pending.current.change)
			: false;
	return {
		data,
		error,
		mutationError,
		isSaving,
		needsReview,
		hasUnconfirmedChange,
		notice,
		reviewVersion,
		refresh,
		confirm,
		cancel,
		retry,
	};
};
