import { Link } from 'expo-router';

import { useAuth } from '@/auth/auth-provider';
import { SignOutAction } from '@/auth/sign-out-action';
import { ThemedText } from '@/components/themed-text';
import { NavigationRow } from '@/components/navigation-row';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';

export default function AccountScreen() {
  const { state } = useAuth();
  if (state.status !== 'verified') return null;
  return (
    <ScreenScrollView>
      <ScreenHeading title="Account" description="Manage account access and deletion." />
      <ScreenSection>
        <ThemedText>
          {state.participant.email ?? 'Your authentication email is unavailable.'}
        </ThemedText>
      </ScreenSection>
      <SignOutAction />
      <ScreenSection>
        <Link href="/settings/account/delete" push asChild>
          <NavigationRow label="Delete Account" />
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
