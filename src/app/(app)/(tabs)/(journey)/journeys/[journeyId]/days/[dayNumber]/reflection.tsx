import { useLocalSearchParams } from 'expo-router';

import { SeventySevenPage } from '@77/components/core/seventy-seven-page.component';

import { SeventySevenScreenPlaceholder, SeventySevenText } from '@77/components/core';
import { DailyReflectionContent } from '@77/features/journey/daily-practice-content.component';
import { getProvisionalDayContent } from '@77/features/journey/provisional-day-content';

const ReflectionScreen = () => {
  const { dayNumber } = useLocalSearchParams<{ dayNumber: string }>();
  const draftContent = __DEV__ ? getProvisionalDayContent(Number(dayNumber)) : null;

  if (!draftContent) return <SeventySevenScreenPlaceholder title="Reflection" />;

  return (
    <SeventySevenPage title="Reflect">
      <SeventySevenText color="$textSecondary">
        Draft content for testing · Day {draftContent.dayNumber} · {draftContent.passage}
      </SeventySevenText>
      <DailyReflectionContent reflectionQuestion={draftContent.reflectionQuestion} />
    </SeventySevenPage>
  );
};

export default ReflectionScreen;
