import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function OnboardingBibleTranslationScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Bible Translation"
        description="Choose the translation used to read the assigned passages."
      />
      <EmptyState
        title="Translations are not available yet"
        description="There are no available translations to confirm in this preview. No translation preference is saved."
      />
      <ScreenSection>
        <InlineNotice message="Continue only previews journey confirmation; it does not confirm a translation." />
        <Link href="/onboarding/confirm" push asChild>
          <TextLink>Continue to Confirmation</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
