import { useRouter } from 'expo-router';
import { validatePassword } from 'firebase/auth';
import { useRef, useState } from 'react';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenNotice, SeventySevenText } from '@77/components/core';
import { SeventySevenFormTextInput, SeventySevenFormTextInputType } from '@77/components/form';
import { getAccountErrorMessage } from '@77/features/account/account-error';
import { ensureAccountProfile } from '@77/features/account/account-profile.service';
import { AccountScreen } from '@77/features/account/account-screen.component';
import { AccountLegalNotice } from '@77/features/account/account-legal-notice.component';
import { AccountTextLink } from '@77/features/account/account-text-link.component';
import { auth } from '@77/lib/firebase';
import { useAuth } from '@77/providers/auth-provider';
import { Severity } from '@77/types';

export const RegisterScreen = () => {
  const router = useRouter();
  const { user, isLoading, signUp, resendEmailConfirmation } = useAuth();
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordPolicyMessage, setPasswordPolicyMessage] = useState<string | null>(null);
  const isRequestPending = useRef(false);
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined
    : 'Enter a valid email address.';
  const passwordError = password.length < 6 ? 'Use at least 6 characters.' : undefined;
  const confirmationError =
    password !== confirmPassword ? 'Your passwords don’t match.' : undefined;

  const handleRegister = async () => {
    if (isRequestPending.current || isLoading) return;
    setHasSubmitted(true);
    setErrorMessage(null);
    setPasswordPolicyMessage(null);
    if (!user && (emailError || passwordError || confirmationError)) return;

    isRequestPending.current = true;
    setIsSubmitting(true);
    let hasCreatedAccount = Boolean(user);

    try {
      if (!user) {
        const passwordStatus = await validatePassword(auth, password);
        if (!passwordStatus.isValid) {
          const requirements: string[] = [];
          if (passwordStatus.meetsMinPasswordLength === false) {
            requirements.push(
              `at least ${passwordStatus.passwordPolicy.customStrengthOptions.minPasswordLength} characters`,
            );
          }
          if (passwordStatus.meetsMaxPasswordLength === false) {
            requirements.push(
              `no more than ${passwordStatus.passwordPolicy.customStrengthOptions.maxPasswordLength} characters`,
            );
          }
          if (passwordStatus.containsLowercaseLetter === false)
            requirements.push('a lowercase letter');
          if (passwordStatus.containsUppercaseLetter === false)
            requirements.push('an uppercase letter');
          if (passwordStatus.containsNumericCharacter === false) requirements.push('a number');
          if (passwordStatus.containsNonAlphanumericCharacter === false)
            requirements.push('a symbol');
          setPasswordPolicyMessage(`Use ${requirements.join(', ')}.`);
          return;
        }
        await signUp(email, password);
        hasCreatedAccount = true;
        setPassword('');
        setConfirmPassword('');
      }

      const registeredUser = auth.currentUser;
      if (!registeredUser) throw new Error('Registration session is unavailable.');
      await ensureAccountProfile(registeredUser.uid, preferredName);
      if (!registeredUser.emailVerified) {
        try {
          await resendEmailConfirmation();
        } catch {
          router.replace({ pathname: '/confirm-email', params: { delivery: 'failed' } });
          return;
        }
      }
      router.replace(registeredUser.emailVerified ? '/onboarding' : '/confirm-email');
    } catch (error) {
      setErrorMessage(
        hasCreatedAccount
          ? `Your account is created, but we couldn’t finish saving your profile. Select Continue to retry. ${getAccountErrorMessage(error)}`
          : getAccountErrorMessage(error),
      );
    } finally {
      isRequestPending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AccountScreen
      title="Create account"
      description="Make room for Scripture, prayer, and faithful action. Create an account to save your 77 days."
    >
      {isLoading ? (
        <Spinner aria-label="Loading account" />
      ) : (
        <YStack gap="$fieldGroup">
          {user ? (
            <SeventySevenText>
              Continue with {user.email} to finish setting up your account.
            </SeventySevenText>
          ) : null}
          <SeventySevenFormTextInput
            label="Preferred name (optional)"
            autoComplete="given-name"
            maxLength={80}
            value={preferredName}
            onChangeText={setPreferredName}
            disabled={isSubmitting}
          />
          {!user ? (
            <>
              <SeventySevenFormTextInput
                label="Email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                errorMessage={hasSubmitted ? emailError : undefined}
                disabled={isSubmitting}
              />
              <SeventySevenFormTextInput
                label="Password"
                autoComplete="new-password"
                type={SeventySevenFormTextInputType.Password}
                value={password}
                onChangeText={setPassword}
                errorMessage={passwordPolicyMessage ?? (hasSubmitted ? passwordError : undefined)}
                disabled={isSubmitting}
              />
              <SeventySevenText color="$textSecondary" fontSize="$3">
                Use at least 6 characters. A longer, unique password helps protect your account.
              </SeventySevenText>
              <SeventySevenFormTextInput
                label="Confirm password"
                autoComplete="new-password"
                type={SeventySevenFormTextInputType.Password}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                errorMessage={hasSubmitted ? confirmationError : undefined}
                disabled={isSubmitting}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </>
          ) : null}
          {errorMessage ? (
            <SeventySevenNotice severity={Severity.Error}>{errorMessage}</SeventySevenNotice>
          ) : null}
          <AccountLegalNotice action="creating an account" disabled={isSubmitting} />
          <SeventySevenButton
            onPress={handleRegister}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {user ? 'Continue' : 'Create account'}
          </SeventySevenButton>
          <SeventySevenText color="$textSecondary" fontSize="$3">
            Creating an account doesn’t start Day 1. You’ll confirm your email before setting up
            your 77 days.
          </SeventySevenText>
          <SeventySevenText alignment="Center" color="$textSecondary">
            Already have an account?{' '}
            <AccountTextLink href="/sign-in" disabled={isSubmitting}>
              Sign in
            </AccountTextLink>
          </SeventySevenText>
        </YStack>
      )}
    </AccountScreen>
  );
};

export default RegisterScreen;
