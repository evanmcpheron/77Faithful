import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';
import { designTokens } from '@77/constants/design-tokens';

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
          pt={safeAreaInsets.top + designTokens.space.generous}
          pb={safeAreaInsets.bottom + designTokens.space.generous}
          pl={safeAreaInsets.left + designTokens.space.section}
          pr={safeAreaInsets.right + designTokens.space.section}
        >
          <YStack width="100%" maxW="$account" self="center" gap="$section">
            <YStack gap="$related">
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
