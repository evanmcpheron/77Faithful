import Constants from 'expo-constants';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { SeventySevenPage } from '@77/components/core/seventy-seven-page.component';
import { useAuth } from '@77/providers/auth-provider';
import { SeventySevenCard } from '@77/surface';

export const SettingsScreen = () => {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setHasError(false);
    try {
      await signOut();
    } catch {
      setHasError(true);
      setIsSigningOut(false);
    }
  };

  return (
    <SeventySevenPage title="Settings">
      <SeventySevenCard gap="$3">
        <SeventySevenText size="HeadingSmall" role="heading">
          Account
        </SeventySevenText>
        <SeventySevenText>{user?.email}</SeventySevenText>
        <SeventySevenText color="$textSecondary">
          {user?.emailVerified ? 'Email confirmed' : 'Email awaiting confirmation'}
        </SeventySevenText>
      </SeventySevenCard>
      <SeventySevenCard gap="$3">
        <SeventySevenText size="HeadingSmall" role="heading">
          Appearance
        </SeventySevenText>
        <SeventySevenText>
          Follows your device · {colorScheme === 'dark' ? 'Dark' : 'Light'}
        </SeventySevenText>
        <SeventySevenText color="$textSecondary">
          Change your device’s appearance to use light or dark mode.
        </SeventySevenText>
      </SeventySevenCard>
      <SeventySevenCard gap="$3">
        <SeventySevenText size="HeadingSmall" role="heading">
          77Faithful
        </SeventySevenText>
        <SeventySevenText>
          Make room for Scripture, prayer, and faithful action over 77 days.
        </SeventySevenText>
        {Constants.expoConfig?.version ? (
          <SeventySevenText color="$textSecondary">
            Version {Constants.expoConfig.version}
          </SeventySevenText>
        ) : null}
      </SeventySevenCard>
      {hasError ? (
        <SeventySevenText role="alert">
          We couldn’t sign you out. Please try again.
        </SeventySevenText>
      ) : null}
      <SeventySevenButton
        appearance="Outlined"
        onPress={handleSignOut}
        disabled={isSigningOut}
        accessibilityState={{ busy: isSigningOut }}
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </SeventySevenButton>
    </SeventySevenPage>
  );
};
