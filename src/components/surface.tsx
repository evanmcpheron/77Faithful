import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from './themed-view';

import { BorderWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Surface({ style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <ThemedView
      {...props}
      type="surface"
      style={[styles.surface, { borderColor: theme.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: BorderWidth.default,
    borderRadius: Radius.surface,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
