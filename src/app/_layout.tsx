import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { colors } from '@77/constants/colors';
import { AuthProvider } from '@77/providers/auth-provider';

import { tamaguiConfig } from '../../tamagui.config';

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const defaultTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={defaultTheme}>
      <AuthProvider>
        <StatusBar style={defaultTheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors[defaultTheme].background },
          }}
        />
      </AuthProvider>
    </TamaguiProvider>
  );
};

export default RootLayout;
