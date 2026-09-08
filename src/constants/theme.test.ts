import { Colors, type ThemeColor } from './theme';

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

const readingSurfaces = [
  'background',
  'surface',
  'backgroundElement',
  'backgroundSelected',
] as const;

const textPairs: [ThemeColor, ThemeColor][] = [
  ...readingSurfaces.flatMap((background): [ThemeColor, ThemeColor][] => [
    ['text', background],
    ['textSecondary', background],
    ['link', background],
  ]),
  ['onPrimary', 'primary'],
  ['onPrimary', 'primaryPressed'],
  ['onDisabled', 'disabled'],
  ...(['error', 'success', 'warning'] as const).flatMap((state): [ThemeColor, ThemeColor][] => [
    [state, `${state}Surface`],
    [state, 'background'],
    [state, 'surface'],
  ]),
];

describe.each(['light', 'dark'] as const)('%s palette accessibility', (scheme) => {
  const palette = Colors[scheme];

  it.each(textPairs)('%s text on %s meets 4.5:1 contrast', (foreground, background) => {
    expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(readingSurfaces)('control borders and focus on %s meet 3:1 contrast', (background) => {
    expect(contrast(palette.borderControl, palette[background])).toBeGreaterThanOrEqual(3);
    expect(contrast(palette.focus, palette[background])).toBeGreaterThanOrEqual(3);
  });
});
