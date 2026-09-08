import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ThemeColor } from '@/constants/theme';

type FeedbackTextProps = {
  children: string;
  error?: boolean;
  themeColor?: ThemeColor;
};

export function FeedbackText({
  children,
  error = false,
  themeColor = 'textSecondary',
}: FeedbackTextProps) {
  useEffect(() => {
    // Android/web use the live region; VoiceOver needs an explicit announcement.
    if (Platform.OS === 'ios' && error) {
      AccessibilityInfo.announceForAccessibilityWithOptions(children, { queue: true });
    }
  }, [children, error]);

  return (
    <ThemedText
      type="supporting"
      themeColor={themeColor}
      accessibilityRole={error ? 'alert' : undefined}
      accessibilityLiveRegion={error ? 'polite' : 'none'}>
      {children}
    </ThemedText>
  );
}
