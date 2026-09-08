import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function SignInScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading title="Sign In" description="Return to your personal 77-day journey." />
      <EmptyState
        title="Sign-in is not available yet"
        description="Authentication is not connected. This preview does not collect your email or password."
      />
      <ScreenSection>
        <Link href="/auth/forgot-password" push asChild>
          <TextLink>Forgot password</TextLink>
        </Link>
        <Link href="/auth/sign-up" replace asChild>
          <TextLink>Create account</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
