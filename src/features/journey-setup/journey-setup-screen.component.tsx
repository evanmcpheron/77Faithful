import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView as NativeScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Separator, XStack, YStack } from 'tamagui';

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
import { ReminderTimePicker, formatReminderTime } from './reminder-time-picker.component';

const SetupScreenStep = { ...JourneySetupStep, WeeklyThemes: 'WeeklyThemes' } as const;
type TSetupScreenStep = (typeof SetupScreenStep)[keyof typeof SetupScreenStep];

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
    id: SetupScreenStep.WeeklyThemes,
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

const isValidReminderTime = (time: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

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

export const JourneySetupScreen = () => {
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
  const [isPreviewComplete, setIsPreviewComplete] = useState(false);
  const [reviewDate, setReviewDate] = useState(new Date());
  const [hasDateChanged, setHasDateChanged] = useState(false);

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
    (currentStep === JourneySetupStep.Practices && !hasValidPractices) ||
    (currentStep === JourneySetupStep.BibleVersion && !bibleVersionId) ||
    (currentStep === JourneySetupStep.Reminders && !hasValidReminders) ||
    (currentStep === JourneySetupStep.Review &&
      (!hasValidPractices || !bibleVersionId || !hasValidReminders));
  const finalDate = new Date(reviewDate);
  finalDate.setDate(reviewDate.getDate() + 76);
  const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneName = timeZoneId.split('/').pop()?.replaceAll('_', ' ') ?? timeZoneId;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentStep, isPreviewComplete]);

  useEffect(() => {
    if (currentStep !== JourneySetupStep.Review) return;
    const refreshDate = () => {
      const now = new Date();
      if (reviewDate.toDateString() !== now.toDateString()) {
        setHasDateChanged(true);
        setReviewDate(now);
      }
    };
    refreshDate();
    const intervalId = setInterval(refreshDate, 1000);
    return () => clearInterval(intervalId);
  }, [currentStep, reviewDate]);

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

  const handleContinue = () => {
    if (isContinueDisabled) return;
    if (currentStep === JourneySetupStep.Review) {
      const now = new Date();
      if (reviewDate.toDateString() !== now.toDateString()) {
        setReviewDate(now);
        setHasDateChanged(true);
        return;
      }
      setIsPreviewComplete(true);
      return;
    }
    setCurrentStep(isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex + 1].id);
    setIsEditingReview(false);
  };

  const handleBack = () => {
    setCurrentStep(isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex - 1].id);
    setIsEditingReview(false);
  };

  const handleSkip = () => {
    if (currentStep === JourneySetupStep.Motivation) setMotivation('');
    if (currentStep === JourneySetupStep.Reminders) {
      setHasMorningReminder(false);
      setHasEveningReminder(false);
    }
    setCurrentStep(isEditingReview ? JourneySetupStep.Review : setupSteps[stepIndex + 1].id);
    setIsEditingReview(false);
  };

  const handleEdit = (setupStep: TSetupScreenStep) => {
    setIsEditingReview(true);
    setCurrentStep(setupStep);
  };

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
            {isPreviewComplete ? (
              <YStack gap="$4">
                <SeventySevenText size="Heading" role="heading">
                  Your setup preview is complete
                </SeventySevenText>
                <SeventySevenText>
                  You’ve reviewed your daily practices and your 77 days. This preview has not
                  started Day 1 or saved choices to your account.
                </SeventySevenText>
                <SeventySevenButton onPress={() => setIsPreviewComplete(false)}>
                  Return to review
                </SeventySevenButton>
              </YStack>
            ) : (
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
                    ? 'Start my journey'
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
                      Missed days stay in your history. The calendar continues, and you do not need
                      to restart.
                    </SeventySevenText>
                    <SeventySevenText>
                      These practices do not earn God’s favor, but they help you spend time with Him
                      and respond to His Word.
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
                    <SeventySevenText color="$textSecondary">
                      These are sample choices from the planned catalog for this preview. Reading
                      availability has not yet been confirmed.
                    </SeventySevenText>
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
                      value={motivation}
                      onChangeText={setMotivation}
                    />
                    <SeventySevenText color="$textSecondary">
                      This is a private reflection, not a vow or a promise of a particular outcome.
                      You can revisit, edit, or delete it later.
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
                      Times follow this phone’s local clock, even when you travel. Choose times that
                      suit your day; they are not deadlines. You can change them later in Settings.
                    </SeventySevenText>
                    <SeventySevenText color="$textSecondary">
                      Reminders are not scheduled in this preview, and phone permission is not
                      requested.
                    </SeventySevenText>
                  </YStack>
                ) : null}
                {currentStep === SetupScreenStep.WeeklyThemes ? (
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
                      Day 77 is a time to reflect and give thanks. Following Jesus continues beyond
                      these 77 days.
                    </SeventySevenText>
                  </YStack>
                ) : null}
                {currentStep === JourneySetupStep.Review ? (
                  <YStack gap="$3">
                    {hasDateChanged ? (
                      <SeventySevenText role="status" color="$infoText">
                        The date has changed. Review the updated dates before continuing.
                      </SeventySevenText>
                    ) : null}
                    <SeventySevenCard gap="$2" bg="$infoSurface">
                      <SeventySevenText bold>
                        Day 1 · {formatJourneyDate(reviewDate)}
                      </SeventySevenText>
                      <SeventySevenText bold>
                        Day 77 · {formatJourneyDate(finalDate)}
                      </SeventySevenText>
                      <SeventySevenText>
                        {timeZoneName} time · {timeZoneId}
                      </SeventySevenText>
                      <SeventySevenText color="$textSecondary">
                        Starting fixes your journey to this time zone. Its dates will not shift when
                        you travel.
                      </SeventySevenText>
                    </SeventySevenCard>
                    <SeventySevenCard>
                      <ReviewRow
                        label={`${selectedPractices.length + 3} daily practices`}
                        value={['Read Scripture', 'Pray', 'Reflect', ...selectedPracticeNames].join(
                          '\n',
                        )}
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
                      In this preview, Start my journey only completes the walkthrough. No calendar
                      begins.
                    </SeventySevenText>
                  </YStack>
                ) : null}
              </SeventySevenStepper>
            )}
          </YStack>
        </YStack>
      </NativeScrollView>
    </KeyboardAvoidingView>
  );
};
