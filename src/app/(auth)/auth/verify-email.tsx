import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function VerifyEmailScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Verify Email"
        description="Email verification comes before starting your journey."
      />
      <EmptyState
        title="Email verification is not available yet"
        description="No account or verification request has been loaded. This preview does not send a code or confirm verification."
      />
      <ScreenSection>
        <Link href="/auth/welcome" dismissTo asChild>
          <TextLink>Cancel and return to Welcome</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
