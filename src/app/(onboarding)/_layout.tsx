import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'onboarding/index' };

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="onboarding/index" options={{ title: 'Your 77-day journey' }} />
      <Stack.Screen name="onboarding/practices" options={{ title: 'Choose practices' }} />
      <Stack.Screen name="onboarding/bible-translation" options={{ title: 'Bible translation' }} />
      <Stack.Screen name="onboarding/confirm" options={{ title: 'Review your choices' }} />
    </Stack>
  );
}
