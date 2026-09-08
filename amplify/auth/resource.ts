import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      otpLogin: false,
      verificationEmailStyle: 'CODE',
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OFF',
  },
});
