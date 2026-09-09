import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { SeventySevenText } from './seventy-seven-text.component';

interface ISeventySevenPageProps {
  title: string;
  children: ReactNode;
}

export const SeventySevenPage = ({ title, children }: ISeventySevenPageProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
      <YStack
        flex={1}
        bg="$background"
        pt={insets.top + 24}
        pb="$6"
        pl={insets.left + 24}
        pr={insets.right + 24}
      >
        <YStack width="100%" maxW={640} self="center" gap="$5">
          <SeventySevenText bold color="$primary">
            77Faithful
          </SeventySevenText>
          <SeventySevenText size="Heading" role="heading" aria-level={1}>
            {title}
          </SeventySevenText>
          {children}
        </YStack>
      </YStack>
    </ScrollView>
  );
};
