import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { JOURNEY_DAY_COUNT } from '@/content/scripture/reading-plans';

export type RecordedPracticeCount = 0 | 1 | 2 | 3 | 4 | 5;

export type DayProgressProps = { dayNumber: number };

export function DayProgress({ dayNumber }: DayProgressProps) {
  return (
    <ThemedText type="supporting" themeColor="textSecondary" style={styles.text}>
      {`Day ${dayNumber} of ${JOURNEY_DAY_COUNT}`}
    </ThemedText>
  );
}

export type PracticeProgressProps = { recordedCount: RecordedPracticeCount };

export function PracticeProgress({ recordedCount }: PracticeProgressProps) {
  return (
    <ThemedText type="supporting" themeColor="textSecondary" style={styles.text}>
      {`${recordedCount} of 5 recorded`}
    </ThemedText>
  );
}

export type JourneyProgressProps = {
  period: { state: 'active'; dayNumber: number } | { state: 'ended' };
  fullyRecordedDays: number;
  partiallyRecordedDays: number;
  completeDayStreak: number;
};

// Journey-only summary; callers supply derived counts from known participation records.
export function JourneyProgress({
  period,
  fullyRecordedDays,
  partiallyRecordedDays,
  completeDayStreak,
}: JourneyProgressProps) {
  return (
    <View style={styles.summary}>
      {period.state === 'active' ? (
        <DayProgress dayNumber={period.dayNumber} />
      ) : (
        <ThemedText type="supporting" themeColor="textSecondary" style={styles.text}>
          {`${JOURNEY_DAY_COUNT}-day period ended`}
        </ThemedText>
      )}
      <ThemedText style={styles.text}>
        {`${fullyRecordedDays} fully recorded ${fullyRecordedDays === 1 ? 'day' : 'days'}`}
      </ThemedText>
      <ThemedText style={styles.text}>
        {`${partiallyRecordedDays} partially recorded ${partiallyRecordedDays === 1 ? 'day' : 'days'}`}
      </ThemedText>
      <ThemedText type="supporting" themeColor="textSecondary" style={styles.text}>
        {`Complete-day streak: ${completeDayStreak} ${completeDayStreak === 1 ? 'day' : 'days'}`}
      </ThemedText>
    </View>
  );
}

export type DayStatusProps = { dayNumber: number } & (
  | { state: 'historical' | 'today'; recordedCount: RecordedPracticeCount }
  | { state: 'upcoming'; recordedCount?: never }
);

export function DayStatus(props: DayStatusProps) {
  const upcoming = props.state === 'upcoming';
  let label: string;
  let spokenStatus: string;

  if (upcoming) {
    label = 'Upcoming';
    spokenStatus = label;
  } else {
    const participation =
      props.recordedCount === 5
        ? 'Complete'
        : props.recordedCount === 0
          ? 'Not recorded'
          : `${props.recordedCount} of 5`;
    label = props.state === 'today' ? `Today · ${participation}` : participation;
    spokenStatus = [
      props.state === 'today' ? 'Today' : undefined,
      props.recordedCount === 5 ? 'Complete' : undefined,
      props.recordedCount === 0 ? 'Not recorded' : `${props.recordedCount} of 5 recorded`,
    ]
      .filter(Boolean)
      .join(', ');
  }

  return (
    <ThemedText
      accessible
      accessibilityLabel={`Day ${props.dayNumber}, ${spokenStatus}`}
      accessibilityState={{ disabled: upcoming }}
      type="supporting"
      themeColor="textSecondary"
      style={styles.text}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.two, minWidth: 0, flexShrink: 1 },
  text: { minWidth: 0, flexShrink: 1 },
});
