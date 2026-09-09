import { StatusBar } from 'expo-status-bar';
import { ImageBackground, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';

import { SeventySevenButton } from '@77/components/core';

const WelcomeScreen = () => {
  const safeAreaInsets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const brandFontSize = Math.min(64, screenWidth * 0.145);

  return (
    <ImageBackground
      source={require('../../assets/images/root-background.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <YStack
        flex={1}
        pt={safeAreaInsets.top}
        pb={safeAreaInsets.bottom}
        pl={safeAreaInsets.left}
        pr={safeAreaInsets.right}
      >
        <YStack position="absolute" t="41.5%" width="100%" items="center" px="$4">
          <Text
            color="#EAF6FF"
            fontSize={brandFontSize}
            fontWeight="700"
            letterSpacing={-2}
            lineHeight={brandFontSize * 1.12}
            text="center"
            maxFontSizeMultiplier={1.15}
            role="heading"
            aria-level={1}
          >
            77Faithful
          </Text>

          <Text
            mt="$2"
            color="#72B9F7"
            fontSize={12}
            fontWeight="500"
            letterSpacing={2.8}
            lineHeight={18}
            text="center"
            maxFontSizeMultiplier={1.15}
          >
            77 DAYS OF SCRIPTURE, PRAYER, AND FAITHFUL ACTION
          </Text>

          <YStack mt={22} width={30} height={1} bg="#62B8F5" />

          <Text
            mt={19}
            color="#C1DFFF"
            fontSize={16}
            fontWeight="400"
            letterSpacing={1.6}
            lineHeight={23}
            text="center"
            maxFontSizeMultiplier={1.15}
          >
            {'Spend time with God.\nTake the next faithful step.'}
          </Text>
        </YStack>

        <YStack position="absolute" t="68.1%" l="12%" width="76%" gap="$3">
          <SeventySevenButton href="/register" width="100%">
            Begin your 77 days
          </SeventySevenButton>
          <SeventySevenButton href="/sign-in" appearance="Outlined" width="100%" bg="$surface">
            Sign in
          </SeventySevenButton>
        </YStack>

        <YStack position="absolute" b="10%" width="100%" items="center">
          <Text
            color="#4F8AC8"
            fontSize={10}
            fontWeight="500"
            letterSpacing={2.8}
            lineHeight={15}
            text="center"
            maxFontSizeMultiplier={1.15}
          >
            "Come near to God and he will come near to you"
          </Text>
          <XStack mt="$2" width="100%" items="center" justify="center" gap="$3">
            <YStack width={19} height={1} bg="#4F8AC8" />
            <Text
              color="#4F8AC8"
              fontSize={10}
              fontWeight="500"
              letterSpacing={2.8}
              lineHeight={15}
              text="center"
              maxFontSizeMultiplier={1.15}
            >
              James 4:8
            </Text>
            <YStack width={19} height={1} bg="#4F8AC8" />
          </XStack>
        </YStack>
      </YStack>
    </ImageBackground>
  );
};

export default WelcomeScreen;
