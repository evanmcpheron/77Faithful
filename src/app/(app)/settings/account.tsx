import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function AccountScreen() {
  return (
    <NavigationPlaceholder
      title="Account"
      description="Account settings navigation preview. Account identity and sign-out actions are not connected yet.">
      <PlaceholderLink href="/settings/account/delete" push>
        Delete Account
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
