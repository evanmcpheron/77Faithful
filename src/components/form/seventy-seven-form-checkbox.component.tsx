import { SymbolView } from 'expo-symbols';
import { useId } from 'react';
import { Checkbox, Label, useTheme, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '../core';

interface ISeventySevenFormCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (isChecked: boolean) => void;
}

export const SeventySevenFormCheckbox = ({
  checked,
  disabled = false,
  label,
  onCheckedChange,
}: ISeventySevenFormCheckboxProps) => {
  const checkboxId = useId();
  const theme = useTheme();

  const handleCheckedChange = (nextChecked: boolean | 'indeterminate') => {
    onCheckedChange(nextChecked === true);
  };

  return (
    <XStack items="center" gap="$related" opacity={disabled ? 0.5 : 1}>
      <Checkbox
        id={checkboxId}
        unstyled
        borderWidth={0}
        p={0}
        width="$touchTarget"
        height="$touchTarget"
        items="center"
        justify="center"
        rounded="$control"
        aria-label={label}
        focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$focus' }}
        checked={checked}
        disabled={disabled}
        onCheckedChange={handleCheckedChange}
        bg="transparent"
      >
        <YStack
          pointerEvents="none"
          width={24}
          height={24}
          items="center"
          justify="center"
          rounded={6}
          borderWidth={2}
          borderColor={checked ? '$link' : '$controlBorder'}
          bg={checked ? '$primary' : '$surface'}
        >
          <Checkbox.Indicator disablePassStyles>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={18}
              tintColor={theme.onPrimary.val}
            />
          </Checkbox.Indicator>
        </YStack>
      </Checkbox>
      <Label
        htmlFor={disabled ? undefined : checkboxId}
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
