import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Collapsible, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';

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
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      bg="$surface"
      borderWidth={1}
      borderColor={isSelected ? '$primary' : '$borderColor'}
      rounded="$4"
    >
      <XStack items="center" gap="$2" px="$4" py="$2">
        <YStack flex={1}>{header}</YStack>
        <Collapsible.Trigger asChild aria-controls={contentId}>
          <Button
            chromeless
            minW={44}
            minH={44}
            px="$2"
            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${label} details`}
          >
            <SeventySevenText color="$textSecondary" aria-hidden>
              {isExpanded ? '⌃' : '⌄'}
            </SeventySevenText>
          </Button>
        </Collapsible.Trigger>
      </XStack>
      <Collapsible.Content id={contentId}>
        <YStack gap="$2" px="$4" pb="$4">
          {children}
        </YStack>
      </Collapsible.Content>
    </Collapsible>
  );
};
