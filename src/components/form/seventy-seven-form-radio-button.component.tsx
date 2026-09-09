import type { ReactNode } from 'react';
import { useId } from 'react';
import { Label, RadioGroup, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '../core';

interface ISeventySevenFormRadioGroupProps {
  children: ReactNode;
  disabled?: boolean;
  label?: string;
  onValueChange: (selectedValue: string) => void;
  value: string;
}

interface ISeventySevenFormRadioButtonProps {
  disabled?: boolean;
  label: string;
  value: string;
}

export const SeventySevenFormRadioGroup = ({
  children,
  disabled = false,
  label,
  onValueChange,
  value,
}: ISeventySevenFormRadioGroupProps) => {
  const groupLabelId = useId();

  return (
    <YStack gap="$related" opacity={disabled ? 0.5 : 1}>
      {label ? (
        <SeventySevenText id={groupLabelId} size="Label">
          {label}
        </SeventySevenText>
      ) : null}
      <RadioGroup
        gap="$related"
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        aria-labelledby={label ? groupLabelId : undefined}
      >
        {children}
      </RadioGroup>
    </YStack>
  );
};

export const SeventySevenFormRadioButton = ({
  disabled = false,
  label,
  value,
}: ISeventySevenFormRadioButtonProps) => {
  const radioButtonId = useId();

  return (
    <XStack items="center" gap="$related" opacity={disabled ? 0.5 : 1}>
      <RadioGroup.Item
        id={radioButtonId}
        unstyled
        borderWidth={0}
        p={0}
        width="$touchTarget"
        height="$touchTarget"
        items="center"
        justify="center"
        rounded="$control"
        value={value}
        disabled={disabled}
        aria-label={label}
        bg="transparent"
        focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$focus' }}
      >
        <YStack
          pointerEvents="none"
          width={24}
          height={24}
          rounded={12}
          borderWidth={2}
          borderColor="$controlBorder"
          bg="$surface"
          items="center"
          justify="center"
        >
          <RadioGroup.Indicator width={12} height={12} bg="$link" />
        </YStack>
      </RadioGroup.Item>
      <Label
        htmlFor={disabled ? undefined : radioButtonId}
        unstyled
        flex={1}
        minH="$touchTarget"
        py="$inline"
        cursor={disabled ? 'not-allowed' : 'pointer'}
      >
        <SeventySevenText>{label}</SeventySevenText>
      </Label>
    </XStack>
  );
};
