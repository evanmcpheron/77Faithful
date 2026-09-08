import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function OnboardingConfirmScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Review your choices"
        description="Review your two optional practices and Bible translation before starting."
      />
      <EmptyState
        title="Starting a journey is not available yet"
        description="Saved choices and a journey are not available in this preview. Start Day 1 will become available when your choices can be saved and the journey can be created."
      />
      <ScreenSection>
        <Link href="/onboarding/practices" dismissTo asChild>
          <TextLink>Review Practices</TextLink>
        </Link>
        <Link href="/onboarding/bible-translation" dismissTo asChild>
          <TextLink>Review Bible Translation</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
