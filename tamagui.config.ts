import { defaultConfig } from '@tamagui/config/v5';
import { animations as webAnimations } from '@tamagui/config/v5-css';
import { animations as nativeAnimations } from '@tamagui/config/v5-reanimated';
import { Platform } from 'react-native';
import { createFont, createTamagui } from 'tamagui';

import { colors } from './src/constants/colors';
import { designTokens } from './src/constants/design-tokens';

const createSanctuaryTheme = (appearance: 'light' | 'dark') => {
  const palette = colors[appearance];

  return {
    ...defaultConfig.themes[appearance],
    ...palette,
    color: palette.textPrimary,
    colorHover: palette.textPrimary,
    colorPress: palette.textPrimary,
    colorFocus: palette.textPrimary,
    color1: palette.background,
    color2: palette.surface,
    color3: palette.surfaceElevated,
    color4: palette.surfaceSubtle,
    color5: palette.border,
    color6: palette.accentSoft,
    color7: palette.controlBorder,
    color8: palette.focus,
    color9: palette.primary,
    color10: palette.link,
    color11: palette.textSecondary,
    color12: palette.textPrimary,
    backgroundHover: palette.surfaceElevated,
    backgroundPress: palette.surfaceSubtle,
    backgroundFocus: palette.surfaceElevated,
    backgroundActive: palette.accentSoft,
    borderColor: palette.border,
    borderColorHover: palette.controlBorder,
    borderColorPress: palette.focus,
    borderColorFocus: palette.focus,
    outlineColor: palette.focus,
    placeholderColor: palette.textSecondary,
    accentBackground: palette.primary,
    accentColor: palette.onPrimary,
    // Existing callers retain these names while sharing the ordinary theme.
    accent: palette.link,
    borderStrong: palette.controlBorder,
    borderSubtle: palette.border,
    successStrong: palette.successText,
    successSoft: palette.successSurface,
    warningStrong: palette.warningText,
    warningSoft: palette.warningSurface,
    errorSoft: palette.errorSurface,
  };
};

const bodyFont = createFont({
  ...defaultConfig.fonts.body,
  family: designTokens.fontFamily.interface,
  size: {
    ...defaultConfig.fonts.body.size,
    true: designTokens.fontSize.body,
    ...designTokens.fontSize,
  },
  lineHeight: {
    ...defaultConfig.fonts.body.lineHeight,
    true: designTokens.lineHeight.body,
    ...designTokens.lineHeight,
  },
});

const headingFont = createFont({
  ...bodyFont,
  family: designTokens.fontFamily.editorial,
});

const lightTheme = createSanctuaryTheme('light');
const darkTheme = createSanctuaryTheme('dark');

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations: Platform.OS === 'web' ? webAnimations : nativeAnimations,
  tokens: {
    ...defaultConfig.tokens,
    space: { ...defaultConfig.tokens.space, ...designTokens.space },
    radius: { ...defaultConfig.tokens.radius, ...designTokens.radius },
    size: { ...defaultConfig.tokens.size, ...designTokens.size },
  },
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
    heading: headingFont,
    formation: headingFont,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
    light_formation: lightTheme,
    dark_formation: darkTheme,
  },
  selectionStyles: (theme) => ({
    backgroundColor: theme.accentSoft,
    color: theme.textPrimary,
  }),
});

type TAppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TAppTamaguiConfig {}
}

export default tamaguiConfig;
