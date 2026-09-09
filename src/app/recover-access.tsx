import { useRef, useState } from 'react';
import { YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { SeventySevenFormTextInput } from '@77/components/form';
import { getAccountErrorMessage } from '@77/features/account/account-error';
import { AccountScreen } from '@77/features/account/account-screen.component';
import { useAuth } from '@77/providers/auth-provider';
import { Severity } from '@77/types';

export const RecoverAccessScreen = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestPending = useRef(false);

  const handleResetPassword = async () => {
    if (isRequestPending.current) return;
    setErrorMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    isRequestPending.current = true;
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setHasSentRequest(true);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'auth/user-not-found'
      ) {
        setHasSentRequest(true);
      } else {
        setErrorMessage(getAccountErrorMessage(error));
      }
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AccountScreen
      title="Reset your password"
      description="Enter your account email to request a password reset link."
    >
      <YStack gap="$4">
        {hasSentRequest ? (
          <SeventySevenText role="status">
            If an account can use this email, you’ll receive a password reset link. Check your inbox
            and spam folder.
          </SeventySevenText>
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
              onSubmitEditing={handleResetPassword}
              returnKeyType="send"
            />
            {errorMessage ? (
              <SeventySevenText severity={Severity.Error} role="alert">
                {errorMessage}
              </SeventySevenText>
            ) : null}
            <SeventySevenButton onPress={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting ? 'Sending request…' : 'Send reset link'}
            </SeventySevenButton>
          </>
        )}
        <SeventySevenButton href="/sign-in" appearance="Outlined" disabled={isSubmitting}>
          Back to sign in
        </SeventySevenButton>
      </YStack>
    </AccountScreen>
  );
};

export default RecoverAccessScreen;
