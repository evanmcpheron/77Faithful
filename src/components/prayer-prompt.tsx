import { ScreenSection } from './screen-section';
import { ThemedText } from './themed-text';

export type PrayerPromptProps = { prompt: string };

export function PrayerPrompt({ prompt }: PrayerPromptProps) {
  return (
    <ScreenSection title="Prayer prompt">
      <ThemedText selectable>{prompt}</ThemedText>
    </ScreenSection>
  );
}
