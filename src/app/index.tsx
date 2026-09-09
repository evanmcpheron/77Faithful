import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';

import {
  SeventySevenText,
  SeventySevenTextAlignment,
  SeventySevenTextSeverity,
  SeventySevenTextSize,
} from '@77/components/core';

export default function HomeScreen() {
  return (
    <YStack
      flex={1}
      width="100%"
      maxW={640}
      self="center"
      justify="center"
      gap="$4"
      p="$5"
      bg="$background"
    >
      <SeventySevenText
        size={SeventySevenTextSize.HeadingLarge}
        alignment={SeventySevenTextAlignment.Center}
      >
        Large heading
      </SeventySevenText>
      <SeventySevenText
        size={SeventySevenTextSize.Heading}
        alignment={SeventySevenTextAlignment.Center}
      >
        Welcome to 77Faithful
      </SeventySevenText>
      <SeventySevenText
        size={SeventySevenTextSize.HeadingSmall}
        alignment={SeventySevenTextAlignment.Center}
      >
        Small heading
      </SeventySevenText>
      <SeventySevenText
        severity={SeventySevenTextSeverity.Info}
        alignment={SeventySevenTextAlignment.Left}
        bold
      >
        Bold informational paragraph text is aligned to the left.
      </SeventySevenText>
      <SeventySevenText
        severity={SeventySevenTextSeverity.Success}
        alignment={SeventySevenTextAlignment.Center}
        italic
      >
        Italic success text can highlight a completed daily practice.
      </SeventySevenText>
      <SeventySevenText
        severity={SeventySevenTextSeverity.Warning}
        alignment={SeventySevenTextAlignment.Right}
      >
        Warning text is aligned to the right.
      </SeventySevenText>
      <SeventySevenText
        severity={SeventySevenTextSeverity.Error}
        alignment={SeventySevenTextAlignment.Justify}
      >
        Error text can explain an issue in a longer justified paragraph while preserving the
        component&apos;s standard paragraph typography.
      </SeventySevenText>
      <StatusBar style="auto" />
    </YStack>
  );
}
