import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function OnboardingConfirmScreen() {
  return (
    <NavigationPlaceholder
      title="Review your choices"
      description="Journey confirmation will be implemented here. Start Day 1 will open Today only after the journey is successfully saved. Starting a journey is not available yet.">
      <PlaceholderLink href="/onboarding/practices" dismissTo>
        Review Practices
      </PlaceholderLink>
      <PlaceholderLink href="/onboarding/bible-translation" dismissTo>
        Review Bible Translation
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
