import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BorderWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Separator({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      style={[styles.separator, { backgroundColor: theme.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  separator: { height: BorderWidth.default, alignSelf: 'stretch' },
});
