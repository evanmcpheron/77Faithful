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
    <YStack gap="$3" opacity={disabled ? 0.5 : 1}>
      {label ? (
        <SeventySevenText id={groupLabelId} nativeID={groupLabelId} bold>
          {label}
        </SeventySevenText>
      ) : null}
      <RadioGroup
        gap="$3"
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
    <XStack items="center" gap="$3" opacity={disabled ? 0.5 : 1}>
      <RadioGroup.Item id={radioButtonId} size="$5" value={value} disabled={disabled}>
        <RadioGroup.Indicator bg="$blue9" />
      </RadioGroup.Item>
      <Label
        htmlFor={radioButtonId}
        unstyled
        flex={1}
        cursor={disabled ? 'not-allowed' : 'pointer'}
      >
        <SeventySevenText>{label}</SeventySevenText>
      </Label>
    </XStack>
  );
};
