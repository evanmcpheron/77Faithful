import { useState } from 'react';
import { View } from 'react-native';

import { type SelectionTargetProps } from './selection-target';

export function SelectionTarget({
  role,
  label,
  stateDescription,
  checked,
  disabled,
  busy,
  groupName,
  onActivate,
  onFocus,
  onBlur,
  style,
  pressedStyle,
  children,
}: SelectionTargetProps) {
  const [pressed, setPressed] = useState(false);
  // Native inputs supply Space activation and radio-group arrow/focus behavior on web.
  return (
    <label
      style={{ display: 'flex', position: 'relative' }}
      onClick={(event) => event.stopPropagation()}>
      <input
        type={role}
        name={role === 'radio' ? groupName : undefined}
        aria-label={label}
        aria-description={stateDescription}
        aria-busy={busy}
        checked={checked}
        disabled={disabled}
        onChange={onActivate}
        onFocus={onFocus}
        onBlur={() => {
          setPressed(false);
          onBlur();
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          opacity: 0,
          zIndex: 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      />
      <View style={[{ flex: 1 }, style, pressed && !disabled && pressedStyle]}>{children}</View>
    </label>
  );
}
