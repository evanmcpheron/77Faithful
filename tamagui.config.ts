import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

import { colors } from './src/constants/colors';

const sharedColors = {
  ...colors.status,
  onPrimary: colors.brand.white,
  onInfo: colors.brand.white,
  onSuccess: colors.brand.white,
  onWarning: colors.brand.faithfulNavy,
  onError: colors.brand.white,
  // Stronger status shades keep small text readable on pale surfaces and filled buttons.
  successStrong: '#256957',
  successPressed: '#1E5446',
  warningStrong: '#875916',
  warningPressed: '#C58B37',
  errorPressed: '#9E3F46',
  infoPressed: colors.brand.faithfulBlue,
};

const lightTheme = {
  ...defaultConfig.themes.light,
  ...sharedColors,
  ...colors.light,
  borderSubtle: colors.light.surfaceSubtle,
  color: colors.light.textPrimary,
  colorHover: colors.light.textPrimary,
  colorPress: colors.light.textPrimary,
  colorFocus: colors.light.textPrimary,
  color1: colors.light.surface,
  color2: colors.light.background,
  color3: colors.light.surfaceElevated,
  color4: colors.light.surfaceSubtle,
  color5: colors.light.border,
  color6: colors.light.borderStrong,
  color7: colors.brand.softSky,
  color8: colors.brand.skyBlue,
  color9: colors.light.primary,
  color10: colors.light.textSecondary,
  color11: colors.light.textSecondary,
  color12: colors.light.textPrimary,
  backgroundHover: colors.light.surfaceElevated,
  backgroundPress: colors.light.surfaceSubtle,
  backgroundFocus: colors.light.surfaceElevated,
  backgroundActive: colors.light.primary,
  borderColor: colors.light.border,
  borderColorHover: colors.light.borderStrong,
  borderColorPress: colors.light.primary,
  borderColorFocus: colors.light.accent,
  placeholderColor: colors.light.textSecondary,
  accentBackground: colors.light.primary,
  accentColor: colors.brand.white,
  successText: sharedColors.successStrong,
  warningText: sharedColors.warningStrong,
  errorText: colors.status.error,
  infoText: colors.light.link,
  infoSurface: colors.light.accentSoft,
};

const darkTheme = {
  ...defaultConfig.themes.dark,
  ...sharedColors,
  ...colors.dark,
  borderStrong: colors.dark.border,
  color: colors.dark.textPrimary,
  colorHover: colors.dark.textPrimary,
  colorPress: colors.dark.textPrimary,
  colorFocus: colors.dark.textPrimary,
  color1: colors.dark.background,
  color2: colors.dark.surface,
  color3: colors.dark.surfaceSubtle,
  color4: colors.dark.surfaceElevated,
  color5: colors.dark.borderSubtle,
  color6: colors.dark.border,
  color7: colors.brand.faithfulBlue,
  color8: colors.brand.journeyBlue,
  color9: colors.dark.primary,
  color10: colors.dark.textSecondary,
  color11: colors.dark.textSecondary,
  color12: colors.dark.textPrimary,
  backgroundHover: colors.dark.surfaceElevated,
  backgroundPress: colors.dark.surfaceSubtle,
  backgroundFocus: colors.dark.surfaceElevated,
  backgroundActive: colors.dark.primary,
  borderColor: colors.dark.border,
  borderColorHover: colors.dark.primary,
  borderColorPress: colors.dark.accent,
  borderColorFocus: colors.dark.accent,
  placeholderColor: colors.dark.textSecondary,
  accentBackground: colors.dark.primary,
  accentColor: colors.brand.white,
  successText: colors.status.successSoft,
  warningText: colors.status.warningSoft,
  errorText: colors.status.errorSoft,
  infoText: colors.dark.link,
  infoSurface: colors.dark.surfaceElevated,
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  selectionStyles: (theme) => ({
    backgroundColor: theme.accentSoft,
    color: colors.brand.faithfulNavy,
  }),
});

type TAppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TAppTamaguiConfig {}
}

export default tamaguiConfig;
