import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';

interface IAccountScreenProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AccountScreen = ({ title, description, children }: IAccountScreenProps) => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        bg="$background"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ grow: 1 }}
      >
        <YStack
          flex={1}
          justify="center"
          pt={safeAreaInsets.top + 32}
          pb={safeAreaInsets.bottom + 32}
          pl={safeAreaInsets.left + 24}
          pr={safeAreaInsets.right + 24}
        >
          <YStack width="100%" maxW={460} self="center" gap="$5">
            <YStack gap="$3">
              <SeventySevenText size="Heading" role="heading" aria-level={1}>
                {title}
              </SeventySevenText>
              <SeventySevenText color="$textSecondary">{description}</SeventySevenText>
            </YStack>
            {children}
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
