import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { JOURNEY_DAY_COUNT, parseDayNumber } from '@/navigation/day-number';
import { DayNumberContext } from '@/navigation/day-number-context';

export function generateStaticParams(): { dayNumber: string }[] {
  return Array.from({ length: JOURNEY_DAY_COUNT }, (_, index) => ({
    dayNumber: String(index + 1),
  }));
}

export default function DayLayout() {
  const params = useLocalSearchParams<{ dayNumber?: string | string[] }>();
  const dayNumber = parseDayNumber(params.dayNumber);

  if (dayNumber === null) {
    return <Redirect href="/journey" />;
  }

  // Add shared journey access checks here once real state exists, before rendering any day content.
  // Follow the settled active/ended access rules in docs/APP_NAVIGATION_AND_UX.md, section 7.3.
  return (
    <DayNumberContext value={dayNumber}>
      <Stack>
        <Stack.Screen name="index" options={{ title: `Day ${dayNumber}` }} />
        <Stack.Screen name="scripture" options={{ title: `Day ${dayNumber} · Scripture` }} />
        <Stack.Screen name="reflection" options={{ title: `Day ${dayNumber} · Reflection` }} />
      </Stack>
    </DayNumberContext>
  );
}
