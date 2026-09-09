import { collection, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { app, db } from '@77/lib/firebase';
import { getJourneyCalendarDate } from '@77/features/journey/journey-calendar';
import { JourneyPreviewTabs } from '@77/features/journey/journey-preview-tabs.component';
import type { TTodayJourney } from '@77/features/journey/today-screen.component';
import type {
  IStartJourneyRequest,
  TStartJourneyResult,
} from '@77/types/journey/journey-function.types';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView as NativeScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Separator, Spinner, XStack, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import {
  SeventySevenFormCheckbox,
  SeventySevenFormRadioButton,
  SeventySevenFormRadioGroup,
  SeventySevenFormTextInput,
} from '@77/components/form';
import { SeventySevenStepper } from '@77/components/navigation';
import { SeventySevenDropdown } from '@77/components/surface';
import { SeventySevenCard } from '@77/surface';
import { JourneySetupStep } from '@77/types/account/journey-setup.types';
import { BibleVersion } from '@77/types/formation/bible-version.types';
import type { TBibleVersionId } from '@77/types/formation/bible-version.types';
import type { TOptionalPracticeId } from '@77/types/formation/practice.types';

import { setupPractices, weeklyThemes } from './journey-setup-content';
import {
  getReminderPreference,
  getSetupChoices,
  isValidReminderTime,
} from './journey-setup-validation';
import { useJourneySetupPersistence } from './use-journey-setup-persistence.hook';
import type { TJourneySetupChanges } from './use-journey-setup-persistence.hook';
import { ReminderTimePicker, formatReminderTime } from './reminder-time-picker.component';

type TSetupScreenStep = (typeof JourneySetupStep)[keyof typeof JourneySetupStep];

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
    description: 'Take a moment to review your practices and the dates before you begin.',
  },
];

const formatJourneyDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);

interface IReviewRowProps {
  label: string;
  value: string;
  onChange?: () => void;
}

const ReviewRow = ({ label, value, onChange }: IReviewRowProps) => (
  <XStack gap="$3" items="flex-start" justify="space-between" py="$3">
    <YStack flex={1} gap="$1">
      <SeventySevenText color="$textSecondary">{label}</SeventySevenText>
      <SeventySevenText bold>{value}</SeventySevenText>
    </YStack>
    {onChange ? (
      <Button chromeless minH={44} onPress={onChange} aria-label={`Change ${label}`}>
        <SeventySevenText color="$link" bold>
          Change
        </SeventySevenText>
      </Button>
    ) : null}
  </XStack>
);

interface IReminderChoiceProps {
  label: string;
  description: string;
  isEnabled: boolean;
  time: string;
  onEnabledChange: (isEnabled: boolean) => void;
  onTimeChange: (time: string) => void;
}

const ReminderChoice = ({
  label,
  description,
  isEnabled,
  time,
  onEnabledChange,
  onTimeChange,
}: IReminderChoiceProps) => (
  <SeventySevenCard gap="$3" borderColor={isEnabled ? '$primary' : '$borderColor'}>
    <SeventySevenFormCheckbox label={label} checked={isEnabled} onCheckedChange={onEnabledChange} />
    <SeventySevenText color="$textSecondary">{description}</SeventySevenText>
    {isEnabled ? (
      <ReminderTimePicker label={`${label} time`} value={time} onValueChange={onTimeChange} />
    ) : null}
  </SeventySevenCard>
);

interface IJourneySetupScreenProps {
  userId: string;
}

