import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function OnboardingBibleTranslationScreen() {
  return (
    <NavigationPlaceholder
      title="Bible Translation"
      description="Bible translations are not available yet. Continue only previews confirmation; no translation preference is saved.">
      <PlaceholderLink href="/onboarding/confirm" push>
        Continue to Confirmation
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
