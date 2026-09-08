import { Link } from 'expo-router';

import { BrandWordmark } from '@/components/brand-wordmark';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function WelcomeScreen() {
  return (
    <ScreenScrollView headerless>
      <ScreenSection>
        <BrandWordmark />
        <ScreenHeading
          title="Welcome"
          description="A 77-day journey centered on Scripture, prayer, and reflection."
        />
      </ScreenSection>
      <ScreenSection>
        <Link href="/auth/sign-up" push asChild>
          <Button>Get Started</Button>
        </Link>
        <Link href="/auth/sign-in" push asChild>
          <TextLink>I already have an account</TextLink>
        </Link>
      </ScreenSection>
      <InlineNotice message="Account forms are not connected yet. You can preview the screens, but cannot create an account or sign in." />
      <EmptyState
        title="Privacy Policy &amp; Terms"
        description="Privacy Policy and Terms of Service are not available in this preview."
      />
    </ScreenScrollView>
  );
}
