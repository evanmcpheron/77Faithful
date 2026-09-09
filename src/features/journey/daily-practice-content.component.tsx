import { YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';
import type { IFormationDayContentDocument } from '@77/types/formation/formation-course.types';

type TDailyPrayerContentProps = Pick<
  IFormationDayContentDocument,
  'prayerPrompt' | 'writtenPrayer'
>;

export const DailyPrayerContent = ({ prayerPrompt, writtenPrayer }: TDailyPrayerContentProps) => (
  <YStack gap="$3">
    <SeventySevenText bold>Prayer prompt</SeventySevenText>
    <SeventySevenText>{prayerPrompt}</SeventySevenText>
    <SeventySevenText bold>A prayer you can use</SeventySevenText>
    <SeventySevenText>{writtenPrayer}</SeventySevenText>
  </YStack>
);

type TDailyReflectionContentProps = Pick<IFormationDayContentDocument, 'reflectionQuestion'>;

export const DailyReflectionContent = ({ reflectionQuestion }: TDailyReflectionContentProps) => (
  <YStack gap="$2">
    <SeventySevenText>{reflectionQuestion}</SeventySevenText>
    <SeventySevenText color="$textSecondary">
      Take a moment to consider your response and bring it to God.
    </SeventySevenText>
  </YStack>
);
