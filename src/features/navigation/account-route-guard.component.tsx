import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { getRouteRedirect, isAccountRoute } from '@77/features/navigation/route-access';
import type { useJourneyAccess } from '@77/features/navigation/use-journey-access.hook';
import { useAuth } from '@77/providers/auth-provider';

interface IAccountRouteGuardProps {
  children: ReactNode;
  routeName: string;
  journeyAccess: ReturnType<typeof useJourneyAccess>;
}

export const AccountRouteGuard = ({
  children,
  routeName,
  journeyAccess,
}: IAccountRouteGuardProps) => {
  const { user, isLoading } = useAuth();

  if (!isAccountRoute(routeName)) return children;

  if (isLoading || journeyAccess.isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner aria-label="Loading account" />
      </YStack>
    );
  }

  if (journeyAccess.hasError) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$4" p="$5">
        <SeventySevenText role="alert">
          We couldn’t load your journey. Please try again.
        </SeventySevenText>
        <SeventySevenButton onPress={journeyAccess.retry}>Try again</SeventySevenButton>
      </YStack>
    );
  }

  const redirect = getRouteRedirect({
    routeName,
    isSignedIn: Boolean(user),
    isEmailVerified: user?.emailVerified === true,
    hasJourney: journeyAccess.hasJourney,
  });

  return redirect ? <Redirect href={redirect} /> : children;
};
