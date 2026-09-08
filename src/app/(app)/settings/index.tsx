import { Link } from 'expo-router';

import { InlineNotice } from '@/components/inline-notice';
import { NavigationRow } from '@/components/navigation-row';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { Separator } from '@/components/separator';

export default function SettingsScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading title="Settings" description="Preferences, privacy, account, and support." />
      <InlineNotice message="Preferences and account actions are not connected yet. Open a screen to see what is available." />
      <ScreenSection title="Your practices">
        <Link href="/settings/practices" push asChild>
          <NavigationRow label="Optional Practices" />
        </Link>
        <Separator />
        <Link href="/settings/bible-translation" push asChild>
          <NavigationRow label="Bible Translation" />
        </Link>
        <Separator />
        <Link href="/settings/notifications" push asChild>
          <NavigationRow label="Notifications" />
        </Link>
      </ScreenSection>
      <ScreenSection title="Privacy and account">
        <Link href="/settings/privacy" push asChild>
          <NavigationRow label="Privacy &amp; Data" />
        </Link>
        <Separator />
        <Link href="/settings/account" push asChild>
          <NavigationRow label="Account" />
        </Link>
      </ScreenSection>
      <ScreenSection title="About and support">
        <Link href="/settings/about" push asChild>
          <NavigationRow label="About" />
        </Link>
        <Separator />
        <Link href="/settings/help-feedback" push asChild>
          <NavigationRow label="Help / Feedback" />
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
