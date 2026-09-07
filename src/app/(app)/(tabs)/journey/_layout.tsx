import { Stack } from 'expo-router';

import { SettingsHeaderAction } from '@/components/settings-header-action';

export default function JourneyLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Journey',
          headerBackVisible: false,
          headerLeft: () => null,
          headerRight: () => <SettingsHeaderAction />,
        }}
      />
    </Stack>
  );
}
