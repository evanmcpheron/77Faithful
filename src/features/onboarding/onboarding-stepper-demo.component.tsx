import { useState } from 'react';
import { Button, Separator, XStack, YStack } from 'tamagui';

import { SeventySevenStepper } from '@77/components/navigation';
import {
  SeventySevenFormCheckbox,
  SeventySevenFormRadioButton,
  SeventySevenFormRadioGroup,
  SeventySevenFormTextInput,
  SeventySevenFormTextInputType,
} from '@77/components/form';
import { SeventySevenText, SeventySevenTextSize } from '@77/components/core';
import { SeventySevenCard } from '@77/surface';

const OnboardingStep = {
  Commitment: 1,
  Account: 2,
  Practices: 3,
  Translation: 4,
  Motivation: 5,
  Reminders: 6,
  Review: 7,
} as const;

const optionalPractices = [
  {
    id: 'service',
    name: 'Serve someone',
    description: 'Offer practical help or thoughtful attention to another person.',
  },
  {
    id: 'encouragement',
    name: 'Encourage someone',
    description: 'Share honest words that strengthen or comfort another person.',
  },
  {
    id: 'memorization',
    name: 'Remember Scripture',
    description: 'Spend time learning a verse or short passage.',
  },
  {
    id: 'movement',
    name: 'Move with gratitude',
    description: 'Choose movement that is safe and suitable for your body today.',
  },
] as const;

const translations = [
  { abbreviation: 'WEB', name: 'World English Bible' },
  { abbreviation: 'KJV', name: 'King James Version' },
] as const;

const formatJourneyDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

interface IReviewRowProps {
  label: string;
  onChange?: () => void;
  value: string;
}

const ReviewRow = ({ label, onChange, value }: IReviewRowProps) => {
  return (
    <XStack items="flex-start" justify="space-between" gap="$4" py="$3">
      <YStack flex={1} gap="$1">
        <SeventySevenText color="$textSecondary">{label}</SeventySevenText>
        <SeventySevenText bold>{value}</SeventySevenText>
      </YStack>
      {onChange ? (
        <Button chromeless size="$3" onPress={onChange} accessibilityLabel={`Change ${label}`}>
          <SeventySevenText color="$link" bold>
            Change
          </SeventySevenText>
        </Button>
      ) : null}
    </XStack>
  );
};

