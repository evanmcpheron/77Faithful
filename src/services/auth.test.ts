import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  confirmResetPassword,
  confirmSignUp,
  confirmUserAttribute,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resetPassword,
  resendSignUpCode,
  sendUserAttributeVerificationCode,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

import { AuthError } from '@/auth/errors';

import {
  cancelSignUp,
  confirmEmail,
  completePasswordReset,
  requestPasswordReset,
  createAccount,
  refreshEmailVerification,
  resendEmailCode,
  restoreAuth,
  signInParticipant,
  signOutParticipant,
} from './auth';
import {
  clearPendingConfirmation,
  loadPendingConfirmation,
  savePendingConfirmation,
} from './pending-confirmation';

jest.mock('./amplify', () => ({}));
jest.mock('aws-amplify', () => ({ Amplify: { getConfig: () => ({}) } }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  confirmUserAttribute: jest.fn(),
  fetchAuthSession: jest.fn(),
  resendSignUpCode: jest.fn(),
  sendUserAttributeVerificationCode: jest.fn(),
  resetPassword: jest.fn(),
  confirmResetPassword: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

const email = 'participant@example.test';
const signedOutError = Object.assign(new Error('private provider detail'), {
  name: 'UserUnAuthenticatedException',
});

beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(getCurrentUser).mockReset();
  jest.mocked(fetchUserAttributes).mockReset();
  jest.mocked(signUp).mockReset();
  jest.mocked(signIn).mockReset();
  jest.mocked(resetPassword).mockReset();
  jest.mocked(confirmResetPassword).mockReset();
  jest.mocked(confirmSignUp).mockReset();
  jest.mocked(confirmUserAttribute).mockReset().mockResolvedValue(undefined);
  jest.mocked(fetchAuthSession).mockReset().mockResolvedValue({});
  jest.mocked(signOut).mockReset().mockResolvedValue(undefined);
  await AsyncStorage.clear();
  jest.mocked(getCurrentUser).mockRejectedValue(signedOutError);
});

it('confirms sign-up and clears only pending confirmation without pretending to sign in', async () => {
  await savePendingConfirmation(email);
  jest
    .mocked(confirmSignUp)
    .mockResolvedValue({ isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } });
  jest.mocked(AsyncStorage.setItem).mockClear();
  await confirmEmail('registration', '000000');
  expect(confirmSignUp).toHaveBeenCalledWith({ username: email, confirmationCode: '000000' });
  expect(await restoreAuth()).toEqual({ status: 'signedOut' });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(confirmUserAttribute).not.toHaveBeenCalled();
});

it.each(['CodeMismatchException', 'ExpiredCodeException', 'NetworkError'])(
  'retains confirmation state after %s',
  async (name) => {
    await savePendingConfirmation(email);
    jest.mocked(confirmSignUp).mockRejectedValue(Object.assign(new Error('private'), { name }));
    await expect(confirmEmail('registration', '000000')).rejects.toBeInstanceOf(AuthError);
    expect(await loadPendingConfirmation()).toBe(email);
  },
);

it('uses separate registration and authenticated resend APIs', async () => {
  await savePendingConfirmation(email);
  await resendEmailCode('registration');
  expect(resendSignUpCode).toHaveBeenCalledWith({ username: email });
  await resendEmailCode('attribute');
  expect(sendUserAttributeVerificationCode).toHaveBeenCalledWith({ userAttributeKey: 'email' });
});

it('confirms the authenticated attribute, refreshes authorization, and reads authoritative verification', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ userId: 'fixture-sub', username: email });
  jest.mocked(fetchUserAttributes).mockResolvedValue({ email, email_verified: 'false' });
  await confirmEmail('attribute', '000000');
  await refreshEmailVerification();
  expect(confirmUserAttribute).toHaveBeenCalledWith({
    userAttributeKey: 'email',
    confirmationCode: '000000',
  });
  expect(fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true });
  expect(await restoreAuth()).toMatchObject({ status: 'unverified' });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('allows cancellation and basic sign-out to clear pending confirmation', async () => {
  await savePendingConfirmation(email);
  await cancelSignUp();
  expect(await loadPendingConfirmation()).toBeNull();
  await savePendingConfirmation(email);
  await signOutParticipant();
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(await restoreAuth()).toEqual({ status: 'signedOut' });
});

it('does not report sign-out success when the provider rejects or a session remains', async () => {
  jest.mocked(signOut).mockRejectedValueOnce(new Error('private provider error'));
  await expect(signOutParticipant()).rejects.toEqual(new AuthError('provider'));
  jest.mocked(getCurrentUser).mockResolvedValue({ userId: 'fixture-sub', username: email });
  await expect(signOutParticipant()).rejects.toEqual(new AuthError('provider'));
});

