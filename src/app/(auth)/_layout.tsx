import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'auth/welcome' };

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="auth/welcome" options={{ title: 'Welcome', headerShown: false }} />
      <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} />
      <Stack.Screen name="auth/sign-up" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="auth/forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="auth/verify-email" options={{ title: 'Verify Email' }} />
    </Stack>
  );
}