export const JourneySetupScreen = ({ userId }: IJourneySetupScreenProps) => {
  const [hasRestoredSetup, setHasRestoredSetup] = useState(false);
  const [lastSavedChanges, setLastSavedChanges] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isNavigating = useRef(false);
  const [isNavigatingStep, setIsNavigatingStep] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();
  const scrollRef = useRef<NativeScrollView>(null);
  const [currentStep, setCurrentStep] = useState<TSetupScreenStep>(JourneySetupStep.Commitment);
  const [selectedPractices, setSelectedPractices] = useState<readonly TOptionalPracticeId[]>([]);
  const [bibleVersionId, setBibleVersionId] = useState<TBibleVersionId | null>(null);
  const [motivation, setMotivation] = useState('');
  const [hasMorningReminder, setHasMorningReminder] = useState(false);
  const [hasEveningReminder, setHasEveningReminder] = useState(false);
  const [morningTime, setMorningTime] = useState('07:00');
  const [eveningTime, setEveningTime] = useState('20:00');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAwaitingJourney, setIsAwaitingJourney] = useState(false);
  const [hasStartConflict, setHasStartConflict] = useState(false);
  const [previewJourney, setPreviewJourney] = useState<TTodayJourney | null>(null);
  const startOperationId = useRef<string | null>(null);
  const isStartPending = useRef(false);
  const [reviewDate, setReviewDate] = useState(new Date());
  const [hasDateChanged, setHasDateChanged] = useState(false);

  const persistence = useJourneySetupPersistence(userId, ({ draft, devicePreferences }) => {
    setCurrentStep(draft?.currentStep ?? JourneySetupStep.Commitment);
    setSelectedPractices(draft?.choices.optionalPracticeIds ?? []);
    setBibleVersionId(draft?.choices.bibleVersionId ?? null);
    setMotivation(draft?.startingMotivation?.text ?? '');
    setHasMorningReminder(devicePreferences?.morningReminder.isEnabled ?? false);
    setHasEveningReminder(devicePreferences?.eveningReflectionReminder.isEnabled ?? false);
    setMorningTime(devicePreferences?.morningReminder.localTime ?? '07:00');
    setEveningTime(devicePreferences?.eveningReflectionReminder.localTime ?? '20:00');
    setIsEditingReview(false);
    startOperationId.current = null;
    setHasStartConflict(false);
    setValidationMessage(null);
    setLastSavedChanges(null);
    setHasRestoredSetup(true);
  });

  const stepIndex = setupSteps.findIndex((step) => step.id === currentStep);
  const step = setupSteps[stepIndex];
  const selectedTranslation = Object.values(BibleVersion).find(
    (translation) => translation.bibleVersionId === bibleVersionId,
  );
  const selectedPracticeNames = setupPractices
    .filter((practice) =>
      selectedPractices.some((practiceId) => practiceId === practice.practiceId),
    )
    .map((practice) => practice.name);
  const isOptionalStep =
    currentStep === JourneySetupStep.Motivation || currentStep === JourneySetupStep.Reminders;
  const hasValidReminders =
    (!hasMorningReminder || isValidReminderTime(morningTime)) &&
    (!hasEveningReminder || isValidReminderTime(eveningTime));
  const hasCombinedReminder =
    hasMorningReminder && hasEveningReminder && morningTime === eveningTime && hasValidReminders;
  const reminderSummary = hasCombinedReminder
    ? `Combined reminder at ${formatReminderTime(morningTime)}`
    : [
        hasMorningReminder ? `Morning at ${formatReminderTime(morningTime)}` : null,
        hasEveningReminder ? `Evening at ${formatReminderTime(eveningTime)}` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'Off';
  const hasValidPractices = selectedPractices.length >= 2 && selectedPractices.length <= 4;
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
      const currentTimeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

  const handlePracticeChange = (practiceId: TOptionalPracticeId, isSelected: boolean) => {
    setSelectedPractices((previousSelection) => {
      if (!isSelected) {
        return previousSelection.filter((selectedId) => selectedId !== practiceId);
      }
      if (
        previousSelection.some((selectedId) => selectedId === practiceId) ||
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
    eveningReflectionReminder: getReminderPreference(hasEveningReminder, eveningTime),
  });

  const saveChanges = async (changes: TJourneySetupChanges): Promise<boolean> => {
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
    changesError = error instanceof Error ? error.message : 'Review your choices before saving.';
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

  const handleSave = async (nextStep: TSetupScreenStep, shouldSkip = false): Promise<boolean> => {
    if (isNavigating.current || persistence.isSaving || persistence.hasConflict) return false;
    isNavigating.current = true;
    setIsNavigatingStep(true);
    try {
      const nextChanges = getChanges(nextStep);
      if (shouldSkip && currentStep === JourneySetupStep.Motivation) nextChanges.motivation = '';
      if (shouldSkip && currentStep === JourneySetupStep.Reminders) {
        nextChanges.morningReminder = getReminderPreference(false, morningTime);
        nextChanges.eveningReflectionReminder = getReminderPreference(false, eveningTime);
      }
      const didSave = await saveChanges(nextChanges);
      if (!didSave) return false;
      if (shouldSkip && currentStep === JourneySetupStep.Motivation) setMotivation('');
      if (shouldSkip && currentStep === JourneySetupStep.Reminders) {
        setHasMorningReminder(false);
        setHasEveningReminder(false);
      }
      setCurrentStep(nextStep);
      setIsEditingReview(false);
      return true;
    } catch (error) {
      setValidationMessage(
        error instanceof Error ? error.message : 'Review your choices before saving.',
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
        const reviewedStartDate = getJourneyCalendarDate(reviewDate, timeZoneId);
        const didSave = await handleSave(currentStep);
        if (!didSave) return;
        const expectedSetupRevision = persistence.getDraftRevision();
        if (expectedSetupRevision === null) return;
        startOperationId.current ??= doc(
          collection(db, 'users', userId, 'journeyStartOperations'),
        ).id;
        const startJourney = httpsCallable<IStartJourneyRequest, TStartJourneyResult>(
          getFunctions(app),
          'startJourney',
        );
        const { data: result } = await startJourney({
          operationId: startOperationId.current,
          setupDraftId: 'current',
          expectedSetupRevision,
          review: { observedPhoneTimeZoneId: timeZoneId, reviewedStartDate },
        });
        if (result.outcome === 'ReviewChanged') {
          setReviewDate(new Date(`${result.review.reviewedStartDate}T12:00:00`));
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
        const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
        console.warn('Journey start could not be confirmed.', { errorCode });
        const reason =
          error instanceof FirebaseError &&
          'details' in error &&
          typeof error.details === 'object' &&
          error.details !== null &&
          'reason' in error.details
            ? error.details.reason
            : null;
        // Temporarily allow Today design work without creating an unprepared journey.
        if (__DEV__ && reason === 'ContentUnavailable') {
          const choices = getSetupChoices(selectedPractices, bibleVersionId);
          if (choices.readiness === 'ReadyForReview') {
            setPreviewJourney({
              startDate: getJourneyCalendarDate(new Date(), timeZoneId),
              state: { status: 'Active' },
              initialOptionalPracticeIds: choices.optionalPracticeIds,
              startingMotivation: motivation.trim() ? { text: motivation.trim() } : null,
            });
            return;
          }
        }
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
                  : errorCode === 'functions/not-found' || errorCode === 'functions/internal'
                    ? 'Starting your journey is temporarily unavailable. Your setup is saved. Please try again later.'
                    : 'We couldn’t confirm that your journey started. Your setup is saved. Please try Start my journey again shortly.',
        );
      } finally {
        isStartPending.current = false;
        setIsStarting(false);
      }
      return;
    }
    await handleSave(isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex + 1].id);
  };

  const handleBack = async () => {
    await handleSave(isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex - 1].id);
  };

  const handleSkip = async () => {
    await handleSave(
      isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex + 1].id,
      true,
    );
  };

  const handleEdit = async (setupStep: TSetupScreenStep) => {
    const didSave = await handleSave(setupStep);
    if (didSave) setIsEditingReview(true);
  };

  const handleRetry = async () => {
    await handleSave(currentStep);
  };

  const handleExitPreview = () => {
    setPreviewJourney(null);
  };

  if (__DEV__ && previewJourney) {
    return (
      <JourneyPreviewTabs
        userId={userId}
        previewJourney={previewJourney}
        onExitPreview={handleExitPreview}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NativeScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack
          pt={safeAreaInsets.top + 24}
          pb={safeAreaInsets.bottom + 32}
          pl={safeAreaInsets.left + 24}
          pr={safeAreaInsets.right + 24}
        >
          <YStack width="100%" maxW={640} self="center" gap="$5">
            <XStack justify="space-between" items="center" gap="$3">
              <SeventySevenText bold color="$primary">
                77Faithful
              </SeventySevenText>
              <SeventySevenText color="$textSecondary">Journey setup</SeventySevenText>
            </XStack>
            {persistence.errorMessage || validationMessage || changesError ? (
              <YStack gap="$2">
                <SeventySevenText role="alert" color="$error">
                  {persistence.errorMessage ?? validationMessage ?? changesError}
                </SeventySevenText>
                {persistence.hasConflict || hasStartConflict || !hasRestoredSetup ? (
                  <SeventySevenButton onPress={persistence.reload} disabled={persistence.isLoading}>
                    {persistence.hasConflict || hasStartConflict ? 'Load saved setup' : 'Try again'}
                  </SeventySevenButton>
                ) : persistence.errorMessage ? (
                  <SeventySevenButton onPress={handleRetry} disabled={persistence.isSaving}>
                    Try saving again
                  </SeventySevenButton>
                ) : null}
              </YStack>
            ) : null}
            {persistence.isLoading ? (
              <Spinner accessibilityLabel="Loading your setup" />
            ) : !hasRestoredSetup ? null : (
              <YStack
                gap="$3"
                pointerEvents={
                  isNavigatingStep || isStarting || isAwaitingJourney ? 'none' : 'auto'
                }
              >
                <SeventySevenText role="status" color="$textSecondary">
                  {persistence.isSaving
                    ? 'Saving…'
                    : hasUnsavedChanges
                      ? 'Changes not yet saved'
                      : 'Saved to your account'}
                </SeventySevenText>
                <SeventySevenStepper
                  currentStep={stepIndex + 1}
                  totalSteps={setupSteps.length}
                  stepTitle={step.title}
                  stepDescription={step.description}
                  isOptional={isOptionalStep}
                  isContinueDisabled={isContinueDisabled}
                  onContinue={handleContinue}
                  onBack={stepIndex > 0 ? handleBack : undefined}
                  onSkip={isOptionalStep ? handleSkip : undefined}
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
                  {currentStep === JourneySetupStep.Commitment ? (
                    <YStack gap="$4">
                      <SeventySevenCard gap="$3">
                        <SeventySevenText size="HeadingSmall">
                          Five to seven practices, each day
                        </SeventySevenText>
                        <SeventySevenText bold>Read Scripture · Pray · Reflect</SeventySevenText>
                        <SeventySevenText>
                          Engage with the assigned Bible passage, spend time with God in prayer, and
                          reflect on your response to Him. Writing is optional.
                        </SeventySevenText>
                        <Separator />
                        <SeventySevenText>
                          You’ll choose two to four more practices that fit your circumstances.
                        </SeventySevenText>
                      </SeventySevenCard>
                      <SeventySevenText>
                        <SeventySevenText bold>
                          77 calendar days, not 77 perfect days.
                        </SeventySevenText>{' '}
                        Missed days stay in your history. The calendar continues, and you do not
                        need to restart.
                      </SeventySevenText>
                      <SeventySevenText>
                        These practices do not earn God’s favor, but they help you spend time with
                        Him and respond to His Word.
                      </SeventySevenText>
                      <SeventySevenText>
                        Eleven weekly themes guide these 77 days, from abiding in Christ to
                        persevering in faith.
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        77Faithful is free and always will be. Your motivation and reflections are
                        private.
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.Practices ? (
                    <YStack gap="$3">
                      <SeventySevenCard gap="$2">
                        <SeventySevenText bold>Foundational Practices</SeventySevenText>
                        <SeventySevenText>Read Scripture · Pray · Reflect</SeventySevenText>
                      </SeventySevenCard>
                      <SeventySevenText bold role="status">
                        {selectedPractices.length} selected · Choose 2–4
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        {selectedPractices.length >= 4
                          ? 'To choose a different practice, deselect one first.'
                          : hasValidPractices
                            ? 'You can continue or choose up to four practices.'
                            : 'Choose at least two different practices to continue.'}
                      </SeventySevenText>
                      {setupPractices.map((practice) => {
                        const isSelected = selectedPractices.some(
                          (practiceId) => practiceId === practice.practiceId,
                        );
                        return (
                          <SeventySevenDropdown
                            key={practice.practiceId}
                            label={practice.name}
                            isSelected={isSelected}
                            header={
                              <SeventySevenFormCheckbox
                                label={practice.name}
                                checked={isSelected}
                                disabled={!isSelected && selectedPractices.length >= 4}
                                onCheckedChange={(isChecked) =>
                                  handlePracticeChange(practice.practiceId, isChecked)
                                }
                              />
                            }
                          >
                            <SeventySevenText>{practice.purpose}</SeventySevenText>
                            <SeventySevenText color="$textSecondary">
                              {practice.examples.join(' ')}
                            </SeventySevenText>
                            <SeventySevenText color="$textSecondary" fontSize="$3">
                              {practice.boundaries}
                            </SeventySevenText>
                          </SeventySevenDropdown>
                        );
                      })}
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.BibleVersion ? (
                    <YStack gap="$3">
                      <SeventySevenFormRadioGroup
                        label="Bible translation"
                        value={bibleVersionId ?? ''}
                        onValueChange={handleTranslationChange}
                      >
                        {Object.values(BibleVersion).map((translation) => (
                          <SeventySevenCard
                            key={translation.bibleVersionId}
                            borderColor={
                              bibleVersionId === translation.bibleVersionId
                                ? '$primary'
                                : '$borderColor'
                            }
                          >
                            <SeventySevenFormRadioButton
                              label={`${translation.name} (${translation.abbreviation})`}
                              value={translation.bibleVersionId}
                            />
                          </SeventySevenCard>
                        ))}
                      </SeventySevenFormRadioGroup>
                      {!bibleVersionId ? (
                        <SeventySevenText color="$textSecondary">
                          Choose a translation to continue.
                        </SeventySevenText>
                      ) : null}
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.Motivation ? (
                    <YStack gap="$3">
                      <SeventySevenFormTextInput
                        label="Starting motivation (optional)"
                        placeholder="What are you hoping to grow in as you spend time with Jesus?"
                        isLongForm
                        maxLength={10000}
                        value={motivation}
                        onChangeText={setMotivation}
                      />
                      <SeventySevenText color="$textSecondary">
                        This is a private reflection, not a vow or a promise of a particular
                        outcome. You can revisit, edit, or delete it later.
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.Reminders ? (
                    <YStack gap="$3">
                      <ReminderChoice
                        label="Morning reminder"
                        description="Make time for Scripture and prayer."
                        isEnabled={hasMorningReminder}
                        time={morningTime}
                        onEnabledChange={setHasMorningReminder}
                        onTimeChange={setMorningTime}
                      />
                      <ReminderChoice
                        label="Evening reflection reminder"
                        description="Take a moment to reflect on your day."
                        isEnabled={hasEveningReminder}
                        time={eveningTime}
                        onEnabledChange={setHasEveningReminder}
                        onTimeChange={setEveningTime}
                      />
                      {hasCombinedReminder ? (
                        <SeventySevenCard bg="$infoSurface">
                          <SeventySevenText>
                            Both times match. One combined reminder would invite you to read, pray,
                            and reflect.
                          </SeventySevenText>
                        </SeventySevenCard>
                      ) : null}
                      <SeventySevenText color="$textSecondary">
                        Times follow this phone’s local clock, even when you travel. Choose times
                        that suit your day; they are not deadlines. You can change them later in
                        Settings.
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        Your preferences are saved for this device. Notifications are not scheduled
                        yet.
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.WeeklyThemes ? (
                    <YStack gap="$4">
                      <SeventySevenCard gap="$3">
                        <SeventySevenText size="HeadingSmall">
                          Eleven weeks of following Jesus
                        </SeventySevenText>
                        {weeklyThemes.map((theme, index) => (
                          <XStack key={theme} gap="$3">
                            <SeventySevenText color="$textSecondary" minW={65}>
                              Week {index + 1}
                            </SeventySevenText>
                            <SeventySevenText flex={1}>{theme}</SeventySevenText>
                          </XStack>
                        ))}
                      </SeventySevenCard>
                      <SeventySevenText>
                        These themes guide your time with God; they do not measure your spiritual
                        maturity. Keep returning to the practices as each new week begins.
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        Day 77 is a time to reflect and give thanks. Following Jesus continues
                        beyond these 77 days.
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                  {currentStep === JourneySetupStep.Review ? (
                    <YStack gap="$3">
                      {hasDateChanged ? (
                        <SeventySevenText role="status" color="$infoText">
                          Your local date or time zone changed. Review the dates before continuing.
                        </SeventySevenText>
                      ) : null}
                      <SeventySevenCard gap="$2" bg="$infoSurface">
                        <SeventySevenText bold>
                          Day 1 · {formatJourneyDate(reviewDate)}
                        </SeventySevenText>
                        <SeventySevenText bold>
                          Day 77 · {formatJourneyDate(finalDate)}
                        </SeventySevenText>
                      </SeventySevenCard>
                      <SeventySevenCard>
                        <ReviewRow
                          label={`${selectedPractices.length + 3} daily practices`}
                          value={[
                            'Read Scripture',
                            'Pray',
                            'Reflect',
                            ...selectedPracticeNames,
                          ].join('\n')}
                          onChange={() => handleEdit(JourneySetupStep.Practices)}
                        />
                        <Separator />
                        <ReviewRow
                          label="Bible translation"
                          value={
                            selectedTranslation
                              ? `${selectedTranslation.name} (${selectedTranslation.abbreviation})`
                              : 'Not selected'
                          }
                          onChange={() => handleEdit(JourneySetupStep.BibleVersion)}
                        />
                        <Separator />
                        <ReviewRow
                          label="Starting motivation"
                          value={motivation.trim() || 'Not provided'}
                          onChange={() => handleEdit(JourneySetupStep.Motivation)}
                        />
                        <Separator />
                        <ReviewRow
                          label="Reminder choices"
                          value={reminderSummary}
                          onChange={() => handleEdit(JourneySetupStep.Reminders)}
                        />
                      </SeventySevenCard>
                      <SeventySevenText>
                        Days continue after an absence. Your earlier record remains, and you do not
                        need to restart. You can change your Chosen Practices for the next journey
                        day.
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        Your choices are saved. Select Start my journey to begin Day 1 today. Your
                        77 days begin once the start is confirmed.
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                </SeventySevenStepper>
              </YStack>
            )}
          </YStack>
        </YStack>
      </NativeScrollView>
    </KeyboardAvoidingView>
  );
};
