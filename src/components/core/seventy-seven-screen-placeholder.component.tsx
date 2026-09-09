import { HeaderShownContext } from 'expo-router/react-navigation';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { SeventySevenTabScreenContext } from '@77/components/navigation/seventy-seven-tab-screen.component';

import {
  SeventySevenText,
  SeventySevenTextAlignment,
  SeventySevenTextSize,
} from './seventy-seven-text.component';

interface ISeventySevenScreenPlaceholderProps {
  title: string;
}

export const SeventySevenScreenPlaceholder = ({ title }: ISeventySevenScreenPlaceholderProps) => {
  const safeAreaInsets = useSafeAreaInsets();
  const hasNativeHeader = useContext(HeaderShownContext);
  const hasTabBar = useContext(SeventySevenTabScreenContext);

  return (
    <YStack
      flex={1}
      bg="$background"
      pt={hasNativeHeader ? 0 : safeAreaInsets.top}
      pb={hasTabBar ? 0 : safeAreaInsets.bottom}
      pl={safeAreaInsets.left}
      pr={safeAreaInsets.right}
    >
      <YStack flex={1} items="center" justify="center" px="$section">
        <SeventySevenText
          size={SeventySevenTextSize.Heading}
          alignment={SeventySevenTextAlignment.Center}
          maxW="100%"
          role="heading"
          aria-level={1}
          allowFontScaling
        >
          {title}
        </SeventySevenText>
      </YStack>
    </YStack>
  );
};
