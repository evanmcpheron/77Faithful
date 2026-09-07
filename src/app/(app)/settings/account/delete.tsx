import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function DeleteAccountScreen() {
  return (
    <NavigationPlaceholder
      title="Delete Account"
      description="Account deletion will be implemented here. No deletion can be submitted in this preview.">
      <PlaceholderLink href="/settings/account" dismissTo>
        Cancel
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
