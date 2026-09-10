import { Input } from '@td/components/form/input/input.component';
import { TurndownStaticScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { LoadingState } from '@td/components/ui/loading-state/loading-state.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { getJourneyCalendarDate } from '@td/features/journey/journey-calendar';
import { JourneySetupStep } from '@td/types/account/journey-setup.types';
import type { TBibleVersionId } from '@td/types/formation/bible-version.types';
import { BibleVersion } from '@td/types/formation/bible-version.types';
import type { TOptionalPracticeId } from '@td/types/formation/practice.types';
import { FirebaseError } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';
import { ScrollView as NativeScrollView, Pressable, View } from 'react-native';
import { JourneySetupStepper } from './journey-setup-stepper.component';
import { SetupColumn, SetupContainer, SetupRow } from './journey-setup.styles';
import {
	createJourneyStartOperationId,
	startJourney,
} from './journey-start.service';
import { SetupCheckboxChoice } from './setup-checkbox-choice.component';
import { SetupPracticeChoice } from './setup-practice-choice.component';

import { setupPractices, weeklyThemes } from './journey-setup-content';
import {
	getReminderPreference,
	getSetupChoices,
	isValidReminderTime,
} from './journey-setup-validation';
import {
	ReminderTimePicker,
	formatReminderTime,
} from './reminder-time-picker.component';
import type { TJourneySetupChanges } from './use-journey-setup-persistence.hook';
import { useJourneySetupPersistence } from './use-journey-setup-persistence.hook';

type TSetupScreenStep =
	(typeof JourneySetupStep)[keyof typeof JourneySetupStep];

const setupSteps = [
	{
		id: JourneySetupStep.Commitment,
		title: 'Make room for life with Jesus',
		description:
			'77 days of Scripture, prayer, and faithful action. Begin with grace, and take it one day at a time.',
	},
	{
		id: JourneySetupStep.Practices,
		title: 'Choose 2–4 additional practices',
		description:
			'Choose practices that fit your life. These join your three Foundational Practices each day.',
	},
	{
		id: JourneySetupStep.BibleVersion,
		title: 'Choose your Bible translation',
		description:
			'You can change your translation later or read the assigned passage in your own Bible.',
	},
	{
		id: JourneySetupStep.Motivation,
		title: 'What are you hoping to grow in?',
		description:
			'As you spend time with Jesus, what would you like to bring before Him? A sentence or two is enough.',
	},
	{
		id: JourneySetupStep.Reminders,
		title: 'Make space in your day',
		description:
			'Choose a time for Scripture and prayer, reflection, or both. Reminders are optional.',
	},
	{
		id: JourneySetupStep.WeeklyThemes,
		title: 'Eleven weeks of following Jesus',
		description:
			'Each week brings a new focus as you continue with Scripture, prayer, and your daily practices.',
	},
	{
		id: JourneySetupStep.Review,
		title: 'Review your 77 days',
		description:
			'Take a moment to review your practices and the dates before you begin.',
	},
];

const formatJourneyDate = (date: Date): string =>
	new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(date);

interface IReviewRowProps {
	label: string;
	value: string;
	onChange?: () => void;
}

const ReviewRow = ({ label, value, onChange }: IReviewRowProps) => (
	<SetupRow>
		<SetupColumn style={{ flex: 1 }}>
			<Typography tone='Muted'>{label}</Typography>
			<Typography weight='Semibold'>{value}</Typography>
		</SetupColumn>
		{onChange ? (
			<TurndownButton
				variant='Link'
				fullWidth={false}
				onPress={onChange}
				accessibilityLabel={`Change ${label}`}
			>
				<Typography
					tone='Brand'
					weight='Semibold'
				>
					Change
				</Typography>
			</TurndownButton>
		) : null}
	</SetupRow>
);

interface IReminderChoiceProps {
	label: string;
	description: string;
	isEnabled: boolean;
	time: string;
	onEnabledChange: (isEnabled: boolean) => void;
	onTimeChange: (time: string) => void;
	disabled: boolean;
}

const ReminderChoice = ({
	label,
	description,
	isEnabled,
	time,
	onEnabledChange,
	onTimeChange,
	disabled,
}: IReminderChoiceProps) => (
	<Card>
		<SetupColumn>
			<SetupCheckboxChoice
				disabled={disabled}
				label={label}
				checked={isEnabled}
				onChange={onEnabledChange}
			/>
			<Typography tone='Muted'>{description}</Typography>
			{isEnabled ? (
				<ReminderTimePicker
					disabled={disabled}
					label={`${label} time`}
					value={time}
					onValueChange={onTimeChange}
				/>
			) : null}
		</SetupColumn>
	</Card>
);

interface IJourneySetupScreenProps {
	userId: string;
}

export const JourneySetupScreen = ({ userId }: IJourneySetupScreenProps) => {
	const [hasRestoredSetup, setHasRestoredSetup] = useState(false);
	const [lastSavedChanges, setLastSavedChanges] = useState<string | null>(
		null,
	);
	const [validationMessage, setValidationMessage] = useState<string | null>(
		null,
	);
	const isNavigating = useRef(false);
	const [isNavigatingStep, setIsNavigatingStep] = useState(false);
	const scrollRef = useRef<NativeScrollView>(null);
	const [currentStep, setCurrentStep] = useState<TSetupScreenStep>(
		JourneySetupStep.Commitment,
	);
	const [selectedPractices, setSelectedPractices] = useState<
		readonly TOptionalPracticeId[]
	>([]);
	const [bibleVersionId, setBibleVersionId] =
		useState<TBibleVersionId | null>(null);
	const [motivation, setMotivation] = useState('');
	const [hasMorningReminder, setHasMorningReminder] = useState(false);
	const [hasEveningReminder, setHasEveningReminder] = useState(false);
	const [morningTime, setMorningTime] = useState('07:00');
	const [eveningTime, setEveningTime] = useState('20:00');
	const [isEditingReview, setIsEditingReview] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [isAwaitingJourney, setIsAwaitingJourney] = useState(false);
	const [hasStartConflict, setHasStartConflict] = useState(false);
	const startOperationId = useRef<string | null>(null);
	const isStartPending = useRef(false);
	const [reviewDate, setReviewDate] = useState(new Date());
	const [hasDateChanged, setHasDateChanged] = useState(false);

	const persistence = useJourneySetupPersistence(
		userId,
		({ draft, devicePreferences }) => {
			setCurrentStep(draft?.currentStep ?? JourneySetupStep.Commitment);
			setSelectedPractices(draft?.choices.optionalPracticeIds ?? []);
			setBibleVersionId(draft?.choices.bibleVersionId ?? null);
			setMotivation(draft?.startingMotivation?.text ?? '');
			setHasMorningReminder(
				devicePreferences?.morningReminder.isEnabled ?? false,
			);
			setHasEveningReminder(
				devicePreferences?.eveningReflectionReminder.isEnabled ?? false,
			);
			setMorningTime(
				devicePreferences?.morningReminder.localTime ?? '07:00',
			);
			setEveningTime(
				devicePreferences?.eveningReflectionReminder.localTime ??
					'20:00',
			);
			setIsEditingReview(false);
			startOperationId.current = null;
			setHasStartConflict(false);
			setValidationMessage(null);
			setLastSavedChanges(null);
			setHasRestoredSetup(true);
		},
	);

	const stepIndex = setupSteps.findIndex((step) => step.id === currentStep);
	const step = setupSteps[stepIndex] ?? setupSteps[0]!;
	const selectedTranslation = Object.values(BibleVersion).find(
		(translation) => translation.bibleVersionId === bibleVersionId,
	);
	const selectedPracticeNames = setupPractices
		.filter((practice) =>
			selectedPractices.some(
				(practiceId) => practiceId === practice.practiceId,
			),
		)
		.map((practice) => practice.name);
	const isOptionalStep =
		currentStep === JourneySetupStep.Motivation ||
		currentStep === JourneySetupStep.Reminders;
	const hasValidReminders =
		(!hasMorningReminder || isValidReminderTime(morningTime)) &&
		(!hasEveningReminder || isValidReminderTime(eveningTime));
	const hasCombinedReminder =
		hasMorningReminder &&
		hasEveningReminder &&
		morningTime === eveningTime &&
		hasValidReminders;
	const reminderSummary = hasCombinedReminder
		? `Combined reminder at ${formatReminderTime(morningTime)}`
		: [
				hasMorningReminder
					? `Morning at ${formatReminderTime(morningTime)}`
					: null,
				hasEveningReminder
					? `Evening at ${formatReminderTime(eveningTime)}`
					: null,
			]
				.filter(Boolean)
				.join('\n') || 'Off';
	const hasValidPractices =
		selectedPractices.length >= 2 && selectedPractices.length <= 4;
	const isInteractionBlocked =
		isNavigatingStep ||
		isStarting ||
		isAwaitingJourney ||
		persistence.hasConflict ||
		hasStartConflict;
	const isContinueDisabled =
		isStarting ||
		isAwaitingJourney ||
		hasStartConflict ||
		persistence.isSaving ||
		persistence.hasConflict ||
		(currentStep === JourneySetupStep.Practices && !hasValidPractices) ||
		(currentStep === JourneySetupStep.BibleVersion && !bibleVersionId) ||
		(currentStep === JourneySetupStep.Reminders && !hasValidReminders) ||
		(currentStep === JourneySetupStep.Review &&
			(!hasValidPractices || !bibleVersionId || !hasValidReminders));
	const finalDate = new Date(reviewDate);
	finalDate.setDate(reviewDate.getDate() + 76);
	const [timeZoneId, setTimeZoneId] = useState(
		() => Intl.DateTimeFormat().resolvedOptions().timeZone,
	);

	useEffect(() => {
		scrollRef.current?.scrollTo({ y: 0, animated: false });
	}, [currentStep]);

	useEffect(() => {
		if (currentStep !== JourneySetupStep.Review) return;
		const refreshDate = () => {
			const now = new Date();
			const currentTimeZoneId =
				Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (
				timeZoneId !== currentTimeZoneId ||
				getJourneyCalendarDate(reviewDate, timeZoneId) !==
					getJourneyCalendarDate(now, currentTimeZoneId)
			) {
				setHasDateChanged(true);
				setTimeZoneId(currentTimeZoneId);
				setReviewDate(now);
			}
		};
		refreshDate();
		const intervalId = setInterval(refreshDate, 1000);
		return () => clearInterval(intervalId);
	}, [currentStep, reviewDate, timeZoneId]);

	const handlePracticeChange = (
		practiceId: TOptionalPracticeId,
		isSelected: boolean,
	) => {
		setSelectedPractices((previousSelection) => {
			if (!isSelected) {
				return previousSelection.filter(
					(selectedId) => selectedId !== practiceId,
				);
			}
			if (
				previousSelection.some(
					(selectedId) => selectedId === practiceId,
				) ||
				previousSelection.length >= 4
			)
				return previousSelection;
			return [...previousSelection, practiceId];
		});
	};

	const handleTranslationChange = (selectedId: string) => {
		const translation = Object.values(BibleVersion).find(
			(version) => version.bibleVersionId === selectedId,
		);
		if (translation) setBibleVersionId(translation.bibleVersionId);
	};

	const getChanges = (nextStep = currentStep): TJourneySetupChanges => ({
		currentStep: nextStep,
		choices: getSetupChoices(selectedPractices, bibleVersionId),
		motivation,
		morningReminder: getReminderPreference(hasMorningReminder, morningTime),
		eveningReflectionReminder: getReminderPreference(
			hasEveningReminder,
			eveningTime,
		),
	});

	const saveChanges = async (
		changes: TJourneySetupChanges,
	): Promise<boolean> => {
		const didSave = await persistence.save(changes);
		if (didSave) {
			setLastSavedChanges(JSON.stringify(changes));
			setValidationMessage(null);
		}
		return didSave;
	};

	let changes: TJourneySetupChanges | null = null;
	let changesError: string | null = null;
	try {
		changes = getChanges();
	} catch (error) {
		changesError =
			error instanceof Error
				? error.message
				: 'Review your choices before saving.';
	}
	const changesKey = changes ? JSON.stringify(changes) : null;
	const hasUnsavedChanges = changesKey !== lastSavedChanges;

	useEffect(() => {
		if (
			isStarting ||
			isAwaitingJourney ||
			hasStartConflict ||
			!hasRestoredSetup ||
			persistence.isLoading ||
			persistence.isSaving ||
			persistence.errorMessage ||
			!changes ||
			!hasUnsavedChanges ||
			isNavigating.current
		)
			return;

		const timeoutId = setTimeout(() => {
			void saveChanges(changes);
		}, 700);
		return () => clearTimeout(timeoutId);
	});

	const handleSave = async (
		nextStep: TSetupScreenStep,
		shouldSkip = false,
	): Promise<boolean> => {
		if (isNavigating.current || persistence.hasConflict || hasStartConflict)
			return false;
		isNavigating.current = true;
		setIsNavigatingStep(true);
		try {
			const nextChanges = getChanges(nextStep);
			if (shouldSkip && currentStep === JourneySetupStep.Motivation)
				nextChanges.motivation = '';
			if (shouldSkip && currentStep === JourneySetupStep.Reminders) {
				nextChanges.morningReminder = getReminderPreference(
					false,
					morningTime,
				);
				nextChanges.eveningReflectionReminder = getReminderPreference(
					false,
					eveningTime,
				);
			}
			const didSave = await saveChanges(nextChanges);
			if (!didSave) return false;
			if (shouldSkip && currentStep === JourneySetupStep.Motivation)
				setMotivation('');
			if (shouldSkip && currentStep === JourneySetupStep.Reminders) {
				setHasMorningReminder(false);
				setHasEveningReminder(false);
			}
			setCurrentStep(nextStep);
			if (nextStep !== currentStep) setIsEditingReview(false);
			return true;
		} catch (error) {
			setValidationMessage(
				error instanceof Error
					? error.message
					: 'Review your choices before saving.',
			);
			return false;
		} finally {
			isNavigating.current = false;
			setIsNavigatingStep(false);
		}
	};

	const handleContinue = async () => {
		if (isContinueDisabled) return;
		if (currentStep === JourneySetupStep.Review) {
			if (isStartPending.current) return;
			isStartPending.current = true;
			setIsStarting(true);
			setValidationMessage(null);
			try {
				const reviewedStartDate = getJourneyCalendarDate(
					reviewDate,
					timeZoneId,
				);
				const didSave = await handleSave(currentStep);
				if (!didSave) return;
				const expectedSetupRevision = persistence.getDraftRevision();
				if (expectedSetupRevision === null) return;
				startOperationId.current ??=
					createJourneyStartOperationId(userId);
				const currentZone =
					Intl.DateTimeFormat().resolvedOptions().timeZone;
				const now = new Date();
				if (
					currentZone !== timeZoneId ||
					getJourneyCalendarDate(now, currentZone) !==
						reviewedStartDate
				) {
					setTimeZoneId(currentZone);
					setReviewDate(now);
					setHasDateChanged(true);
					setValidationMessage(
						'The date has changed. Review the updated dates, then select Start my journey.',
					);
					startOperationId.current = null;
					return;
				}
				const result = await startJourney({
					operationId: startOperationId.current,
					setupDraftId: 'current',
					expectedSetupRevision,
					review: {
						observedPhoneTimeZoneId: timeZoneId,
						reviewedStartDate,
					},
				});
				if (result.outcome === 'ReviewChanged') {
					setReviewDate(
						new Date(`${result.review.reviewedStartDate}T12:00:00`),
					);
					setTimeZoneId(result.review.observedPhoneTimeZoneId);
					setHasDateChanged(true);
					setValidationMessage(
						'The date has changed. Review the updated dates, then select Start my journey.',
					);
					startOperationId.current = null;
					return;
				}
				// The account guard follows the journey subscription to Today after server confirmation.
				setIsAwaitingJourney(true);
			} catch (error) {
				const errorCode =
					error instanceof FirebaseError ? error.code : 'unknown';
				console.warn('Journey start could not be confirmed.', {
					errorCode,
				});
				const reason =
					error instanceof FirebaseError &&
					'details' in error &&
					typeof error.details === 'object' &&
					error.details !== null &&
					'reason' in error.details
						? error.details.reason
						: null;
				setHasStartConflict(reason === 'SetupChanged');
				setValidationMessage(
					reason === 'ContentUnavailable'
						? 'The daily readings for your selected translation aren’t ready yet. Your setup is saved. Please try again later.'
						: reason === 'SetupChanged'
							? 'Your setup changed in another session. Copy any writing you want to keep, then load the saved setup and review it before starting.'
							: errorCode === 'functions/unauthenticated'
								? 'Your session needs to be refreshed. Your setup is saved. Sign out and sign in again before starting.'
								: errorCode === 'functions/permission-denied'
									? 'We couldn’t confirm access to start your journey. Your setup is saved. Confirm your email, then sign in again.'
									: errorCode === 'functions/not-found' ||
										  errorCode === 'functions/internal'
										? 'Starting your journey is temporarily unavailable. Your setup is saved. Please try again later.'
										: 'We couldn’t confirm that your journey started. Your setup is saved. Please try Start my journey again shortly.',
				);
			} finally {
				isStartPending.current = false;
				setIsStarting(false);
			}
			return;
		}
		await handleSave(
			isEditingReview
				? JourneySetupStep.Review
				: (setupSteps[stepIndex + 1]?.id ?? currentStep),
		);
	};

	const handleBack = async () => {
		if (isInteractionBlocked) return;
		await handleSave(
			isEditingReview
				? JourneySetupStep.Review
				: (setupSteps[stepIndex - 1]?.id ?? currentStep),
		);
	};

	const handleSkip = async () => {
		if (isInteractionBlocked) return;
		await handleSave(
			isEditingReview
				? JourneySetupStep.Review
				: (setupSteps[stepIndex + 1]?.id ?? currentStep),
			true,
		);
	};

	const handleEdit = async (setupStep: TSetupScreenStep) => {
		if (isInteractionBlocked) return;
		const didSave = await handleSave(setupStep);
		if (didSave) setIsEditingReview(true);
	};

	const handleRetry = async () => {
		await handleSave(currentStep);
	};

	return (
		<TurndownStaticScreen
			contentPadding={0}
			horizontalPadding={0}
			verticalPadding={0}
			keyboardEnabled
		>
			<NativeScrollView
				ref={scrollRef}
				keyboardShouldPersistTaps='handled'
				contentContainerStyle={{ flexGrow: 1 }}
			>
				<SetupContainer>
					<SetupColumn>
						<SetupRow>
							<Typography
								weight='Semibold'
								tone='Brand'
							>
								77Faithful
							</Typography>
							<Typography tone='Muted'>Journey setup</Typography>
						</SetupRow>
						{persistence.errorMessage ||
						validationMessage ||
						changesError ? (
							<SetupColumn>
								<Typography tone='Error'>
									{persistence.errorMessage ??
										validationMessage ??
										changesError}
								</Typography>
								{persistence.hasConflict ||
								hasStartConflict ||
								!hasRestoredSetup ? (
									<TurndownButton
										onPress={persistence.reload}
										disabled={persistence.isLoading}
									>
										{persistence.hasConflict ||
										hasStartConflict
											? 'Load saved setup'
											: 'Try again'}
									</TurndownButton>
								) : persistence.errorMessage ? (
									<TurndownButton
										onPress={handleRetry}
										disabled={persistence.isSaving}
									>
										Try saving again
									</TurndownButton>
								) : null}
							</SetupColumn>
						) : null}
						{persistence.isLoading ? (
							<LoadingState label='Loading your setup' />
						) : !hasRestoredSetup ? null : (
							<SetupColumn
								pointerEvents={
									isNavigatingStep ||
									isStarting ||
									isAwaitingJourney
										? 'none'
										: 'auto'
								}
							>
								<View accessibilityLiveRegion='polite'>
									<Typography tone='Muted'>
										{persistence.isSaving
											? 'Saving…'
											: hasUnsavedChanges
												? 'Changes not yet saved'
												: 'Saved to your account'}
									</Typography>
								</View>
								<JourneySetupStepper
									currentStep={stepIndex + 1}
									totalSteps={setupSteps.length}
									stepTitle={step.title}
									stepDescription={step.description}
									isOptional={isOptionalStep}
									isContinueDisabled={isContinueDisabled}
									onContinue={handleContinue}
									onBack={
										stepIndex > 0 ? handleBack : undefined
									}
									isBusy={
										isInteractionBlocked ||
										persistence.isSaving
									}
									onSkip={
										isOptionalStep ? handleSkip : undefined
									}
									primaryActionLabel={
										currentStep === JourneySetupStep.Review
											? isAwaitingJourney
												? 'Opening today…'
												: isStarting
													? 'Starting…'
													: 'Start my journey'
											: isEditingReview
												? 'Return to review'
												: 'Continue'
									}
								>
									{currentStep ===
									JourneySetupStep.Commitment ? (
										<SetupColumn>
											<Card>
												<SetupColumn>
													<Typography size='H3'>
														Five to seven practices,
														each day
													</Typography>
													<Typography weight='Semibold'>
														Read Scripture · Pray ·
														Reflect
													</Typography>
													<Typography>
														Engage with the assigned
														Bible passage, spend
														time with God in prayer,
														and reflect on your
														response to Him. Writing
														is optional.
													</Typography>
													<Divider />
													<Typography>
														You’ll choose two to
														four more practices that
														fit your circumstances.
													</Typography>
												</SetupColumn>
											</Card>
											<Typography>
												<Typography weight='Semibold'>
													77 calendar days, not 77
													perfect days.
												</Typography>{' '}
												Missed days stay in your
												history. The calendar continues,
												and you do not need to restart.
											</Typography>
											<Typography>
												These practices do not earn
												God’s favor, but they help you
												spend time with Him and respond
												to His Word.
											</Typography>
											<Typography>
												Eleven weekly themes guide these
												77 days, from abiding in Christ
												to persevering in faith.
											</Typography>
											<Typography tone='Muted'>
												77Faithful is free and always
												will be. Your motivation and
												reflections are private.
											</Typography>
										</SetupColumn>
									) : null}
									{currentStep ===
									JourneySetupStep.Practices ? (
										<SetupColumn>
											<Card>
												<SetupColumn>
													<Typography weight='Semibold'>
														Foundational Practices
													</Typography>
													<Typography>
														Read Scripture · Pray ·
														Reflect
													</Typography>
												</SetupColumn>
											</Card>
											<Typography weight='Semibold'>
												{selectedPractices.length}{' '}
												selected · Choose 2–4
											</Typography>
											<Typography tone='Muted'>
												{selectedPractices.length >= 4
													? 'To choose a different practice, deselect one first.'
													: hasValidPractices
														? 'You can continue or choose up to four practices.'
														: 'Choose at least two different practices to continue.'}
											</Typography>
											{setupPractices.map((practice) => {
												const isSelected =
													selectedPractices.some(
														(practiceId) =>
															practiceId ===
															practice.practiceId,
													);
												return (
													<SetupPracticeChoice
														key={
															practice.practiceId
														}
														practice={practice}
														checked={isSelected}
														disabled={
															isInteractionBlocked ||
															(!isSelected &&
																selectedPractices.length >=
																	4)
														}
														onChange={(checked) =>
															handlePracticeChange(
																practice.practiceId,
																checked,
															)
														}
													/>
												);
											})}
										</SetupColumn>
									) : null}
									{currentStep ===
									JourneySetupStep.BibleVersion ? (
										<SetupColumn>
											<SetupColumn
												accessibilityRole='radiogroup'
												accessibilityLabel='Bible translation'
											>
												<Typography weight='Semibold'>
													Bible translation
												</Typography>
												{Object.values(
													BibleVersion,
												).map((translation) => (
													<Pressable
														key={
															translation.bibleVersionId
														}
														accessibilityRole='radio'
														accessibilityLabel={`${translation.name} (${translation.abbreviation})`}
														accessibilityState={{
															checked:
																bibleVersionId ===
																translation.bibleVersionId,
															disabled:
																isInteractionBlocked,
														}}
														disabled={
															isInteractionBlocked
														}
														onPress={() =>
															handleTranslationChange(
																translation.bibleVersionId,
															)
														}
													>
														<View
															pointerEvents='none'
															accessibilityElementsHidden
															importantForAccessibility='no-hide-descendants'
														>
															<Card
																variant={
																	bibleVersionId ===
																	translation.bibleVersionId
																		? 'Muted'
																		: 'Outlined'
																}
															>
																<Typography
																	weight={
																		bibleVersionId ===
																		translation.bibleVersionId
																			? 'Semibold'
																			: 'Regular'
																	}
																>
																	{
																		translation.name
																	}{' '}
																	(
																	{
																		translation.abbreviation
																	}
																	)
																</Typography>
															</Card>
														</View>
													</Pressable>
												))}
											</SetupColumn>
											{!bibleVersionId ? (
												<Typography tone='Muted'>
													Choose a translation to
													continue.
												</Typography>
											) : null}
										</SetupColumn>
									) : null}
									{currentStep ===
									JourneySetupStep.Motivation ? (
										<SetupColumn>
											<Input
												label='Starting motivation (optional)'
												placeholder='What are you hoping to grow in as you spend time with Jesus?'
												multiline
												ignoreForm
												readOnly={isInteractionBlocked}
												value={motivation}
												onChange={(value) =>
													setMotivation(
														value.slice(0, 10000),
													)
												}
											/>
											<Typography tone='Muted'>
												This is a private reflection,
												not a vow or a promise of a
												particular outcome. You can
												revisit, edit, or delete it
												later.
											</Typography>
										</SetupColumn>
									) : null}
									{currentStep ===
									JourneySetupStep.Reminders ? (
										<SetupColumn>
											<ReminderChoice
												disabled={isInteractionBlocked}
												label='Morning reminder'
												description='Make time for Scripture and prayer.'
												isEnabled={hasMorningReminder}
												time={morningTime}
												onEnabledChange={
													setHasMorningReminder
												}
												onTimeChange={setMorningTime}
											/>
											<ReminderChoice
												disabled={isInteractionBlocked}
												label='Evening reflection reminder'
												description='Take a moment to reflect on your day.'
												isEnabled={hasEveningReminder}
												time={eveningTime}
												onEnabledChange={
													setHasEveningReminder
												}
												onTimeChange={setEveningTime}
											/>
											{hasCombinedReminder ? (
												<Card>
													<SetupColumn>
														<Typography>
															Both times match.
															One combined
															reminder would
															invite you to read,
															pray, and reflect.
														</Typography>
													</SetupColumn>
												</Card>
											) : null}
											<Typography tone='Muted'>
												Times follow this phone’s local
												clock, even when you travel.
												Choose times that suit your day;
												they are not deadlines. You can
												change them later in Settings.
											</Typography>
											<Typography tone='Muted'>
												Your preferences are saved for
												this device. Notifications are
												not scheduled yet.
											</Typography>
										</SetupColumn>
									) : null}
									{currentStep ===
									JourneySetupStep.WeeklyThemes ? (
										<SetupColumn>
											<Card>
												<SetupColumn>
													<Typography size='H3'>
														Eleven weeks of
														following Jesus
													</Typography>
													{weeklyThemes.map(
														(theme, index) => (
															<SetupRow
																key={theme}
															>
																<Typography tone='Muted'>
																	Week{' '}
																	{index + 1}
																</Typography>
																<Typography>
																	{theme}
																</Typography>
															</SetupRow>
														),
													)}
												</SetupColumn>
											</Card>
											<Typography>
												These themes guide your time
												with God; they do not measure
												your spiritual maturity. Keep
												returning to the practices as
												each new week begins.
											</Typography>
											<Typography tone='Muted'>
												Day 77 is a time to reflect and
												give thanks. Following Jesus
												continues beyond these 77 days.
											</Typography>
										</SetupColumn>
									) : null}
									{currentStep === JourneySetupStep.Review ? (
										<SetupColumn>
											{hasDateChanged ? (
												<Typography tone='Info'>
													Your local date changed.
													Review the dates before
													continuing.
												</Typography>
											) : null}
											<Card>
												<SetupColumn>
													<Typography weight='Semibold'>
														Day 1 ·{' '}
														{formatJourneyDate(
															reviewDate,
														)}
													</Typography>
													<Typography weight='Semibold'>
														Day 77 ·{' '}
														{formatJourneyDate(
															finalDate,
														)}
													</Typography>
												</SetupColumn>
											</Card>
											<Card>
												<SetupColumn>
													<ReviewRow
														label={`${selectedPractices.length + 3} daily practices`}
														value={[
															'Read Scripture',
															'Pray',
															'Reflect',
															...selectedPracticeNames,
														].join('\n')}
														onChange={() =>
															handleEdit(
																JourneySetupStep.Practices,
															)
														}
													/>
													<Divider />
													<ReviewRow
														label='Bible translation'
														value={
															selectedTranslation
																? `${selectedTranslation.name} (${selectedTranslation.abbreviation})`
																: 'Not selected'
														}
														onChange={() =>
															handleEdit(
																JourneySetupStep.BibleVersion,
															)
														}
													/>
													<Divider />
													<ReviewRow
														label='Starting motivation'
														value={
															motivation.trim() ||
															'Not provided'
														}
														onChange={() =>
															handleEdit(
																JourneySetupStep.Motivation,
															)
														}
													/>
													<Divider />
													<ReviewRow
														label='Reminder choices'
														value={reminderSummary}
														onChange={() =>
															handleEdit(
																JourneySetupStep.Reminders,
															)
														}
													/>
												</SetupColumn>
											</Card>
											<Typography>
												Days continue after an absence.
												Your earlier record remains, and
												you do not need to restart. You
												can change your Chosen Practices
												for the next journey day.
											</Typography>
											<Typography tone='Muted'>
												Your choices are saved. Select
												Start my journey to begin Day 1
												today. Your 77 days begin once
												the start is confirmed.
											</Typography>
										</SetupColumn>
									) : null}
								</JourneySetupStepper>
							</SetupColumn>
						)}
					</SetupColumn>
				</SetupContainer>
			</NativeScrollView>
		</TurndownStaticScreen>
	);
};