it('creates only an identity and records confirmation after provider success', async () => {
  const pending = Promise.withResolvers<Awaited<ReturnType<typeof signUp>>>();
  jest.mocked(signUp).mockReturnValue(pending.promise);
  const request = createAccount(email, 'fixture-password');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  pending.resolve({
    isSignUpComplete: false,
    nextStep: { signUpStep: 'CONFIRM_SIGN_UP', codeDeliveryDetails: {} },
  });
  await request;
  expect(signUp).toHaveBeenCalledWith({
    username: email,
    password: 'fixture-password',
    options: { userAttributes: { email } },
  });
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    '77faithful.auth.pending-confirmation',
    JSON.stringify({ version: 1, email }),
  );
  expect(await restoreAuth()).toEqual({ status: 'confirmationPending', email });
});

it.each([
  ['UsernameExistsException', 'accountExists'],
  ['InvalidPasswordException', 'passwordRejected'],
  ['NetworkError', 'network'],
] as const)('maps sign-up %s without saving credentials', async (name, code) => {
  jest.mocked(signUp).mockRejectedValue(Object.assign(new Error('private'), { name }));
  await expect(createAccount(email, 'fixture-password')).rejects.toEqual(new AuthError(code));
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('rejects auto-confirmed or auto-sign-in sign-up outcomes', async () => {
  jest
    .mocked(signUp)
    .mockResolvedValue({ isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } });
  await expect(createAccount(email, 'fixture-password')).rejects.toEqual(
    new AuthError('configuration'),
  );
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it.each(['true', 'false', undefined])(
  'restores authoritative verification %s',
  async (verified) => {
    jest
      .mocked(getCurrentUser)
      .mockResolvedValue({ userId: 'immutable-sub', username: 'provider-name' });
    jest.mocked(fetchUserAttributes).mockResolvedValue({
      sub: 'immutable-sub',
      email,
      email_verified: verified,
    });
    expect(await restoreAuth()).toEqual({
      status: verified === 'true' ? 'verified' : 'unverified',
      participant: { userId: 'immutable-sub', email, emailVerified: verified === 'true' },
    });
  },
);

it('treats an absent session as signed out', async () => {
  expect(await restoreAuth()).toEqual({ status: 'signedOut' });
  expect(fetchUserAttributes).not.toHaveBeenCalled();
});

it('does not turn a provider failure into signed out or expose its message', async () => {
  jest.mocked(getCurrentUser).mockRejectedValue(new Error('private provider detail'));
  await expect(restoreAuth()).rejects.toEqual(new AuthError('provider'));
});

it('rejects an inconsistent identity', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ userId: 'immutable-sub', username: email });
  jest.mocked(fetchUserAttributes).mockResolvedValue({ sub: 'different-sub' });
  await expect(restoreAuth()).rejects.toEqual(new AuthError('configuration'));
});

it('durably restores only pending email and clears it on cancellation', async () => {
  await savePendingConfirmation(email);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    '77faithful.auth.pending-confirmation',
    JSON.stringify({ version: 1, email }),
  );
  expect(await restoreAuth()).toEqual({ status: 'confirmationPending', email });
  await clearPendingConfirmation();
  expect(await restoreAuth()).toEqual({ status: 'signedOut' });
});

it('clears stale pending confirmation when a session exists', async () => {
  await savePendingConfirmation(email);
  jest.mocked(getCurrentUser).mockResolvedValue({ userId: 'immutable-sub', username: email });
  jest.mocked(fetchUserAttributes).mockResolvedValue({ email, email_verified: 'true' });
  await restoreAuth();
  expect(await loadPendingConfirmation()).toBeNull();
});

it.each([
  '{',
  '{}',
  'null',
  '{"version":1,"email":42}',
  '{"version":2,"email":"a@b.test"}',
  '{"version":1,"email":"a@b.test","password":"must-discard"}',
])('discards malformed stored confirmation %s', async (stored) => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(stored);
  expect(await loadPendingConfirmation()).toBeNull();
  expect(AsyncStorage.removeItem).toHaveBeenCalled();
});

it('reports storage failures safely', async () => {
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error(email));
  await expect(restoreAuth()).rejects.toEqual(new AuthError('storage'));
});

it.each([
  ['DONE', true, 'signedIn'],
  ['CONFIRM_SIGN_UP', false, 'confirmationPending'],
  ['RESET_PASSWORD', false, 'resetPassword'],
] as const)('handles SRP sign-in outcome %s', async (signInStep, isSignedIn, expected) => {
  jest.mocked(signIn).mockResolvedValue({ isSignedIn, nextStep: { signInStep } });
  expect(await signInParticipant(email, 'fixture-password')).toBe(expected);
  expect(signIn).toHaveBeenCalledWith({ username: email, password: 'fixture-password' });
  expect(await loadPendingConfirmation()).toBe(expected === 'confirmationPending' ? email : null);
  expect(JSON.stringify(jest.mocked(AsyncStorage.setItem).mock.calls)).not.toContain(
    'fixture-password',
  );
});

