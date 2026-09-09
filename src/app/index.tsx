import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, styled, Text, XStack, YStack } from 'tamagui';

const WelcomeButton = styled(Button, {
  name: 'WelcomeButton',
  width: '100%',
  height: 56,
  minH: 56,
  rounded: 999,
  borderWidth: 1,
  px: '$5',
  cursor: 'pointer',
  variants: {
    appearance: {
      Filled: {
        bg: '#0788F8',
        borderColor: '#62D4FF',
        shadowColor: '#0788F8',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 7,
        hoverStyle: { bg: '#1197FF' },
        pressStyle: { bg: '#0073E6', scale: 0.985 },
      },
      Outlined: {
        bg: 'rgba(2, 22, 53, 0.2)',
        borderColor: '#B8DBFF',
        hoverStyle: { bg: 'rgba(20, 53, 100, 0.55)' },
        pressStyle: { bg: 'rgba(20, 53, 100, 0.75)', scale: 0.985 },
      },
    },
  } as const,
});

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
          <Link href="/register" asChild>
            <WelcomeButton appearance="Filled">
              <XStack width="100%" items="center" justify="center">
                <Text
                  color="#FFFFFF"
                  fontSize={18}
                  fontWeight="700"
                  letterSpacing={0.3}
                  maxFontSizeMultiplier={1.15}
                >
                  Begin your 77 days
                </Text>
                <Text
                  position="absolute"
                  r={1}
                  color="#FFFFFF"
                  fontSize={29}
                  fontWeight="300"
                  lineHeight={30}
                  maxFontSizeMultiplier={1}
                  aria-hidden
                >
                  →
                </Text>
              </XStack>
            </WelcomeButton>
          </Link>

          <Link href="/sign-in" asChild>
            <WelcomeButton appearance="Outlined">
              <Text
                color="#FFFFFF"
                fontSize={18}
                fontWeight="600"
                letterSpacing={0.2}
                maxFontSizeMultiplier={1.15}
              >
                Sign in
              </Text>
            </WelcomeButton>
          </Link>
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
