import type { AuthError } from './errors';

export type EmailVerificationMode = 'registration' | 'attribute';
export type SignInResult = 'signedIn' | 'confirmationPending' | 'resetPassword';

export type Participant = {
  userId: string;
  email?: string;
  emailVerified: boolean;
};

export type ResolvedAuthState =
  | { status: 'signedOut' }
  | { status: 'confirmationPending'; email: string }
  | { status: 'unverified'; participant: Participant }
  | { status: 'verified'; participant: Participant };

export type AuthState =
  ResolvedAuthState | { status: 'restoring' } | { status: 'restoreError'; error: AuthError };
