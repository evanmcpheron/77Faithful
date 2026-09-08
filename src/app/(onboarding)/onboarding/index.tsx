import { Link } from 'expo-router';

import { BrandWordmark } from '@/components/brand-wordmark';
import { Button } from '@/components/button';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { Surface } from '@/components/surface';
import { ThemedText } from '@/components/themed-text';

export default function OnboardingScreen() {
  return (
    <ScreenScrollView>
      <ScreenSection>
        <BrandWordmark />
        <ScreenHeading
          title="Your 77-day journey"
          description="77 calendar days, with room for your everyday life."
        />
      </ScreenSection>
      <ScreenSection>
        <Surface>
          <ScreenHeading level="section" title="Scripture, Prayer, and Reflection" />
          <ThemedText>
            These three practices are foundational each day. Choose two additional practices to make
            five.
          </ThemedText>
        </Surface>
        <ThemedText>
          Missing or partially completing a day never restarts the journey. Participation does not
          earn God’s favor or measure your spiritual worth.
        </ThemedText>
      </ScreenSection>
      <InlineNotice message="Onboarding is a navigation preview. Progress and choices are not saved." />
      <ScreenSection>
        <Link href="/onboarding/practices" push asChild>
          <Button>Continue to Practices</Button>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
