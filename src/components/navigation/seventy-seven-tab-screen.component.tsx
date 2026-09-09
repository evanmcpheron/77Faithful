import { useBottomTabBarHeight } from 'expo-router/tabs';
import type { ReactNode } from 'react';
import { createContext } from 'react';
import { YStack } from 'tamagui';

interface ISeventySevenTabScreenProps {
  children: ReactNode;
}

export const SeventySevenTabScreenContext = createContext(false);

export const SeventySevenTabScreen = ({ children }: ISeventySevenTabScreenProps) => {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SeventySevenTabScreenContext.Provider value>
      <YStack flex={1} minH={0} pb={tabBarHeight} bg="$background" overflow="hidden">
        {children}
      </YStack>
    </SeventySevenTabScreenContext.Provider>
  );
};
