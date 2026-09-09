import { SymbolView } from 'expo-symbols';
import { useId, useState } from 'react';
import { Button, Input, Label, TextArea, useTheme, XStack, YStack } from 'tamagui';
import type { InputProps } from 'tamagui';

import { SeventySevenText } from '../core';
import { Severity } from '@77/types';

export const SeventySevenFormTextInputType = {
  Text: 'Text',
  Number: 'Number',
  Password: 'Password',
} as const;

export type TSeventySevenFormTextInputType =
  (typeof SeventySevenFormTextInputType)[keyof typeof SeventySevenFormTextInputType];

interface ISeventySevenFormTextInputProps {
  autoComplete?: InputProps['autoComplete'];
  autoCapitalize?: InputProps['autoCapitalize'];
  autoCorrect?: InputProps['autoCorrect'];
  keyboardType?: InputProps['keyboardType'];
  maxLength?: number;
  onSubmitEditing?: InputProps['onSubmitEditing'];
  returnKeyType?: InputProps['returnKeyType'];
  defaultValue?: string;
  disabled?: boolean;
  errorMessage?: string;
  isLongForm?: boolean;
  label?: string;
  onBlur?: InputProps['onBlur'];
  onFocus?: InputProps['onFocus'];
  onChangeText?: (inputValue: string) => void;
  placeholder?: string;
  type?: TSeventySevenFormTextInputType;
  value?: string;
}

export const SeventySevenFormTextInput = ({
  autoComplete,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  defaultValue,
  disabled = false,
  errorMessage,
  isLongForm = false,
  label,
  onBlur,
  onFocus,
  onChangeText,
  placeholder,
  type = SeventySevenFormTextInputType.Text,
  value,
}: ISeventySevenFormTextInputProps) => {
  const inputId = useId();
  const theme = useTheme();
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === SeventySevenFormTextInputType.Password && !isLongForm;
  const isNumber = type === SeventySevenFormTextInputType.Number && !isLongForm;
  const hasError = Boolean(errorMessage);

  const handlePasswordVisibility = () => {
    setIsPasswordVisible((currentVisibility) => !currentVisibility);
  };

  const handleFocus: InputProps['onFocus'] = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: InputProps['onBlur'] = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <YStack gap="$related" width="100%" opacity={disabled ? 0.5 : 1}>
      {label ? (
        <Label
          id={labelId}
          htmlFor={inputId}
          unstyled
          cursor={disabled ? 'not-allowed' : 'default'}
        >
          <SeventySevenText size="Label">{label}</SeventySevenText>
        </Label>
      ) : null}

      <XStack
        items={isLongForm ? 'flex-start' : 'center'}
        borderWidth={2}
        borderColor={hasError ? '$errorText' : isFocused ? '$focus' : '$controlBorder'}
        rounded="$control"
        bg="$surface"
        overflow="hidden"
        focusWithinStyle={{ borderColor: hasError ? '$errorText' : '$focus' }}
      >
        {isLongForm ? (
          <TextArea
            id={inputId}
            flex={1}
            minH={144}
            height="auto"
            multiline
            textAlignVertical="top"
            lineHeight="$body"
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            borderWidth={0}
            rounded={0}
            bg="transparent"
            px="$compact"
            py="$inline"
            fontFamily="$body"
            fontSize="$body"
            allowFontScaling
            color="$textPrimary"
            placeholderTextColor="$textSecondary"
            selectionColor="$accentSoft"
            cursorColor="$focus"
            focusVisibleStyle={{ outlineWidth: 0 }}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize ?? (isPassword ? 'none' : undefined)}
            autoCorrect={autoCorrect ?? (isPassword ? false : undefined)}
            maxLength={maxLength}
            defaultValue={defaultValue}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onChangeText={onChangeText}
            aria-label={label ?? placeholder}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError}
          />
        ) : (
          <Input
            id={inputId}
            flex={1}
            minH="$control"
            height="auto"
            py="$inline"
            borderWidth={0}
            rounded={0}
            bg="transparent"
            px="$compact"
            pr={isPassword ? '$related' : '$compact'}
            fontFamily="$body"
            fontSize="$body"
            allowFontScaling
            color="$textPrimary"
            placeholderTextColor="$textSecondary"
            selectionColor="$accentSoft"
            cursorColor="$focus"
            focusVisibleStyle={{ outlineWidth: 0 }}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize ?? (isPassword ? 'none' : undefined)}
            autoCorrect={autoCorrect ?? (isPassword ? false : undefined)}
            maxLength={maxLength}
            defaultValue={defaultValue}
            disabled={disabled}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            keyboardType={keyboardType ?? (isNumber ? 'number-pad' : 'default')}
            inputMode={keyboardType === 'email-address' ? 'email' : isNumber ? 'numeric' : 'text'}
            secureTextEntry={isPassword && !isPasswordVisible}
            type={isPassword && !isPasswordVisible ? 'password' : isNumber ? 'number' : 'text'}
            placeholder={placeholder}
            value={value}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onChangeText={onChangeText}
            aria-label={label ?? placeholder}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError}
          />
        )}

        {isPassword ? (
          <Button
            minW="$touchTarget"
            minH="$touchTarget"
            p={0}
            chromeless
            rounded="$control"
            focusVisibleStyle={{
              outlineColor: '$focus',
              outlineWidth: 2,
              outlineStyle: 'solid',
              outlineOffset: -3,
            }}
            disabled={disabled}
            onPress={handlePasswordVisibility}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            role="button"
          >
            <SymbolView
              name={{
                ios: isPasswordVisible ? 'eye.slash' : 'eye',
                android: isPasswordVisible ? 'visibility_off' : 'visibility',
                web: isPasswordVisible ? 'visibility_off' : 'visibility',
              }}
              size={21}
              tintColor={theme.textSecondary.val}
            />
          </Button>
        ) : null}
      </XStack>

      {errorMessage ? (
        <SeventySevenText id={errorId} severity={Severity.Error} size="Support" role="alert">
          {errorMessage}
        </SeventySevenText>
      ) : null}
    </YStack>
  );
};
