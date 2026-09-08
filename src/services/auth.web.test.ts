import * as webAuth from './auth.web';
const { authAvailable, restoreAuth } = webAuth;

jest.mock('aws-amplify/auth', () => {
  throw new Error('The web adapter must not import native Auth.');
});
jest.mock('@react-native-async-storage/async-storage', () => {
  throw new Error('The web adapter must not import native storage.');
});

it('keeps the web preview signed out without importing native Auth or storage', async () => {
  expect(authAvailable).toBe(false);
  expect(await restoreAuth()).toEqual({ status: 'signedOut' });
});

it('truthfully rejects every real Auth operation in the synthetic preview', async () => {
  const operations = [
    () => webAuth.createAccount('participant@example.test', 'fixture-password'),
    () => webAuth.signInParticipant('participant@example.test', 'fixture-password'),
    () => webAuth.confirmEmail('registration', '000000'),
    () => webAuth.confirmEmail('attribute', '000000'),
    () => webAuth.resendEmailCode('registration'),
    () => webAuth.resendEmailCode('attribute'),
    () => webAuth.refreshEmailVerification(),
    () => webAuth.requestPasswordReset('participant@example.test'),
    () => webAuth.completePasswordReset('participant@example.test', '000000', 'fixture-password'),
    () => webAuth.cancelSignUp(),
    () => webAuth.signOutParticipant(),
  ];
  for (const operation of operations)
    await expect(operation()).rejects.toMatchObject({ code: 'unsupported' });
});
