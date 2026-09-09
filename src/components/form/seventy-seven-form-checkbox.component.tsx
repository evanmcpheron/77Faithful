import { SymbolView } from 'expo-symbols';
import { useId } from 'react';
import { Checkbox, Label, XStack } from 'tamagui';

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

  const handleCheckedChange = (nextChecked: boolean | 'indeterminate') => {
    onCheckedChange(nextChecked === true);
  };

  return (
    <XStack items="center" gap="$3" opacity={disabled ? 0.5 : 1}>
      <Checkbox
        id={checkboxId}
        size="$5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={handleCheckedChange}
        activeStyle={{ bg: '$blue9', borderColor: '$blue9' }}
      >
        <Checkbox.Indicator>
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={18}
            tintColor="#ffffff"
          />
        </Checkbox.Indicator>
      </Checkbox>
      <Label htmlFor={checkboxId} unstyled flex={1} cursor={disabled ? 'not-allowed' : 'pointer'}>
        <SeventySevenText>{label}</SeventySevenText>
      </Label>
    </XStack>
  );
};
