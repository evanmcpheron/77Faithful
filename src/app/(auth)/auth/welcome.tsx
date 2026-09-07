import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function WelcomeScreen() {
  return (
    <NavigationPlaceholder
      headerless
      title="Welcome to 77Faithful"
      description="A 77-day journey centered on Scripture, prayer, and reflection. Account forms are not connected yet.">
      <PlaceholderLink href="/auth/sign-up" push>
        Get Started
      </PlaceholderLink>
      <PlaceholderLink href="/auth/sign-in" push>
        I already have an account
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
