import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function ForgotPasswordScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Forgot Password"
        description="Recover access to your account by email."
      />
      <EmptyState
        title="Password reset is not available yet"
        description="Password recovery is not connected. No reset email has been requested or sent."
      />
      <ScreenSection>
        <Link href="/auth/sign-in" dismissTo asChild>
          <TextLink>Return to Sign In</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
