import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="practices" options={{ title: 'Optional practices' }} />
      <Stack.Screen name="bible-translation" options={{ title: 'Bible translation' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy & Data' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="account/delete" options={{ title: 'Delete Account' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="help-feedback" options={{ title: 'Help / Feedback' }} />
    </Stack>
  );
}
