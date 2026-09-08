import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Typography, type ThemeColor, type TypographyRole } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: TypographyRole;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.base,
        styles[type],
        { color: theme[themeColor ?? (type === 'link' ? 'link' : 'text')] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: Fonts.sans },
  ...Typography,
});
