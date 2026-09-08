import type { EmailVerificationMode, ResolvedAuthState, SignInResult } from '@/auth/types';
import { AuthError } from '@/auth/errors';

export const authAvailable = false;

export async function requestPasswordReset(_email: string): Promise<void> {
  throw new AuthError('unsupported');
}

export async function completePasswordReset(
  _email: string,
  _code: string,
  _password: string,
): Promise<void> {
  throw new AuthError('unsupported');
}

export async function signInParticipant(_email: string, _password: string): Promise<SignInResult> {
  throw new AuthError('unsupported');
}

export async function confirmEmail(_mode: EmailVerificationMode, _code: string): Promise<void> {
  throw new AuthError('unsupported');
}
export async function resendEmailCode(_mode: EmailVerificationMode): Promise<void> {
  throw new AuthError('unsupported');
}
export async function refreshEmailVerification(): Promise<void> {
  throw new AuthError('unsupported');
}
export async function cancelSignUp(): Promise<void> {
  throw new AuthError('unsupported');
}
export async function signOutParticipant(): Promise<void> {
  throw new AuthError('unsupported');
}

export function passwordRequirements(): string | undefined {
  return undefined;
}

export async function createAccount(_email: string, _password: string): Promise<void> {
  throw new AuthError('unsupported');
}

export async function restoreAuth(): Promise<ResolvedAuthState> {
  return { status: 'signedOut' };
}
