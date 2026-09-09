import { HeaderShownContext } from 'expo-router/react-navigation';
import { useContext } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, YStack } from 'tamagui';

import { SeventySevenTabScreenContext } from '@77/components/navigation/seventy-seven-tab-screen.component';
import { designTokens } from '@77/constants/design-tokens';

import { SeventySevenText } from './seventy-seven-text.component';

interface ISeventySevenPageProps {
  title: string;
  children: ReactNode;
}

export const SeventySevenPage = ({ title, children }: ISeventySevenPageProps) => {
  const insets = useSafeAreaInsets();
  const hasNativeHeader = useContext(HeaderShownContext);
  const hasTabBar = useContext(SeventySevenTabScreenContext);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gutter =
    width < 360
      ? designTokens.space.compact
      : width >= 768
        ? designTokens.space.generous
        : designTokens.space.section;

  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0, backgroundColor: theme.background.val }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack
        flex={1}
        bg="$background"
        pt={(hasNativeHeader ? 0 : insets.top) + designTokens.space.section}
        pb={(hasTabBar ? 0 : insets.bottom) + designTokens.space.generous}
        pl={insets.left + gutter}
        pr={insets.right + gutter}
      >
        <YStack width="100%" maxW="$content" self="center" gap="$section">
          <YStack gap="$related">
            <SeventySevenText size="Label" color="$link">
              77Faithful
            </SeventySevenText>
            <SeventySevenText size="Heading" role="heading" aria-level={1}>
              {title}
            </SeventySevenText>
          </YStack>
          {children}
        </YStack>
      </YStack>
    </ScrollView>
  );
};
