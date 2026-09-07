import { Stack } from 'expo-router';

import { SettingsHeaderAction } from '@/components/settings-header-action';

export default function TodayLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Today',
          headerBackVisible: false,
          headerLeft: () => null,
          headerRight: () => <SettingsHeaderAction />,
        }}
      />
    </Stack>
  );
}
