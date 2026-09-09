import { Slot } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { tamaguiConfig } from '../../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const defaultTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={defaultTheme}>
      <Slot />
    </TamaguiProvider>
  );
}
