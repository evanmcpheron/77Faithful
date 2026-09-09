import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { getAccountErrorMessage } from '@77/features/account/account-error';
import { ensureAccountProfile } from '@77/features/account/account-profile.service';
import { AccountScreen } from '@77/features/account/account-screen.component';
import { useAuth } from '@77/providers/auth-provider';
import { Severity } from '@77/types';

export const ConfirmEmailScreen = () => {
  const router = useRouter();
  const { delivery } = useLocalSearchParams<{ delivery?: string }>();
  const { user, isLoading, resendEmailConfirmation, refreshUser, signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    delivery === 'failed'
      ? 'Your account is saved, but we couldn’t send the confirmation email. Request another email below.'
      : null,
  );
  const [hasError, setHasError] = useState(delivery === 'failed');
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const isRequestPending = useRef(false);

  const handleConfirmation = async (shouldResend: boolean) => {
    if (isRequestPending.current) return;
    if (shouldResend && Date.now() < resendAvailableAt) {
      setHasError(false);
      setMessage('Please wait a minute before requesting another email.');
      return;
    }
    isRequestPending.current = true;
    setIsSubmitting(true);
    setMessage(null);
    setHasError(false);
    try {
      if (shouldResend) {
        await resendEmailConfirmation();
        setResendAvailableAt(Date.now() + 60_000);
        setMessage('Confirmation email sent. Check your inbox and spam folder.');
        return;
      }
      const refreshedUser = await refreshUser();
      if (!refreshedUser?.emailVerified) {
        setMessage(
          'Your email isn’t confirmed yet. Open the link in your email, then return here.',
        );
        return;
      }
      await ensureAccountProfile(refreshedUser.uid);
      router.replace('/onboarding');
    } catch (error) {
      setHasError(true);
      setMessage(getAccountErrorMessage(error));
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (isRequestPending.current) return;
    isRequestPending.current = true;
    setIsSubmitting(true);
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      setHasError(true);
      setMessage(getAccountErrorMessage(error));
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AccountScreen
      title="Confirm your email"
      description="Open the confirmation link in your email, then return here to continue. Day 1 hasn’t started yet."
    >
      {isLoading ? (
        <Spinner accessibilityLabel="Loading account" />
      ) : (
        <YStack gap="$4">
          {user ? (
            <>
              <SeventySevenText bold>{user.email}</SeventySevenText>
              <SeventySevenText color="$textSecondary">
                If you don’t see the email, check your spam folder or request another one.
              </SeventySevenText>
              {message ? (
                <SeventySevenText
                  role={hasError ? 'alert' : 'status'}
                  severity={hasError ? Severity.Error : Severity.Default}
                >
                  {message}
                </SeventySevenText>
              ) : null}
              <SeventySevenButton onPress={() => handleConfirmation(false)} disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : 'I’ve confirmed my email'}
              </SeventySevenButton>
              <SeventySevenButton
                onPress={() => handleConfirmation(true)}
                appearance="Outlined"
                disabled={isSubmitting}
              >
                Resend confirmation email
              </SeventySevenButton>
              <SeventySevenButton
                onPress={handleSignOut}
                appearance="Outlined"
                disabled={isSubmitting}
              >
                Sign out
              </SeventySevenButton>
            </>
          ) : (
            <>
              <SeventySevenText>
                Sign in to check your email confirmation or request another email.
              </SeventySevenText>
              <SeventySevenButton href="/sign-in">Sign in</SeventySevenButton>
            </>
          )}
        </YStack>
      )}
    </AccountScreen>
  );
};

export default ConfirmEmailScreen;
