import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const symbols = {
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type AppIconName = keyof typeof symbols;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  themeColor?: ThemeColor;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, size = 24, themeColor = 'text', style }: AppIconProps) {
  const theme = useTheme();

  // Symbols 57's Android/web renderer ignores accessibility props; hide its entire subtree.
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      style={style}>
      <SymbolView name={symbols[name]} size={size} tintColor={theme[themeColor]} />
    </View>
  );
}
