import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

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

  return (
    <YStack
      flex={1}
      bg="$background"
      pt={safeAreaInsets.top}
      pb={safeAreaInsets.bottom}
      pl={safeAreaInsets.left}
      pr={safeAreaInsets.right}
    >
      <YStack flex={1} items="center" justify="center" px="$4">
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
