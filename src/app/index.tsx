import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import {
  SeventySevenButton,
  SeventySevenText,
  SeventySevenTextAlignment,
  SeventySevenTextSize,
} from '@77/components/core';

const WelcomeScreen = () => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <YStack
      flex={1}
      bg="$background"
      pt={safeAreaInsets.top}
      pb={safeAreaInsets.bottom}
      pl={safeAreaInsets.left}
      pr={safeAreaInsets.right}
    >
      <YStack flex={1} items="center" justify="center" px="$4" py="$6">
        <YStack width="100%" maxW={400} gap="$6">
          <YStack gap="$3">
            <SeventySevenText
              size={SeventySevenTextSize.Heading}
              alignment={SeventySevenTextAlignment.Center}
              role="heading"
              aria-level={1}
              allowFontScaling
            >
              Welcome to 77Faithful
            </SeventySevenText>
            <SeventySevenText alignment={SeventySevenTextAlignment.Center} allowFontScaling>
              A faithful rhythm, one day at a time.
            </SeventySevenText>
          </YStack>
          <YStack gap="$3">
            <SeventySevenButton href="/login">Login</SeventySevenButton>
            <SeventySevenButton href="/register">Register</SeventySevenButton>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
};

export default WelcomeScreen;
