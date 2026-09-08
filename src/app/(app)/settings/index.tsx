import { Link } from 'expo-router';
import { View } from 'react-native';

import { NavigationPlaceholder } from '@/components/navigation-placeholder';
import { NavigationRow } from '@/components/navigation-row';
import { Separator } from '@/components/separator';

export default function SettingsScreen() {
  return (
    <NavigationPlaceholder
      title="Settings"
      description="Choose a destination to preview its screen. Preferences and account actions are not connected yet.">
      <View>
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
        <Separator />
        <Link href="/settings/privacy" push asChild>
          <NavigationRow label="Privacy &amp; Data" />
        </Link>
        <Separator />
        <Link href="/settings/account" push asChild>
          <NavigationRow label="Account" />
        </Link>
        <Separator />
        <Link href="/settings/about" push asChild>
          <NavigationRow label="About" />
        </Link>
        <Separator />
        <Link href="/settings/help-feedback" push asChild>
          <NavigationRow label="Help / Feedback" />
        </Link>
      </View>
    </NavigationPlaceholder>
  );
}
