import { Amplify } from 'aws-amplify';
import {
  confirmSignUp,
  confirmResetPassword,
  confirmUserAttribute,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  sendUserAttributeVerificationCode,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

import { AuthError, authError } from '@/auth/errors';
import type { EmailVerificationMode, ResolvedAuthState, SignInResult } from '@/auth/types';

import './amplify';
import {
  clearPendingConfirmation,
  loadPendingConfirmation,
  savePendingConfirmation,
} from './pending-confirmation';

export const authAvailable = true;

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const result = await resetPassword({ username: email });
    if (
      result.isPasswordReset ||
      result.nextStep.resetPasswordStep !== 'CONFIRM_RESET_PASSWORD_WITH_CODE'
    ) {
      throw new AuthError('configuration');
    }
  } catch (error) {
    const failure = authError(error);
    if (failure.code === 'invalidCredentials' || failure.code === 'confirmationRequired') {
      throw new AuthError('provider');
    }
    throw failure;
  }
}

export async function completePasswordReset(
  email: string,
  code: string,
  password: string,
): Promise<void> {
  try {
    await confirmResetPassword({ username: email, confirmationCode: code, newPassword: password });
  } catch (error) {
    throw authError(error);
  }
}

export async function signInParticipant(email: string, password: string): Promise<SignInResult> {
  let result;
  try {
    result = await signIn({ username: email, password });
  } catch (error) {
    const failure = authError(error);
    if (failure.code === 'confirmationRequired') {
      await savePendingConfirmation(email);
      return 'confirmationPending';
    }
    if (failure.code === 'resetRequired') return 'resetPassword';
    throw failure;
  }
  if (result.isSignedIn && result.nextStep.signInStep === 'DONE') return 'signedIn';
  if (!result.isSignedIn && result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
    await savePendingConfirmation(email);
    return 'confirmationPending';
  }
  if (!result.isSignedIn && result.nextStep.signInStep === 'RESET_PASSWORD') return 'resetPassword';
  throw new AuthError('configuration');
}

async function pendingEmail(): Promise<string> {
  const email = await loadPendingConfirmation();
  if (!email) throw new AuthError('confirmationRequired');
  return email;
}

export async function confirmEmail(mode: EmailVerificationMode, code: string): Promise<void> {
  try {
    if (mode === 'registration') {
      const result = await confirmSignUp({
        username: await pendingEmail(),
        confirmationCode: code,
      });
      if (!result.isSignUpComplete || result.nextStep.signUpStep !== 'DONE')
        throw new AuthError('configuration');
      await clearPendingConfirmation();
    } else {
      await confirmUserAttribute({ userAttributeKey: 'email', confirmationCode: code });
    }
  } catch (error) {
    throw authError(error);
  }
}

export async function resendEmailCode(mode: EmailVerificationMode): Promise<void> {
  try {
    if (mode === 'registration') await resendSignUpCode({ username: await pendingEmail() });
    else await sendUserAttributeVerificationCode({ userAttributeKey: 'email' });
  } catch (error) {
    throw authError(error);
  }
}

export async function refreshEmailVerification(): Promise<void> {
  try {
    await fetchAuthSession({ forceRefresh: true });
  } catch (error) {
    throw authError(error);
  }
}

export async function cancelSignUp(): Promise<void> {
  await clearPendingConfirmation();
}

export async function signOutParticipant(): Promise<void> {
  try {
    await clearPendingConfirmation();
    await signOut();
    try {
      await getCurrentUser();
    } catch (error) {
      if (authError(error).code === 'unauthenticated') return;
      throw error;
    }
    throw new AuthError('provider');
  } catch (error) {
    throw authError(error);
  }
}

export function passwordRequirements(): string | undefined {
  const policy = Amplify.getConfig().Auth?.Cognito?.passwordFormat;
  if (!policy) return undefined;
  const requirements = [
    policy.minLength && `at least ${policy.minLength} characters`,
    policy.requireLowercase && 'a lowercase letter',
    policy.requireUppercase && 'an uppercase letter',
    policy.requireNumbers && 'a number',
    policy.requireSpecialCharacters && 'a symbol',
  ].filter(Boolean);
  return requirements.length ? `Use ${requirements.join(', ')}.` : undefined;
}

export async function createAccount(email: string, password: string): Promise<void> {
  try {
    const result = await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
    if (result.nextStep.signUpStep !== 'CONFIRM_SIGN_UP' || result.isSignUpComplete) {
      throw new AuthError('configuration');
    }
    await savePendingConfirmation(email);
  } catch (error) {
    throw authError(error);
  }
}

export async function restoreAuth(): Promise<ResolvedAuthState> {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (error) {
      if (authError(error).code !== 'unauthenticated') throw error;
      const email = await loadPendingConfirmation();
      return email ? { status: 'confirmationPending', email } : { status: 'signedOut' };
    }
    const attributes = await fetchUserAttributes();
    if (!user.userId || (attributes.sub && attributes.sub !== user.userId)) {
      throw new AuthError('configuration');
    }
    const participant = {
      userId: user.userId,
      ...(attributes.email ? { email: attributes.email } : {}),
      emailVerified: attributes.email_verified === 'true',
    };
    await clearPendingConfirmation();
    return { status: participant.emailVerified ? 'verified' : 'unverified', participant };
  } catch (error) {
    throw authError(error);
  }
}
