import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { TextField, type TextFieldProps } from './text-field';

import { Spacing } from '@/constants/theme';

export type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'multiline'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const blocked = props.disabled || props.editable === false || props.readOnly;
  const action = visible ? 'Hide' : 'Show';

  return (
    <View style={styles.field}>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        {...props}
        multiline={false}
        secureTextEntry={!visible}
      />
      <Button
        variant="tertiary"
        style={styles.toggle}
        disabled={blocked}
        accessibilityLabel={`${action} ${props.label.toLowerCase()}`}
        onPress={() => setVisible(!visible)}>
        {`${action} ${props.label.toLowerCase()}`}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  toggle: { alignSelf: 'flex-start', maxWidth: '100%' },
});
