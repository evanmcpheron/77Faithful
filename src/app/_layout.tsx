import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from '@/auth/auth-provider';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LoadingPlaceholder } from '@/components/loading-placeholder';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import '@/services/amplify';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { state, participantStage } = useAuth();
  const colorScheme = useColorScheme();
  const colors = useTheme();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.link,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };
  return (
    <ThemeProvider value={navigationTheme}>
      <AnimatedSplashOverlay ready={state.status !== 'restoring'} />
      {state.status === 'restoring' ? (
        <ScreenScrollView headerless>
          <LoadingPlaceholder label="Restoring your account…" />
        </ScreenScrollView>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Protected
            guard={['signedOut', 'confirmationPending', 'unverified'].includes(state.status)}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected
            guard={state.status === 'verified' && participantStage.status === 'incomplete'}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected
            guard={state.status === 'verified' && participantStage.status === 'complete'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
