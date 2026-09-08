const messages = {
  unauthenticated: 'Please sign in to continue.',
  invalidCredentials: 'The email or password is incorrect. Please try again.',
  accountExists: 'An account already uses this email. Sign in or reset your password.',
  confirmationRequired: 'Please confirm your email before signing in.',
  invalidCode: 'That code is not valid. Check the code and try again.',
  expiredCode: 'That code has expired. Request another code and try again.',
  passwordRejected: 'Choose a password that meets the password requirements.',
  resetRequired: 'Please reset your password before signing in.',
  network: 'We could not connect. Check your connection and try again.',
  rateLimited: 'Too many attempts. Please wait a little before trying again.',
  storage: 'We could not update account information on this device. Please try again.',
  configuration: 'Authentication is unavailable right now. Please try again later.',
  provider: 'We could not complete this request. Please try again.',
  unsupported: 'Real authentication is available only in the iOS and Android app.',
} as const;

export type AuthErrorCode = keyof typeof messages;

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(messages[code]);
    this.name = 'AuthError';
  }
}

export function authError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'UserUnAuthenticatedException':
      return new AuthError('unauthenticated');
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return new AuthError('invalidCredentials');
    case 'UsernameExistsException':
      return new AuthError('accountExists');
    case 'UserNotConfirmedException':
      return new AuthError('confirmationRequired');
    case 'CodeMismatchException':
      return new AuthError('invalidCode');
    case 'ExpiredCodeException':
      return new AuthError('expiredCode');
    case 'InvalidPasswordException':
    case 'PasswordHistoryPolicyViolationException':
      return new AuthError('passwordRejected');
    case 'PasswordResetRequiredException':
      return new AuthError('resetRequired');
    case 'NetworkError':
    case 'TimeoutError':
      return new AuthError('network');
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return new AuthError('rateLimited');
    case 'AuthUserPoolException':
    case 'AuthTokenConfigException':
    case 'InvalidAuthConfigException':
      return new AuthError('configuration');
    default:
      return new AuthError('provider');
  }
}
