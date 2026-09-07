import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function OnboardingScreen() {
  return (
    <NavigationPlaceholder
      title="Your 77-day journey"
      description="Scripture, Prayer, and Reflection are foundational, alongside two practices you choose. Missing a day never restarts the journey. These steps preview navigation only; no choices are saved.">
      <PlaceholderLink href="/onboarding/practices" push>
        Continue to Practices
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
