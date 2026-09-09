import { Stack } from 'expo-router';
import { useTheme } from 'tamagui';

export const unstable_settings = { initialRouteName: 'journey' };

const JourneyLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.color.val,
        headerStyle: { backgroundColor: theme.background.val },
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen name="journey" options={{ headerShown: false }} />
      <Stack.Screen name="reflections" options={{ title: 'Saved reflections' }} />
    </Stack>
  );
};

export default JourneyLayout;
