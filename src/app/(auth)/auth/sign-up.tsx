import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function SignUpScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading title="Sign Up" description="Create an account for your personal journey." />
      <EmptyState
        title="Account creation is not available yet"
        description="Account creation is not connected. No account can be created in this preview."
      />
      <ScreenSection>
        <Link href="/auth/sign-in" replace asChild>
          <TextLink>Existing account? Sign In</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
