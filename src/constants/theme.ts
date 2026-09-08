import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

const lightColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  backgroundElement: '#EEF1F5',
  backgroundSelected: '#DFEAF7',
  text: '#182330',
  textSecondary: '#526071',
  primary: '#164E87',
  primaryPressed: '#103D6C',
  onPrimary: '#FFFFFF',
  link: '#1B5FA7',
  border: '#D5DBE3',
  borderControl: '#7A8797',
  focus: '#1B5FA7',
  disabled: '#E3E7ED',
  onDisabled: '#586576',
  error: '#A52A32',
  errorSurface: '#FCEDEF',
  success: '#276345',
  successSurface: '#EAF4EE',
  warning: '#805411',
  warningSurface: '#FBF2DF',
} as const;

export type ThemeColor = keyof typeof lightColors;

export const Colors = {
  light: lightColors,
  dark: {
    background: '#121820',
    surface: '#1A232E',
    backgroundElement: '#222E3C',
    backgroundSelected: '#243C58',
    text: '#F0F3F7',
    textSecondary: '#B5C0CF',
    primary: '#3274B3',
    primaryPressed: '#28669F',
    onPrimary: '#FFFFFF',
    link: '#91C7FF',
    border: '#3A4758',
    borderControl: '#8393A7',
    focus: '#91C7FF',
    disabled: '#2B3644',
    onDisabled: '#A6B2C2',
    error: '#FFADB3',
    errorSurface: '#3A242C',
    success: '#9DD5B4',
    successSurface: '#20372D',
    warning: '#EBC784',
    warningSurface: '#383021',
  },
} as const satisfies Record<'light' | 'dark', Record<ThemeColor, string>>;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui' },
  default: { sans: 'sans-serif' },
  web: { sans: 'var(--font-sans)' },
});

export const Typography = {
  heading: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  section: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  supporting: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  action: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  link: { fontSize: 16, lineHeight: 24, fontWeight: '500', textDecorationLine: 'underline' },
} as const satisfies Record<string, TextStyle>;

export type TypographyRole = keyof typeof Typography;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { control: 8, surface: 12 } as const;
export const ControlSize = { minTouchTarget: 48 } as const;
export const BorderWidth = { default: 1, focus: 2 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
