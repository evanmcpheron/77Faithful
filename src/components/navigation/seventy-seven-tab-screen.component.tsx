import { useBottomTabBarHeight } from 'expo-router/tabs';
import type { ReactNode } from 'react';
import { YStack } from 'tamagui';

interface ISeventySevenTabScreenProps {
  children: ReactNode;
}

export const SeventySevenTabScreen = ({ children }: ISeventySevenTabScreenProps) => {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <YStack flex={1} minH={0} pb={tabBarHeight} overflow="hidden">
      {children}
    </YStack>
  );
};
