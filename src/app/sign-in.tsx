import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { SeventySevenFormTextInput, SeventySevenFormTextInputType } from '@77/components/form';
import { getAccountErrorMessage } from '@77/features/account/account-error';
import { ensureAccountProfile } from '@77/features/account/account-profile.service';
import { AccountScreen } from '@77/features/account/account-screen.component';
import { AccountLegalNotice } from '@77/features/account/account-legal-notice.component';
import { AccountTextLink } from '@77/features/account/account-text-link.component';
import { useAuth } from '@77/providers/auth-provider';
import { Severity } from '@77/types';

export const SignInScreen = () => {
  const router = useRouter();
  const { user, isLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestPending = useRef(false);

  const handleSignIn = async () => {
    if (isRequestPending.current || isLoading) return;
    if (!user && (!email.trim() || !password)) {
      setErrorMessage('Enter your email and password.');
      return;
    }
    isRequestPending.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const authenticatedUser = user ?? (await signIn(email, password)).user;
      setPassword('');
      await ensureAccountProfile(authenticatedUser.uid);
      router.replace(authenticatedUser.emailVerified ? '/onboarding' : '/confirm-email');
    } catch (error) {
      setErrorMessage(getAccountErrorMessage(error));
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (isRequestPending.current) return;
    isRequestPending.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(getAccountErrorMessage(error));
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AccountScreen
      title="Sign in"
      description="Return to Scripture, prayer, and your 77Faithful journey."
    >
      {isLoading ? (
        <Spinner accessibilityLabel="Loading account" />
      ) : (
        <YStack gap="$4">
          {user ? (
            <SeventySevenText>Signed in as {user.email}</SeventySevenText>
          ) : (
            <>
              <SeventySevenFormTextInput
                label="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                disabled={isSubmitting}
              />
              <SeventySevenFormTextInput
                label="Password"
                autoComplete="current-password"
                type={SeventySevenFormTextInputType.Password}
                value={password}
                onChangeText={setPassword}
                disabled={isSubmitting}
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
              />
            </>
          )}
          {errorMessage ? (
            <SeventySevenText severity={Severity.Error} role="alert">
              {errorMessage}
            </SeventySevenText>
          ) : null}
          <AccountLegalNotice action="signing in" disabled={isSubmitting} />
          <SeventySevenButton onPress={handleSignIn} disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : user ? 'Continue' : 'Sign in'}
          </SeventySevenButton>
          {user ? (
            <SeventySevenButton
              onPress={handleSignOut}
              appearance="Outlined"
              disabled={isSubmitting}
            >
              Use another account
            </SeventySevenButton>
          ) : (
            <>
              <SeventySevenText alignment="Center">
                <AccountTextLink href="/recover-access" disabled={isSubmitting}>
                  Forgot password?
                </AccountTextLink>
              </SeventySevenText>
              <SeventySevenText alignment="Center" color="$textSecondary">
                Don’t have an account?{' '}
                <AccountTextLink href="/register" disabled={isSubmitting}>
                  Create account
                </AccountTextLink>
              </SeventySevenText>
            </>
          )}
        </YStack>
      )}
    </AccountScreen>
  );
};

export default SignInScreen;
