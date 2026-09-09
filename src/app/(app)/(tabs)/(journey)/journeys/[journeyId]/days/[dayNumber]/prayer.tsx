import { useLocalSearchParams } from 'expo-router';

import { SeventySevenPage } from '@77/components/core/seventy-seven-page.component';

import { SeventySevenScreenPlaceholder, SeventySevenText } from '@77/components/core';
import { DailyPrayerContent } from '@77/features/journey/daily-practice-content.component';
import { getProvisionalDayContent } from '@77/features/journey/provisional-day-content';

const PrayerScreen = () => {
  const { dayNumber } = useLocalSearchParams<{ dayNumber: string }>();
  const draftContent = __DEV__ ? getProvisionalDayContent(Number(dayNumber)) : null;

  if (!draftContent) return <SeventySevenScreenPlaceholder title="Prayer" />;

  return (
    <SeventySevenPage title="Pray">
      <SeventySevenText color="$textSecondary">
        Draft content for testing · Day {draftContent.dayNumber} · {draftContent.passage}
      </SeventySevenText>
      <DailyPrayerContent
        prayerPrompt={draftContent.prayerPrompt}
        writtenPrayer={draftContent.writtenPrayer}
      />
    </SeventySevenPage>
  );
};

export default PrayerScreen;
