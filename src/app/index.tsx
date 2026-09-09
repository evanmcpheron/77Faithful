import { StatusBar } from 'expo-status-bar';
import { ScrollView, YStack } from 'tamagui';

import {
  SeventySevenText,
  SeventySevenTextAlignment,
  SeventySevenTextSize,
} from '@77/components/core';
import { OnboardingStepperDemo } from '@77/features/onboarding/onboarding-stepper-demo.component';

export default function HomeScreen() {
  return (
    <ScrollView flex={1} bg="$background">
      <YStack width="100%" maxW={600} self="center" gap="$7" px="$5" py="$8">
        <YStack gap="$2">
          <SeventySevenText
            size={SeventySevenTextSize.HeadingLarge}
            alignment={SeventySevenTextAlignment.Center}
          >
            Begin your journey
          </SeventySevenText>
          <SeventySevenText alignment={SeventySevenTextAlignment.Center} color="$color10">
            A calm, guided setup for 77Faithful.
          </SeventySevenText>
        </YStack>

        <OnboardingStepperDemo />

        <StatusBar style="auto" />
      </YStack>
    </ScrollView>
  );
}
