import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function SettingsScreen() {
  return (
    <NavigationPlaceholder
      title="Settings"
      description="Choose a destination to preview its screen. Preferences and account actions are not connected yet.">
      <PlaceholderLink href="/settings/practices" push>
        Optional Practices
      </PlaceholderLink>
      <PlaceholderLink href="/settings/bible-translation" push>
        Bible Translation
      </PlaceholderLink>
      <PlaceholderLink href="/settings/privacy" push>
        Privacy &amp; Data
      </PlaceholderLink>
      <PlaceholderLink href="/settings/account" push>
        Account
      </PlaceholderLink>
      <PlaceholderLink href="/settings/about" push>
        About
      </PlaceholderLink>
      <PlaceholderLink href="/settings/help-feedback" push>
        Help / Feedback
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
