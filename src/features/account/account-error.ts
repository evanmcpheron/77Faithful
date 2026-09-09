import { FirebaseError } from 'firebase/app';

export const getAccountErrorMessage = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return 'We couldn’t complete that step. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Choose a stronger password and try again.';
    case 'auth/email-already-in-use':
    case 'auth/invalid-credential':
      return 'We couldn’t use those account details. Try signing in or resetting your password.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Please wait a few minutes before trying again.';
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code':
      return 'This confirmation link has expired or was already used. Check your confirmation or request another email.';
    default:
      return 'We couldn’t complete that step. Please try again.';
  }
};
