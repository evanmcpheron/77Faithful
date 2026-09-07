import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function OnboardingPracticesScreen() {
  return (
    <NavigationPlaceholder
      title="Choose two practices"
      description="Practice selection will be implemented here. Continue previews the next step without selecting or saving practices.">
      <PlaceholderLink href="/onboarding/bible-translation" push>
        Continue to Bible Translation
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
