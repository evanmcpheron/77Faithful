import { Link } from 'expo-router';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';

export default function DeleteAccountScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Delete Account"
        description="Account deletion permanently removes your account and associated personal data."
      />
      <EmptyState
        title="Account deletion is not available yet"
        description="Deletion is not connected. No deletion can be submitted in this preview."
      />
      <ScreenSection>
        <Link href="/settings/account" dismissTo asChild>
          <Button>Cancel</Button>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
