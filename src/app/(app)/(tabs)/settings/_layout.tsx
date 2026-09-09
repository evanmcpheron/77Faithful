import { Stack } from 'expo-router';
import { useTheme } from 'tamagui';

export const unstable_settings = { initialRouteName: 'index' };

const SettingsLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.color.val,
        headerStyle: { backgroundColor: theme.background.val },
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="practices" options={{ title: 'My Practices' }} />
      <Stack.Screen name="account/index" options={{ title: 'Account' }} />
      <Stack.Screen name="account/delete" options={{ title: 'Delete account' }} />
    </Stack>
  );
};

export default SettingsLayout;
