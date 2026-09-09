import { StatusBar } from 'expo-status-bar';
import { Text, YStack } from 'tamagui';

export default function HomeScreen() {
  return (
    <YStack flex={1} items="center" justify="center" bg="$background">
      <Text color="$color">welcome</Text>
      <StatusBar style="auto" />
    </YStack>
  );
}
