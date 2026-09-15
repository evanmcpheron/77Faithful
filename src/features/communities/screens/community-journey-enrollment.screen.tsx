import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { getDeviceId } from '@td/features/account/device-id.service';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { getSetupChoices } from '@td/features/journey-setup/journey-setup-validation';
import {
	loadJourneySetup,
	saveJourneySetupChoicesOnly,
	type IJourneySetupSnapshot,
} from '@td/features/journey-setup/journey-setup.service';
import { SetupCheckboxChoice } from '@td/features/journey-setup/setup-checkbox-choice.component';
import { SetupPracticeChoice } from '@td/features/journey-setup/setup-practice-choice.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { IJourneySetupDraftDocument } from '@td/types/account/journey-setup.types';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import {
	BibleVersion,
	type TBibleVersionId,
} from '@td/types/formation/bible-version.types';
import type { TOptionalPracticeId } from '@td/types/formation/practice.types';
import { OptionalPracticeId } from '@td/types/formation/practice.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { parseCommunityTimeZoneId } from '../community-journey';
import {
	communityJourneyDetailOperationId,
	communityJourneyDetailReason,
	getOwnCommunityJourneyEnrollment,
} from '../community-journey-detail.service';
import { enrollInCommunityJourney } from '../community-journey-enrollment.service';
import { getCommunityJourneySchedule } from '../community-journey-schedule.service';
import { useCommunityContext } from '../use-community-context.hook';

const checkedDraft = (
	draft: IJourneySetupDraftDocument | null,
	userId: string,
) => {
	if (!draft) return null;
	if (
		draft.userId !== userId ||
		!Number.isSafeInteger(draft.revision) ||
		draft.revision < 0 ||
		!Array.isArray(draft.choices?.optionalPracticeIds) ||
		!draft.choices.optionalPracticeIds.every((value) =>
			Object.values(OptionalPracticeId).includes(value),
		) ||
		(draft.choices.bibleVersionId !== null &&
			!Object.values(BibleVersion).some(
				(version) =>
					version.bibleVersionId === draft.choices.bibleVersionId,
			))
	)
		throw new Error('Saved setup is unavailable.');
	const choices = getSetupChoices(
		draft.choices.optionalPracticeIds,
		draft.choices.bibleVersionId,
	);
	if (choices.readiness !== draft.choices.readiness)
		throw new Error('Saved setup is unavailable.');
	return draft;
};
export const enrollmentBlocker = (
	schedule: ICommunityJourneyPreview | null,
	draft: IJourneySetupDraftDocument | null,
	activeJourney: boolean,
): string | null => {
	if (!schedule)
		return 'This schedule is unavailable. Return to the community journey.';
	if (schedule.status === 'Canceled')
		return 'This schedule was canceled. Return to the community journey.';
	if (schedule.status !== 'Scheduled' || !schedule.canEnroll)
		return 'Enrollment is closed. Return to the community journey.';
	if (activeJourney)
		return 'You already have an active personal journey. Enrollment will not end or replace it.';
	if (!draft)
		return 'Choose your private practices and Bible translation before enrolling.';
	if (draft.choices.readiness !== 'ReadyForReview')
		return 'Complete your private practice and Bible translation choices before enrolling.';
	return null;
};

export const CommunityJourneyEnrollmentScreen = () => {
	const { communityId, communityJourneyId } = useLocalSearchParams<{
		communityId?: string;
		communityJourneyId?: string;
	}>();
	const { account } = useAuth();
	return (
		<EnrollmentReview
			key={`${account?.userId ?? 'signed-out'}:${communityId ?? 'missing'}:${communityJourneyId ?? 'missing'}`}
			userId={account?.userId ?? null}
			communityId={communityId}
			communityJourneyId={communityJourneyId}
		/>
	);
};

