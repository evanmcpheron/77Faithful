import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { useLatestJourney } from '@77/features/journey/use-latest-journey.hook';
import { useAuth } from '@77/providers/auth-provider';
import { SeventySevenCard } from '@77/surface';

const ReflectionsScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { journey, isLoading, hasError, retry } = useLatestJourney(user?.uid ?? null);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} bg="$background" py="$5" pl={insets.left + 24} pr={insets.right + 24}>
        <YStack width="100%" maxW={640} self="center" gap="$4">
          {isLoading ? (
            <Spinner accessibilityLabel="Loading saved writing" />
          ) : hasError ? (
            <>
              <SeventySevenText role="alert">
                We couldn’t load your saved writing. Please try again.
              </SeventySevenText>
              <SeventySevenButton onPress={retry}>Try again</SeventySevenButton>
            </>
          ) : !journey ? (
            <SeventySevenText>
              Your journey isn’t available yet. Return to Today to continue.
            </SeventySevenText>
          ) : (
            <>
              <SeventySevenCard gap="$3">
                <SeventySevenText size="HeadingSmall" role="heading">
                  Your starting motivation
                </SeventySevenText>
                <SeventySevenText>
                  {journey?.startingMotivation?.text ||
                    'You haven’t saved a starting motivation for this journey.'}
                </SeventySevenText>
              </SeventySevenCard>
              <SeventySevenText color="$textSecondary">
                Daily reflection writing and history aren’t available yet.
              </SeventySevenText>
            </>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default ReflectionsScreen;
