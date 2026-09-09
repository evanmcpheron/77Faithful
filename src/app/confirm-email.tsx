import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ScrollView, Separator, Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { getAccountErrorMessage } from '@77/features/account/account-error';
import { ensureAccountProfile } from '@77/features/account/account-profile.service';
import { useAuth } from '@77/providers/auth-provider';

export const ConfirmEmailScreen = () => {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
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
        setMessage(
          'Confirmation email sent. Check your inbox, including your spam or junk folder.',
        );
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
    <ScrollView bg="$background" contentContainerStyle={{ grow: 1 }}>
      <YStack
        flex={1}
        justify="center"
        pt={safeAreaInsets.top + 32}
        pb={safeAreaInsets.bottom + 24}
        pl={safeAreaInsets.left + 20}
        pr={safeAreaInsets.right + 20}
      >
        <YStack width="100%" maxW={480} self="center" gap="$5">
          <SeventySevenText alignment="Center" bold color="$textSecondary" letterSpacing={1}>
            77Faithful
          </SeventySevenText>
          <YStack
            bg="$surface"
            borderWidth={1}
            borderColor="$borderSubtle"
            rounded="$6"
            p="$5"
            gap="$5"
          >
            <YStack gap="$3">
              <SeventySevenText color="$link" bold fontSize="$2" letterSpacing={1.5}>
                Email confirmation
              </SeventySevenText>
              <SeventySevenText size="Heading" role="heading" aria-level={1}>
                Check your inbox
              </SeventySevenText>
              <SeventySevenText color="$textSecondary">
                Open the confirmation link in your email, then come back here to continue.
              </SeventySevenText>
            </YStack>
            {isLoading ? (
              <Spinner aria-label="Loading account" />
            ) : user ? (
              <>
                <YStack bg="$surfaceElevated" rounded="$4" p="$4" gap="$2">
                  <SeventySevenText color="$textSecondary" fontSize="$2">
                    Your email address
                  </SeventySevenText>
                  <SeventySevenText bold selectable style={{ overflowWrap: 'anywhere' }}>
                    {user.email ?? 'No email address available'}
                  </SeventySevenText>
                </YStack>
                <YStack gap="$3">
                  {message ? (
                    <YStack bg={hasError ? '$errorSoft' : '$infoSurface'} rounded="$3" p="$3">
                      <SeventySevenText
                        role={hasError ? 'alert' : 'status'}
                        color={hasError ? '$errorText' : '$infoText'}
                      >
                        {message}
                      </SeventySevenText>
                    </YStack>
                  ) : null}
                  <SeventySevenButton
                    onPress={() => handleConfirmation(false)}
                    isLoading={isSubmitting}
                  >
                    I’ve confirmed my email
                  </SeventySevenButton>
                </YStack>
                <Separator borderColor="$borderSubtle" />
                <YStack gap="$1" items="center">
                  <SeventySevenText bold alignment="Center">
                    Don’t see the email?
                  </SeventySevenText>
                  <SeventySevenText color="$textSecondary" alignment="Center">
                    Check your spam or junk folder. If you still don’t see it, request another
                    email.
                  </SeventySevenText>
                  <Button
                    chromeless
                    minH={44}
                    onPress={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                    opacity={isSubmitting ? 0.5 : 1}
                  >
                    <SeventySevenText color="$link" bold>
                      Resend email
                    </SeventySevenText>
                  </Button>
                </YStack>
              </>
            ) : (
              <YStack gap="$4">
                <SeventySevenText color="$textSecondary">
                  Sign in to check your email confirmation or request another email.
                </SeventySevenText>
                <SeventySevenButton href="/sign-in">Sign in</SeventySevenButton>
              </YStack>
            )}
          </YStack>
          <YStack items="center" gap="$2">
            <SeventySevenText alignment="Center" color="$textSecondary" fontSize="$2">
              Confirming your email won’t start Day 1.
            </SeventySevenText>
            {user ? (
              <Button
                chromeless
                minH={44}
                onPress={handleSignOut}
                disabled={isSubmitting}
                opacity={isSubmitting ? 0.5 : 1}
              >
                <SeventySevenText color="$textSecondary" fontSize="$2">
                  Sign out
                </SeventySevenText>
              </Button>
            ) : null}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default ConfirmEmailScreen;
