import { StyleSheet, View } from 'react-native';

import { NavigationRow, type NavigationRowProps } from './navigation-row';
import { DayStatus, getDayStatusPresentation, type DayStatusProps } from './progress';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

export type JourneyDayRowProps = {
  // Already formatted by the caller using the journey's fixed timezone.
  dateLabel?: string;
} & (
  | (Extract<DayStatusProps, { state: 'upcoming' }> & { onPress?: never; href?: never })
  | (Exclude<DayStatusProps, { state: 'upcoming' }> & {
      onPress: NonNullable<NavigationRowProps['onPress']>;
      href?: string;
    })
);

export function JourneyDayRow(props: JourneyDayRowProps) {
  const { accessibilityLabel: statusLabel } = getDayStatusPresentation(props);
  const accessibilityLabel = [statusLabel, props.dateLabel].filter(Boolean).join(', ');
  const details = (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={styles.details}>
      {props.dateLabel ? (
        <ThemedText type="supporting" themeColor="textSecondary">
          {props.dateLabel}
        </ThemedText>
      ) : null}
      <DayStatus {...props} />
    </View>
  );

  if (props.state === 'upcoming') {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: true }}
        style={styles.upcoming}>
        <ThemedText themeColor="textSecondary">{`Day ${props.dayNumber}`}</ThemedText>
        {details}
      </View>
    );
  }

  return (
    <NavigationRow
      label={`Day ${props.dayNumber}`}
      supportingContent={details}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={props.state === 'today' ? 'Opens Today' : 'Opens Historical Day Detail'}
      onPress={props.onPress}
      href={props.href}
    />
  );
}

const styles = StyleSheet.create({
  details: { gap: Spacing.one, minWidth: 0 },
  upcoming: { padding: Spacing.three, gap: Spacing.one },
});
