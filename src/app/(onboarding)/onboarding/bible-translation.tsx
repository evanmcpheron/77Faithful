import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function OnboardingBibleTranslationScreen() {
  return (
    <NavigationPlaceholder
      title="Bible Translation"
      description="Supported translation selection will be implemented here. Continue previews confirmation without loading or saving a translation.">
      <PlaceholderLink href="/onboarding/confirm" push>
        Continue to Confirmation
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