const EnrollmentReview = ({
	userId,
	communityId,
	communityJourneyId,
}: {
	userId: string | null;
	communityId: string | undefined;
	communityJourneyId: string | undefined;
}) => {
	const router = useRouter();
	const {
		activeJourney,
		hasError: journeyError,
		retry: retryJourney,
	} = useJourneyAccess();
	const { state: context, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [schedule, setSchedule] = useState<ICommunityJourneyPreview | null>(
		null,
	);
	const [snapshot, setSnapshot] = useState<IJourneySetupSnapshot | null>(
		null,
	);
	const [deviceId, setDeviceId] = useState<string | null>(null);
	const [zone, setZone] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [block, setBlock] = useState<string | null>(null);
	const [consent, setConsent] = useState(false);
	const [editing, setEditing] = useState(false);
	const [practices, setPractices] = useState<readonly TOptionalPracticeId[]>(
		[],
	);
	const [translation, setTranslation] = useState<TBibleVersionId | null>(
		null,
	);
	const focused = useRef(false);
	const serial = useRef(0);
	const submitting = useRef(false);
	const pending = useRef<{
		request: Parameters<typeof enrollInCommunityJourney>[0];
	} | null>(null);
	const ready =
		context.status === 'Ready' &&
		context.context.membership.userId === userId &&
		context.context.community.status === 'Active' &&
		context.context.membership.role === 'Member';
	const detail = useCallback(
		() =>
			communityId && communityJourneyId
				? router.replace({
						pathname:
							'/communities/[communityId]/journeys/[communityJourneyId]',
						params: { communityId, communityJourneyId },
					})
				: router.replace('/communities'),
		[communityId, communityJourneyId, router],
	);
	const load = useCallback(async () => {
		if (!userId || !communityId || !communityJourneyId || !ready) return;
		const current = ++serial.current;
		setLoading(true);
		setError(null);
		try {
			const localDeviceId = await getDeviceId();
			const [scheduleResult, setupResult, own] = await Promise.all([
				getCommunityJourneySchedule(communityId),
				loadJourneySetup(userId, localDeviceId),
				getOwnCommunityJourneyEnrollment(
					communityId,
					communityJourneyId,
				),
			]);
			if (!focused.current || serial.current !== current) return;
			if (own.enrollment) {
				detail();
				return;
			}
			const currentSchedule =
				scheduleResult.communityJourney?.communityJourneyId ===
				communityJourneyId
					? scheduleResult.communityJourney
					: null;
			const draft = checkedDraft(setupResult.draft, userId);
			const startingZone = parseCommunityTimeZoneId(
				Intl.DateTimeFormat().resolvedOptions().timeZone,
			);
			setDeviceId(localDeviceId);
			setZone(startingZone);
			setSchedule(currentSchedule);
			setSnapshot({ ...setupResult, draft });
			setPractices(draft?.choices.optionalPracticeIds ?? []);
			setTranslation(draft?.choices.bibleVersionId ?? null);
			setBlock(null);
			setConsent(false);
			setEditing(false);
		} catch {
			if (focused.current && serial.current === current)
				setError(
					'We could not load your private review. Check your connection or account access and try again.',
				);
		} finally {
			if (focused.current && serial.current === current)
				setLoading(false);
		}
	}, [userId, communityId, communityJourneyId, ready, detail]);
	useFocusEffect(
		useCallback(() => {
			focused.current = true;
			void load();
			return () => {
				focused.current = false;
				serial.current++;
			};
		}, [load]),
	);
	const saveChoices = async () => {
		if (!snapshot || !deviceId || !userId || busy) return;
		let choices;
		try {
			choices = getSetupChoices(practices, translation);
		} catch (cause) {
			setBlock(
				cause instanceof Error ? cause.message : 'Review your choices.',
			);
			return;
		}
		setBusy(true);
		setBlock(null);
		try {
			await saveJourneySetupChoicesOnly({
				userId,
				expectedRevision: snapshot.draft?.revision ?? null,
				choices,
			});
			if (!focused.current) return;
			setConsent(false);
			setEditing(false);
			pending.current = null;
			await load();
		} catch {
			if (focused.current)
				setBlock(
					'Your setup changed or could not be saved. Reload your saved choices before continuing.',
				);
		} finally {
			if (focused.current) setBusy(false);
		}
	};
	const submit = async () => {
		if (
			submitting.current ||
			!consent ||
			!ready ||
			!communityId ||
			!communityJourneyId ||
			!zone ||
			!snapshot?.draft ||
			!schedule ||
			activeJourney !== null ||
			journeyError ||
			!focused.current
		)
			return;
		const blocker = enrollmentBlocker(schedule, snapshot.draft, false);
		if (blocker) {
			setBlock(blocker);
			return;
		}
		submitting.current = true;
		setBusy(true);
		setBlock(null);
		const current = serial.current;
		try {
			const [freshSchedule, freshSetup] = await Promise.all([
				getCommunityJourneySchedule(communityId),
				loadJourneySetup(userId!, deviceId!),
			]);
			if (!focused.current || serial.current !== current) return;
			const freshDraft = checkedDraft(freshSetup.draft, userId!);
			if (
				!freshSchedule.communityJourney ||
				freshSchedule.communityJourney.communityJourneyId !==
					communityJourneyId ||
				freshSchedule.communityJourney.revision !== schedule.revision ||
				freshSchedule.communityJourney.startDate !==
					schedule.startDate ||
				freshSchedule.communityJourney.timeZoneId !==
					schedule.timeZoneId
			) {
				setBlock(
					'The community schedule changed. Return to the journey and review its new date and zone.',
				);
				pending.current = null;
				return;
			}
			if (freshDraft?.revision !== snapshot.draft.revision) {
				setBlock(
					'Your private setup changed. Reload your choices before confirming.',
				);
				pending.current = null;
				return;
			}
			const freshBlocker = enrollmentBlocker(
				freshSchedule.communityJourney,
				freshDraft,
				activeJourney != null,
			);
			if (freshBlocker) {
				setBlock(freshBlocker);
				pending.current = null;
				return;
			}
			const request = pending.current?.request ?? {
				communityId,
				communityJourneyId,
				expectedCommunityJourneyRevision: schedule.revision,
				setupDraftId: 'current' as const,
				expectedSetupRevision: snapshot.draft.revision,
				startingTimeZoneId: zone,
				consentToScheduledActivation: true as const,
				operationId: communityJourneyDetailOperationId(),
			};
			pending.current = { request };
			const result = await enrollInCommunityJourney(request);
			if (!focused.current || serial.current !== current) return;
			if (
				result.communityJourneyEnrollmentId !== communityJourneyId ||
				result.communityJourney.communityJourneyId !==
					communityJourneyId ||
				result.startingTimeZoneId !== zone
			)
				throw new Error('Unexpected enrollment confirmation.');
			pending.current = null;
			detail();
		} catch (cause) {
			if (!focused.current || serial.current !== current) return;
			const reason = communityJourneyDetailReason(cause);
			if (reason) pending.current = null;
			setBlock(
				reason === 'ContentUnavailable'
					? 'The scheduled course or selected Bible text is unavailable. Return to the journey and ask the organizer.'
					: reason === 'SetupChanged' || reason === 'SetupInvalid'
						? 'Your private setup changed or is incomplete. Reload your choices.'
						: reason === 'ScheduleChanged' ||
							  reason === 'ScheduleCanceled' ||
							  reason === 'EnrollmentClosed'
							? 'The schedule changed or enrollment closed. Return to the journey and review it.'
							: reason === 'ActivePersonalJourney'
								? 'An active personal journey already exists. It will not be replaced.'
								: reason === 'MembershipEnded' ||
									  reason === 'CommunityClosed'
									? 'Community access changed. Return to your communities.'
									: reason === 'EnrollmentAlreadyExists'
										? 'Enrollment was accepted. Return to the journey to see your status.'
										: reason
											? 'Enrollment could not be confirmed. Refresh your review.'
											: 'We could not confirm enrollment. Retry the same request when connected.',
			);
		} finally {
			submitting.current = false;
			if (focused.current) setBusy(false);
		}
	};
	const blocker =
		ready && !loading && !error
			? enrollmentBlocker(
					schedule,
					snapshot?.draft ?? null,
					activeJourney != null,
				)
			: null;
	const translationName = Object.values(BibleVersion).find(
		(item) =>
			item.bibleVersionId === snapshot?.draft?.choices.bibleVersionId,
	)?.name;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			keyboardEnabled={false}
			testID='community-journey-enrollment-screen'
		>
			<View style={{ gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='Display'>Review enrollment</Typography>
				</View>
				<Typography
					weight='Regular'
					tone='Secondary'
				>
					Enrollment keeps your practice choices, completion,
					progress, and writing private. A later, separate choice is
					required for sharing progress.
				</Typography>
				{!ready ? (
					<Typography>
						{context.status === 'Loading'
							? 'Loading community access…'
							: 'Community access is unavailable.'}
					</Typography>
				) : null}
				{context.status === 'Error' ? (
					<TurndownButton
						variant='Outline'
						onPress={retryContext}
					>
						Try again
					</TurndownButton>
				) : null}
				{ready && loading ? (
					<Typography>Loading your private review…</Typography>
				) : null}
				{ready && error ? (
					<View accessibilityRole='alert'>
						<Typography>{error}</Typography>
						<TurndownButton
							variant='Outline'
							onPress={() => void load()}
						>
							Try again
						</TurndownButton>
					</View>
				) : null}
				{ready && !loading && !error && schedule ? (
					<Card>
						<View style={{ gap: Spacing.Small }}>
							<Typography size='H2'>
								{context.context.community.name}
							</Typography>
							<Typography>
								Course {schedule.course.courseId}, version{' '}
								{schedule.course.courseVersionId}
							</Typography>
							<Typography>
								Scheduled start: {schedule.startDate}
							</Typography>
							<Typography>
								Community time zone: {schedule.timeZoneId}
							</Typography>
							<Typography>
								Your starting time zone: {zone ?? 'Unavailable'}
							</Typography>
							<Typography
								weight='Regular'
								tone='Secondary'
							>
								The community date follows its zone. Your
								personal Day 1 follows your confirmed starting
								zone when eligible, so the displayed dates may
								differ.
							</Typography>
						</View>
					</Card>
				) : null}
				{ready && !loading && !error && snapshot && !editing ? (
					<Card>
						<View style={{ gap: Spacing.Small }}>
							<Typography size='H2'>
								Your private choices
							</Typography>
							<Typography>
								Practices:{' '}
								{snapshot.draft?.choices.optionalPracticeIds
									.map(
										(id) =>
											setupPractices.find(
												(item) =>
													item.practiceId === id,
											)?.name ?? id,
									)
									.join(', ') || 'None chosen'}
							</Typography>
							<Typography>
								Bible translation:{' '}
								{translationName ?? 'None chosen'}
							</Typography>
							<TurndownButton
								variant='Outline'
								onPress={() => {
									setPractices(
										snapshot.draft?.choices
											.optionalPracticeIds ?? [],
									);
									setTranslation(
										snapshot.draft?.choices
											.bibleVersionId ?? null,
									);
									setEditing(true);
									setConsent(false);
								}}
							>
								Change private choices
							</TurndownButton>
						</View>
					</Card>
				) : null}
				{ready && !loading && !error && editing ? (
					<View style={{ gap: Spacing.Small }}>
						<Typography size='H2'>
							Choose private practices
						</Typography>
						{setupPractices.map((practice) => (
							<SetupPracticeChoice
								key={practice.practiceId}
								practice={practice}
								checked={practices.includes(
									practice.practiceId,
								)}
								disabled={busy}
								onChange={(checked) =>
									setPractices((current) =>
										checked
											? current.includes(
													practice.practiceId,
												)
												? current
												: [
														...current,
														practice.practiceId,
													]
											: current.filter(
													(id) =>
														id !==
														practice.practiceId,
												),
									)
								}
							/>
						))}
						<Typography size='H2'>Bible translation</Typography>
						{Object.values(BibleVersion).map((version) => (
							<Card key={version.bibleVersionId}>
								<SetupCheckboxChoice
									label={version.name}
									checked={
										translation === version.bibleVersionId
									}
									disabled={busy}
									onChange={() =>
										setTranslation(version.bibleVersionId)
									}
								/>
							</Card>
						))}
						<TurndownButton
							disabled={busy}
							loading={busy}
							onPress={() => void saveChoices()}
						>
							Save choices and return
						</TurndownButton>
						<TurndownButton
							variant='Outline'
							disabled={busy}
							onPress={() => setEditing(false)}
						>
							Cancel edits
						</TurndownButton>
					</View>
				) : null}
				{activeJourney === undefined && !journeyError ? (
					<Typography>
						Checking your personal journey status…
					</Typography>
				) : null}
				{journeyError ? (
					<View accessibilityRole='alert'>
						<Typography>
							We could not check your active journey. Try again
							before enrolling.
						</Typography>
						<TurndownButton
							variant='Outline'
							onPress={retryJourney}
						>
							Retry journey check
						</TurndownButton>
					</View>
				) : null}
				{blocker || block ? (
					<View accessibilityRole='alert'>
						<Typography>{block ?? blocker}</Typography>
						<TurndownButton
							variant='Outline'
							onPress={() => {
								setBlock(null);
								void load();
							}}
						>
							Reload review
						</TurndownButton>
					</View>
				) : null}
				{ready &&
				!loading &&
				!editing &&
				!error &&
				!blocker &&
				!block &&
				activeJourney === null &&
				zone ? (
					<View style={{ gap: Spacing.Small }}>
						<SetupCheckboxChoice
							label='I confirm that enrolling authorizes starting a new personal journey on the scheduled calendar date when I am eligible.'
							checked={consent}
							disabled={busy}
							onChange={setConsent}
						/>
						<Typography
							weight='Regular'
							tone='Secondary'
						>
							An active personal journey is never ended or
							replaced. Canceling this review leaves your
							community membership and private writing intact.
						</Typography>
						<TurndownButton
							disabled={!consent || busy}
							loading={busy}
							onPress={() => void submit()}
						>
							Confirm enrollment
						</TurndownButton>
					</View>
				) : null}
				<TurndownButton
					variant='Outline'
					disabled={busy}
					onPress={detail}
				>
					Back to community journey
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};
