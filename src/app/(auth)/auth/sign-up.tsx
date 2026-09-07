import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function SignUpScreen() {
  return (
    <NavigationPlaceholder
      title="Sign Up"
      description="Account creation navigation preview. No account will be created.">
      <PlaceholderLink href="/auth/sign-in" replace>
        Existing account? Sign In
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
