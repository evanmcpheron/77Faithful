import type { ReactNode } from 'react';
import { Progress, XStack, YStack } from 'tamagui';

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
    <YStack width="100%" gap="$section">
      <YStack gap="$inline">
        <XStack items="center" justify="space-between" flexWrap="wrap" gap="$inline">
          <SeventySevenText color="$textSecondary" size="Metadata">
            {progressLabel}
          </SeventySevenText>
          {isOptional ? (
            <SeventySevenText color="$textSecondary" size="Metadata">
              Optional
            </SeventySevenText>
          ) : null}
        </XStack>

        <Progress
          width="100%"
          value={progressValue}
          max={100}
          height="$space.micro"
          bg="$surfaceSubtle"
          aria-label={progressLabel}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep}
        >
          <Progress.Indicator bg="$link" />
        </Progress>
      </YStack>

      <YStack gap="$related">
        <SeventySevenText size={SeventySevenTextSize.Heading} role="heading" aria-level={1}>
          {stepTitle}
        </SeventySevenText>
        {stepDescription ? (
          <SeventySevenText color="$textSecondary">{stepDescription}</SeventySevenText>
        ) : null}
      </YStack>

      {children}

      <YStack gap="$related" pt="$related">
        <SeventySevenButton
          width="100%"
          disabled={isContinueDisabled}
          aria-disabled={isContinueDisabled}
          onPress={onContinue}
        >
          {primaryActionLabel}
        </SeventySevenButton>

        {isOptional && onSkip ? (
          <SeventySevenButton appearance="Text" onPress={onSkip} aria-label={`Skip ${stepTitle}`}>
            Skip for now
          </SeventySevenButton>
        ) : null}

        {onBack ? (
          <SeventySevenButton appearance="Text" onPress={onBack} aria-label="Go to previous step">
            Back
          </SeventySevenButton>
        ) : null}
      </YStack>
    </YStack>
  );
};