it.each(['CONFIRM_SIGN_IN_WITH_TOTP_CODE', 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'] as const)(
  'rejects incompatible sign-in step %s',
  async (signInStep) => {
    jest.mocked(signIn).mockResolvedValue({ isSignedIn: false, nextStep: { signInStep } });
    await expect(signInParticipant(email, 'fixture-password')).rejects.toMatchObject({
      code: 'configuration',
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  },
);

it.each([
  ['UserNotConfirmedException', 'confirmationPending'],
  ['PasswordResetRequiredException', 'resetPassword'],
])('handles provider exception %s as a continuation', async (name, expected) => {
  jest.mocked(signIn).mockRejectedValue(Object.assign(new Error('private'), { name }));
  expect(await signInParticipant(email, 'fixture-password')).toBe(expected);
});

it.each([
  ['NotAuthorizedException', 'invalidCredentials'],
  ['NetworkError', 'network'],
])('safely maps %s without persisting unsuccessful sign-in', async (name, code) => {
  jest.mocked(signIn).mockRejectedValue(Object.assign(new Error('private'), { name }));
  await expect(signInParticipant(email, 'fixture-password')).rejects.toMatchObject({ code });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('requests and resends a code through resetPassword without retaining secrets', async () => {
  jest.mocked(resetPassword).mockResolvedValue({
    isPasswordReset: false,
    nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE', codeDeliveryDetails: {} },
  });
  await requestPasswordReset(email);
  await requestPasswordReset(email);
  expect(resetPassword).toHaveBeenCalledTimes(2);
  expect(resetPassword).toHaveBeenCalledWith({ username: email });
  jest.mocked(confirmResetPassword).mockResolvedValue(undefined);
  await completePasswordReset(email, '000000', 'new-fixture-password');
  expect(confirmResetPassword).toHaveBeenCalledWith({
    username: email,
    confirmationCode: '000000',
    newPassword: 'new-fixture-password',
  });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('rejects reset request success without the expected code step', async () => {
  jest.mocked(resetPassword).mockResolvedValue({
    isPasswordReset: true,
    nextStep: { resetPasswordStep: 'DONE', codeDeliveryDetails: {} },
  });
  await expect(requestPasswordReset(email)).rejects.toMatchObject({ code: 'configuration' });
});

it.each(['UserNotFoundException', 'UserNotConfirmedException'])(
  'does not reveal account status for recovery exception %s',
  async (name) => {
    jest.mocked(resetPassword).mockRejectedValue(Object.assign(new Error('private'), { name }));
    await expect(requestPasswordReset(email)).rejects.toMatchObject({ code: 'provider' });
  },
);

it.each([
  ['CodeMismatchException', 'invalidCode'],
  ['ExpiredCodeException', 'expiredCode'],
  ['InvalidPasswordException', 'passwordRejected'],
  ['NetworkError', 'network'],
])(
  'maps reset confirmation failure %s without persisting the code or password',
  async (name, code) => {
    jest
      .mocked(confirmResetPassword)
      .mockRejectedValue(Object.assign(new Error('private'), { name }));
    await expect(
      completePasswordReset(email, '000000', 'new-fixture-password'),
    ).rejects.toMatchObject({ code });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  },
);

it('fails safely when session refresh or authoritative attributes cannot be fetched', async () => {
  const failure = Object.assign(new Error('private'), { name: 'NetworkError' });
  jest.mocked(fetchAuthSession).mockRejectedValueOnce(failure);
  await expect(refreshEmailVerification()).rejects.toEqual(new AuthError('network'));
  jest.mocked(getCurrentUser).mockResolvedValue({ userId: 'fixture-sub', username: email });
  jest.mocked(fetchUserAttributes).mockRejectedValueOnce(failure);
  await expect(restoreAuth()).rejects.toEqual(new AuthError('network'));
});

it('does not expose SDK sign-in details or attributes beyond application identity', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({
    userId: 'immutable-sub',
    username: 'provider-name',
    signInDetails: { loginId: email, authFlowType: 'USER_SRP_AUTH' },
  });
  jest.mocked(fetchUserAttributes).mockResolvedValue({
    sub: 'immutable-sub',
    email,
    email_verified: 'true',
    name: 'private unused attribute',
  });
  expect(await restoreAuth()).toStrictEqual({
    status: 'verified',
    participant: { userId: 'immutable-sub', email, emailVerified: true },
  });
});

it('fails closed if pending state cannot be read or cleaned up', async () => {
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('private storage detail'));
  await expect(restoreAuth()).rejects.toEqual(new AuthError('storage'));
  jest.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(new Error('private storage detail'));
  await expect(signOutParticipant()).rejects.toEqual(new AuthError('storage'));
  expect(signOut).not.toHaveBeenCalled();
});
