import { useLocalSearchParams } from 'expo-router';

import { SeventySevenText } from '@77/components/core';
import { DayPracticeRoute } from '@77/features/journey/day-practice-screen.component';
import { setupPractices } from '@77/features/journey-setup/journey-setup-content';

const ChosenPracticeScreen = () => {
  const { practiceId } = useLocalSearchParams<{ practiceId: string }>();
  const practice = setupPractices.find((practice) => practice.practiceId === practiceId);
  return practice ? (
    <DayPracticeRoute practiceId={practice.practiceId} />
  ) : (
    <SeventySevenText>This practice isn’t available.</SeventySevenText>
  );
};

export default ChosenPracticeScreen;
