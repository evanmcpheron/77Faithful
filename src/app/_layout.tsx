import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { colors } from '@77/constants/colors';
import { AccountRouteGuard } from '@77/features/navigation/account-route-guard.component';
import { useJourneyAccess } from '@77/features/navigation/use-journey-access.hook';
import { AuthProvider, useAuth } from '@77/providers/auth-provider';

import { tamaguiConfig } from '../../tamagui.config';

const AccountNavigator = ({ defaultTheme }: { defaultTheme: 'light' | 'dark' }) => {
  const { user } = useAuth();
  const journeyAccess = useJourneyAccess(user?.emailVerified ? user.uid : null);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors[defaultTheme].background },
      }}
      screenLayout={({ children, route }) => (
        <AccountRouteGuard routeName={route.name} journeyAccess={journeyAccess}>
          {children}
        </AccountRouteGuard>
      )}
    />
  );
};

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const defaultTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={defaultTheme}>
      <AuthProvider>
        <StatusBar style={defaultTheme === 'dark' ? 'light' : 'dark'} />
        <AccountNavigator defaultTheme={defaultTheme} />
      </AuthProvider>
    </TamaguiProvider>
  );
};

export default RootLayout;
