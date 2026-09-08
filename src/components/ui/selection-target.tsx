import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { type ReactNode } from 'react';

export type SelectionTargetProps = {
  role: 'checkbox' | 'radio';
  label: string;
  stateDescription?: string;
  checked: boolean;
  disabled: boolean;
  busy?: boolean;
  groupName?: string;
  onActivate: () => void;
  onFocus: () => void;
  onBlur: () => void;
  style: StyleProp<ViewStyle>;
  pressedStyle: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function SelectionTarget({
  role,
  label,
  stateDescription,
  checked,
  disabled,
  busy,
  onActivate,
  onFocus,
  onBlur,
  style,
  pressedStyle,
  children,
}: SelectionTargetProps) {
  return (
    <Pressable
      accessible
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityValue={stateDescription ? { text: stateDescription } : undefined}
      accessibilityState={{ checked, disabled, busy }}
      disabled={disabled}
      onPress={(event) => {
        event.stopPropagation();
        onActivate();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ pressed }) => [style, pressed && !disabled && pressedStyle]}>
      {children}
    </Pressable>
  );
}
