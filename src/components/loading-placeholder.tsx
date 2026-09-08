import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';

export type LoadingPlaceholderProps = {
  label: string;
  presentation?: 'skeleton' | 'refresh';
};

export function LoadingPlaceholder({ label, presentation = 'skeleton' }: LoadingPlaceholderProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={styles.container}>
      <ThemedText type="supporting" themeColor="textSecondary">
        {label}
      </ThemedText>
      {presentation === 'skeleton' ? (
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={styles.container}>
          <ThemedView type="backgroundElement" style={styles.line} />
          <ThemedView type="backgroundElement" style={styles.line} />
          <ThemedView type="backgroundElement" style={[styles.line, styles.shortLine]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, minWidth: 0 },
  line: { height: Spacing.three, borderRadius: Radius.control },
  shortLine: { width: '60%' },
});
