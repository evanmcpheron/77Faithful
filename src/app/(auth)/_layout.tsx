import { Stack } from 'expo-router';

import { useAuth } from '@/auth/auth-provider';

export const unstable_settings = { initialRouteName: 'auth/welcome' };

export default function AuthLayout() {
  const { state, signedOutDestination } = useAuth();
  return (
    <Stack
      key={state.status === 'signedOut' ? signedOutDestination : 'verification'}
      initialRouteName={
        state.status !== 'signedOut'
          ? 'auth/verify-email'
          : signedOutDestination === '/auth/sign-in'
            ? 'auth/sign-in'
            : 'auth/welcome'
      }>
      <Stack.Protected guard={state.status === 'signedOut'}>
        <Stack.Screen name="auth/welcome" options={{ title: 'Welcome', headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} />
        <Stack.Screen name="auth/sign-up" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="auth/forgot-password" options={{ title: 'Forgot Password' }} />
      </Stack.Protected>
      <Stack.Protected
        guard={state.status === 'confirmationPending' || state.status === 'unverified'}>
        <Stack.Screen
          name="auth/verify-email"
          options={{ title: 'Verify Email', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack.Protected>
    </Stack>
  );
}
