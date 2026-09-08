import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function OnboardingPracticesScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Choose two practices"
        description="Scripture, Prayer, and Reflection remain foundational."
      />
      <EmptyState
        title="Practice selection is not available yet"
        description="Choose exactly two additional practices when selection is connected. This preview does not load or save your choices."
      />
      <ScreenSection>
        <InlineNotice message="Continue only previews the Bible Translation screen; it does not confirm any practices." />
        <Link href="/onboarding/bible-translation" push asChild>
          <TextLink>Continue to Bible Translation</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
