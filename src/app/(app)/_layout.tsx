import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '77Faithful' }} />
      <Stack.Screen name="day/[dayNumber]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="journey-complete" options={{ title: 'Journey completion' }} />
    </Stack>
  );
}
