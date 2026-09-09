import { SymbolView } from 'expo-symbols';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Collapsible, useTheme, XStack, YStack } from 'tamagui';

interface ISeventySevenDropdownProps {
  label: string;
  header: ReactNode;
  children: ReactNode;
  isSelected?: boolean;
}

export const SeventySevenDropdown = ({
  label,
  header,
  children,
  isSelected = false,
}: ISeventySevenDropdownProps) => {
  const theme = useTheme();
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      bg="$surface"
      borderWidth={1}
      borderColor={isSelected ? '$link' : '$border'}
      rounded="$card"
    >
      <XStack items="center" gap="$related" px="$fieldGroup" py="$related">
        <YStack flex={1}>{header}</YStack>
        <Collapsible.Trigger asChild aria-controls={contentId}>
          <Button
            chromeless
            minW="$touchTarget"
            minH="$touchTarget"
            px="$related"
            rounded="$control"
            focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$focus' }}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${label} details`}
          >
            <SymbolView
              name={{
                ios: isExpanded ? 'chevron.up' : 'chevron.down',
                android: isExpanded ? 'expand_less' : 'expand_more',
                web: isExpanded ? 'expand_less' : 'expand_more',
              }}
              size={20}
              tintColor={theme.textSecondary.val}
              aria-hidden
            />
          </Button>
        </Collapsible.Trigger>
      </XStack>
      <Collapsible.Content id={contentId}>
        <YStack gap="$related" px="$fieldGroup" pb="$fieldGroup">
          {children}
        </YStack>
      </Collapsible.Content>
    </Collapsible>
  );
};
