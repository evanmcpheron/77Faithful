import type { ReactNode } from 'react';
import { Button, Progress, XStack, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText, SeventySevenTextSize } from '@77/components/core';

interface ISeventySevenStepperProps {
  children: ReactNode;
  currentStep: number;
  isContinueDisabled?: boolean;
  isOptional?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  primaryActionLabel?: string;
  stepDescription?: string;
  stepTitle: string;
  totalSteps: number;
}

export const SeventySevenStepper = ({
  children,
  currentStep,
  isContinueDisabled = false,
  isOptional = false,
  onBack,
  onContinue,
  onSkip,
  primaryActionLabel = 'Continue',
  stepDescription,
  stepTitle,
  totalSteps,
}: ISeventySevenStepperProps) => {
  const progressValue = (currentStep / totalSteps) * 100;
  const progressLabel = `Step ${currentStep} of ${totalSteps}`;

  return (
    <YStack width="100%" gap="$6">
      <YStack gap="$3">
        <XStack items="center" justify="space-between" gap="$3">
          <SeventySevenText color="$textSecondary" bold>
            {progressLabel}
          </SeventySevenText>
          {isOptional ? <SeventySevenText color="$textSecondary">Optional</SeventySevenText> : null}
        </XStack>

        <Progress
          width="100%"
          value={progressValue}
          max={100}
          height="$0.75"
          bg="$surfaceSubtle"
          accessibilityLabel={progressLabel}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
        >
          <Progress.Indicator bg="$primary" />
        </Progress>
      </YStack>

      <YStack gap="$2">
        <SeventySevenText size={SeventySevenTextSize.Heading} accessibilityRole="header">
          {stepTitle}
        </SeventySevenText>
        {stepDescription ? (
          <SeventySevenText color="$textSecondary">{stepDescription}</SeventySevenText>
        ) : null}
      </YStack>

      {children}

      <YStack gap="$2.5" pt="$2">
        <SeventySevenButton
          width="100%"
          disabled={isContinueDisabled}
          onPress={onContinue}
          accessibilityHint={
            currentStep < totalSteps ? `Moves to step ${currentStep + 1}` : undefined
          }
        >
          {primaryActionLabel}
        </SeventySevenButton>

        {isOptional && onSkip ? (
          <Button chromeless minH="$5" onPress={onSkip} accessibilityLabel={`Skip ${stepTitle}`}>
            <SeventySevenText bold>Skip for now</SeventySevenText>
          </Button>
        ) : null}

        {onBack ? (
          <Button chromeless minH="$5" onPress={onBack} accessibilityLabel="Go to previous step">
            <SeventySevenText color="$textSecondary">Back</SeventySevenText>
          </Button>
        ) : null}
      </YStack>
    </YStack>
  );
};