export const OnboardingStepperDemo = () => {
  const [currentStep, setCurrentStep] = useState<number>(OnboardingStep.Commitment);
  const [emailAddress, setEmailAddress] = useState('alex@example.com');
  const [password, setPassword] = useState('formation77');
  const [selectedPractices, setSelectedPractices] = useState<string[]>([
    'service',
    'encouragement',
  ]);
  const [selectedTranslation, setSelectedTranslation] = useState('WEB');
  const [motivation, setMotivation] = useState('');
  const [hasMorningReminder, setHasMorningReminder] = useState(false);
  const [hasEveningReminder, setHasEveningReminder] = useState(false);
  const [hasStartedJourney, setHasStartedJourney] = useState(false);

  const selectedPracticeNames = optionalPractices
    .filter((practice) => selectedPractices.includes(practice.id))
    .map((practice) => practice.name);
  const selectedTranslationName = translations.find(
    (translation) => translation.abbreviation === selectedTranslation,
  )?.name;
  const startDate = new Date();
  const finalDate = new Date(startDate);
  finalDate.setDate(startDate.getDate() + 76);

  const handleContinue = () => {
    if (currentStep === OnboardingStep.Review) {
      setHasStartedJourney(true);
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(OnboardingStep.Commitment, step - 1));
  };

  const handlePracticeChange = (practiceId: string, isSelected: boolean) => {
    if (!isSelected) {
      setSelectedPractices((practiceIds) =>
        practiceIds.filter((selectedPracticeId) => selectedPracticeId !== practiceId),
      );
      return;
    }

    if (selectedPractices.length >= 4) {
      return;
    }

    setSelectedPractices((practiceIds) => [...practiceIds, practiceId]);
  };

  const handleRestartDemo = () => {
    setCurrentStep(OnboardingStep.Commitment);
    setHasStartedJourney(false);
  };

  if (hasStartedJourney) {
    return (
      <YStack gap="$6" items="center" py="$8">
        <YStack
          width={72}
          height={72}
          rounded="$10"
          bg="$successSoft"
          items="center"
          justify="center"
        >
          <SeventySevenText size={SeventySevenTextSize.Heading} color="$successStrong">
            1
          </SeventySevenText>
        </YStack>
        <YStack gap="$2" items="center">
          <SeventySevenText size={SeventySevenTextSize.Heading} alignment="Center">
            Your journey begins today
          </SeventySevenText>
          <SeventySevenText color="$textSecondary" alignment="Center">
            Day 1 is ready. Nothing has been marked complete for you.
          </SeventySevenText>
        </YStack>
        <Button chromeless onPress={handleRestartDemo}>
          <SeventySevenText color="$link" bold>
            View the setup again
          </SeventySevenText>
        </Button>
      </YStack>
    );
  }

  const stepTitles = [
    'A faithful rhythm, one day at a time',
    'Keep your journey safe',
    'Choose 2–4 additional practices',
    'Choose your Bible translation',
    'What are you hoping to grow in?',
    'Would reminders help?',
    'Review your journey',
  ];
  const stepDescriptions = [
    'Learn what the 77-day journey asks of you before you decide to begin.',
    'An account lets you return to your private journey and reflections.',
    'These join Scripture, prayer, and reflection as your daily practices.',
    'You can change this later or read the same passage in your own Bible.',
    'This private note is for you to revisit at the end of the journey.',
    'Both reminders are optional and can be changed later in Settings.',
    'Nothing begins until you choose Start my journey.',
  ];
  const isOptionalStep =
    currentStep === OnboardingStep.Motivation || currentStep === OnboardingStep.Reminders;
  const isContinueDisabled =
    (currentStep === OnboardingStep.Account && (!emailAddress || !password)) ||
    (currentStep === OnboardingStep.Practices &&
      (selectedPractices.length < 2 || selectedPractices.length > 4)) ||
    (currentStep === OnboardingStep.Translation && !selectedTranslation);

  return (
    <SeventySevenStepper
      currentStep={currentStep}
      totalSteps={Object.keys(OnboardingStep).length}
      stepTitle={stepTitles[currentStep - 1]}
      stepDescription={stepDescriptions[currentStep - 1]}
      isOptional={isOptionalStep}
      isContinueDisabled={isContinueDisabled}
      onBack={currentStep > OnboardingStep.Commitment ? handleBack : undefined}
      onContinue={handleContinue}
      onSkip={isOptionalStep ? handleContinue : undefined}
      primaryActionLabel={currentStep === OnboardingStep.Review ? 'Start my journey' : 'Continue'}
    >
      {currentStep === OnboardingStep.Commitment ? (
        <YStack gap="$4">
          <SeventySevenCard gap="$3">
            <SeventySevenText bold>Your daily foundation</SeventySevenText>
            <SeventySevenText>Read Scripture · Pray · Reflect</SeventySevenText>
            <SeventySevenText color="$textSecondary">
              You will choose two to four more practices that fit your life.
            </SeventySevenText>
          </SeventySevenCard>
          <YStack gap="$3">
            <SeventySevenText>
              <SeventySevenText bold>77 calendar days.</SeventySevenText> The journey continues
              after a missed day. You never lose your earlier record or return to Day 1.
            </SeventySevenText>
            <SeventySevenText>
              <SeventySevenText bold>Eleven weekly themes.</SeventySevenText> Each week builds a
              simple rhythm around following Jesus.
            </SeventySevenText>
            <SeventySevenText>
              <SeventySevenText bold>Free and private.</SeventySevenText> The app is permanently
              free, and your reflections are not shared with other participants.
            </SeventySevenText>
          </YStack>
        </YStack>
      ) : null}

      {currentStep === OnboardingStep.Account ? (
        <YStack gap="$4">
          <SeventySevenFormTextInput
            label="Email address"
            autoComplete="email"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />
          <SeventySevenFormTextInput
            label="Password"
            autoComplete="new-password"
            type={SeventySevenFormTextInputType.Password}
            value={password}
            onChangeText={setPassword}
          />
          <SeventySevenText color="$textSecondary" fontSize="$3">
            Creating an account does not start Day 1. Confirmed email access will be required in the
            production flow.
          </SeventySevenText>
        </YStack>
      ) : null}

      {currentStep === OnboardingStep.Practices ? (
        <YStack gap="$3">
          <SeventySevenText bold>{selectedPractices.length} selected · Choose 2–4</SeventySevenText>
          {optionalPractices.map((practice) => {
            const isSelected = selectedPractices.includes(practice.id);
            const isDisabled = !isSelected && selectedPractices.length >= 4;

            return (
              <SeventySevenCard key={practice.id} gap="$2" opacity={isDisabled ? 0.55 : 1}>
                <SeventySevenFormCheckbox
                  checked={isSelected}
                  disabled={isDisabled}
                  label={practice.name}
                  onCheckedChange={(nextIsSelected) =>
                    handlePracticeChange(practice.id, nextIsSelected)
                  }
                />
                <SeventySevenText color="$textSecondary" pl="$8">
                  {practice.description}
                </SeventySevenText>
              </SeventySevenCard>
            );
          })}
        </YStack>
      ) : null}

      {currentStep === OnboardingStep.Translation ? (
        <SeventySevenFormRadioGroup
          label="Available translations"
          value={selectedTranslation}
          onValueChange={setSelectedTranslation}
        >
          {translations.map((translation) => (
            <SeventySevenCard key={translation.abbreviation}>
              <SeventySevenFormRadioButton
                label={`${translation.name} (${translation.abbreviation})`}
                value={translation.abbreviation}
              />
            </SeventySevenCard>
          ))}
        </SeventySevenFormRadioGroup>
      ) : null}

      {currentStep === OnboardingStep.Motivation ? (
        <SeventySevenFormTextInput
          label="Starting motivation (optional)"
          placeholder="A sentence or two is enough."
          isLongForm
          value={motivation}
          onChangeText={setMotivation}
        />
      ) : null}

      {currentStep === OnboardingStep.Reminders ? (
        <YStack gap="$3">
          <SeventySevenCard gap="$2">
            <SeventySevenFormCheckbox
              checked={hasMorningReminder}
              label="Morning Scripture reminder"
              onCheckedChange={setHasMorningReminder}
            />
            <SeventySevenText color="$textSecondary" pl="$8">
              Begin the day with the assigned reading.
            </SeventySevenText>
          </SeventySevenCard>
          <SeventySevenCard gap="$2">
            <SeventySevenFormCheckbox
              checked={hasEveningReminder}
              label="Evening reflection reminder"
              onCheckedChange={setHasEveningReminder}
            />
            <SeventySevenText color="$textSecondary" pl="$8">
              Make space to reflect before the day closes.
            </SeventySevenText>
          </SeventySevenCard>
          <SeventySevenText color="$textSecondary" fontSize="$3">
            Phone permission should only be requested after a reminder is enabled.
          </SeventySevenText>
        </YStack>
      ) : null}

      {currentStep === OnboardingStep.Review ? (
        <YStack gap="$3">
          <SeventySevenCard p="$4">
            <ReviewRow
              label={`${selectedPractices.length + 3} daily practices`}
              value={`Read Scripture, Pray, Reflect, ${selectedPracticeNames.join(', ')}`}
              onChange={() => setCurrentStep(OnboardingStep.Practices)}
            />
            <Separator />
            <ReviewRow
              label="Bible translation"
              value={`${selectedTranslationName} (${selectedTranslation})`}
              onChange={() => setCurrentStep(OnboardingStep.Translation)}
            />
            <Separator />
            <ReviewRow
              label="Starting motivation"
              value={motivation || 'Not provided'}
              onChange={() => setCurrentStep(OnboardingStep.Motivation)}
            />
            <Separator />
            <ReviewRow
              label="Reminders"
              value={
                hasMorningReminder || hasEveningReminder
                  ? [hasMorningReminder ? 'Morning' : null, hasEveningReminder ? 'Evening' : null]
                      .filter(Boolean)
                      .join(' and ')
                  : 'Not enabled'
              }
              onChange={() => setCurrentStep(OnboardingStep.Reminders)}
            />
          </SeventySevenCard>

          <SeventySevenCard gap="$2" bg="$infoSurface" borderColor="$borderColor">
            <SeventySevenText bold>
              {formatJourneyDate(startDate)} – {formatJourneyDate(finalDate)}
            </SeventySevenText>
            <SeventySevenText color="$link">
              Day 1 begins when you start. Each day follows your phone’s local date, and the
              calendar continues after an absence.
            </SeventySevenText>
          </SeventySevenCard>
        </YStack>
      ) : null}
    </SeventySevenStepper>
  );
};
