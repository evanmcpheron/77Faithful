import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { NavigationRow } from '@/components/navigation-row';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';

export default function AccountScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading title="Account" description="Manage account access and deletion." />
      <EmptyState
        title="Account details are not available yet"
        description="Account identity and sign-out are not connected. This preview does not assume that you are signed in."
      />
      <ScreenSection>
        <Link href="/settings/account/delete" push asChild>
          <NavigationRow label="Delete Account" />
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
