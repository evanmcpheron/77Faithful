import { View, type ViewProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const overrideColor = colorScheme === 'dark' ? darkColor : lightColor;

  return (
    <View
      style={[{ backgroundColor: overrideColor ?? theme[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}
