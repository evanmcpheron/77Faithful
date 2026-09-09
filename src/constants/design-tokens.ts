import { Platform } from 'react-native';

export const designTokens = {
  space: {
    micro: 4,
    related: 8,
    inline: 12,
    compact: 16,
    fieldGroup: 20,
    section: 24,
    generous: 32,
    spacious: 40,
    breathing: 48,
    expansive: 64,
  },
  radius: { control: 16, button: 18, card: 24, featured: 28 },
  size: { touchTarget: 48, control: 56, account: 460, content: 640 },
  fontFamily: {
    editorial: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    interface: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }),
  },
  fontSize: {
    hero: 34,
    page: 30,
    section: 24,
    card: 20,
    body: 16,
    support: 14,
    label: 14,
    metadata: 13,
    button: 16,
    scripture: 20,
    quotation: 20,
  },
  lineHeight: {
    hero: 40,
    page: 38,
    section: 30,
    card: 26,
    body: 24,
    support: 20,
    label: 20,
    metadata: 18,
    button: 22,
    scripture: 32,
    quotation: 28,
  },
} as const;
