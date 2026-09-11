import { useEffect, useState } from 'react';
import type { KeyboardTypeOptions } from 'react-native';

import { AppIcon } from '@td/components/ui/icon/icon.component';
import type { TIconName } from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { BrandColors, TextColors } from '@td/theme/colors';
import { IconStrokeWidths } from '@td/theme/icon-sizes';

import { useFormErrors, useFormName } from '../form/form.context';
import {
	getErrorMessage,
	validateInternalComponent,
} from '../form/form.helpers';
import { useForm } from '../form/useForm.hook';
import {
	StyledErrorMessageContainer,
	StyledInput,
	StyledInputContainer,
	StyledInputFieldContainer,
	StyledInputTrailingIconButton,
} from './input.styles';
import type { IInputProps, TInputType } from './input.types';

const getKeyboardType = (type: TInputType): KeyboardTypeOptions => {
	switch (type) {
		case 'Email':
			return 'email-address';
		case 'Phone':
			return 'phone-pad';
		case 'Number':
			return 'numeric';
		default:
			return 'default';
	}
};

const resolveInputValue = (value: unknown): string => {
	if (value === null || value === undefined) {
		return '';
	}

	return String(value);
};

export const Input = ({
	disabled = false,
	errorMessage,
	hasError = false,
	icon,
	ignoreError = false,
	ignoreForm = false,
	label,
	leadingIcon,
	leadingIconName,
	multiline = false,
	name,
	onBlur,
	onChange,
	onFocus,
	onPressIcon,
	onTrailingIconPress,
	placeholder,
	readOnly = false,
	rounded = false,
	trailingIconName,
	testID,
	type = 'Text',
	value,
	defaultValue = '',
}: IInputProps) => {
	const formName = useFormName();
	const formErrors = useFormErrors();
	const formProxy = useForm({ formName });
	const [inputValue, setInputValue] = useState(
		resolveInputValue(value ?? defaultValue),
	);
	const [isFocused, setIsFocused] = useState(false);
	const [isPasswordHidden, setIsPasswordHidden] = useState(true);

	const usesFormProxy = Boolean(formName && name && !ignoreForm);
	const isPasswordInput = type === 'Password';
	const passwordIcon: TIconName = isPasswordHidden ? 'EyeSlash' : 'Eye';
	const resolvedLeadingIconName = leadingIconName ?? leadingIcon;
	const resolvedTrailingIconName = trailingIconName ?? icon;
	const resolvedIcon = isPasswordInput
		? passwordIcon
		: resolvedTrailingIconName;
	const internalValidationMessage =
		!ignoreError && usesFormProxy && name
			? validateInternalComponent(formName, name, inputValue)
			: undefined;
	const formErrorMessage =
		!ignoreError && formErrors?.form === formName && name
			? getErrorMessage(formErrors.errors ?? {}, name)
			: undefined;
	const resolvedErrorMessage =
		errorMessage ?? formErrorMessage ?? internalValidationMessage;
	const shouldShowError =
		!ignoreError && (hasError || Boolean(resolvedErrorMessage));

	useEffect(() => {
		if (!usesFormProxy || !name) {
			return;
		}

		formProxy.registerField(name, defaultValue ?? '');

		const handleValueChange = (nextValue: unknown) => {
			setInputValue(resolveInputValue(nextValue));
		};

		formProxy.subscribe(name, handleValueChange);

		return () => {
			formProxy.unsubscribe(name, handleValueChange);
			formProxy.deregisterField(name);
		};
	}, [defaultValue, formProxy, name, usesFormProxy]);

	const [previousValueProps, setPreviousValueProps] = useState({
		value,
		defaultValue,
		usesFormProxy,
	});

	if (
		!Object.is(previousValueProps.value, value) ||
		!Object.is(previousValueProps.defaultValue, defaultValue) ||
		previousValueProps.usesFormProxy !== usesFormProxy
	) {
		setPreviousValueProps({ value, defaultValue, usesFormProxy });
		if (!usesFormProxy) {
			setInputValue(resolveInputValue(value ?? defaultValue));
		}
	}

	const handleIconPress = () => {
		if (isPasswordInput) {
			setIsPasswordHidden((currentValue) => !currentValue);
			return;
		}

		(onTrailingIconPress ?? onPressIcon)?.();
	};

	const handleChange = (nextValue: string) => {
		setInputValue(nextValue);

		if (usesFormProxy && name) {
			formProxy.setValue(name, nextValue);
		}

		onChange?.(nextValue);
	};

	const handleFocus = (event: any) => {
		setIsFocused(true);
		onFocus?.(event);
	};

	const handleBlur = (event: any) => {
		setIsFocused(false);
		onBlur?.(event);
	};

	return (
		<StyledInputFieldContainer>
			{label ? (
				<Typography
					size='H3'
					weight='Semibold'
				>
					{label}
				</Typography>
			) : null}

			<StyledInputContainer
				hasError={shouldShowError}
				isFocused={isFocused}
				rounded={rounded}
			>
				{resolvedLeadingIconName ? (
					<AppIcon
						name={resolvedLeadingIconName}
						tone='Neutral'
					/>
				) : null}

				<StyledInput
					autoCapitalize={type === 'Email' ? 'none' : 'sentences'}
					autoCorrect={type !== 'Email' && !isPasswordInput}
					editable={!disabled && !readOnly}
					isFocused={isFocused}
					keyboardType={getKeyboardType(type)}
					multiline={multiline}
					placeholder={placeholder}
					placeholderTextColor={TextColors.Muted}
					secureTextEntry={isPasswordInput && isPasswordHidden}
					testID={testID}
					textContentType={isPasswordInput ? 'password' : 'none'}
					value={inputValue}
					onBlur={handleBlur}
					onChangeText={handleChange}
					onFocus={handleFocus}
				/>

				{resolvedIcon ? (
					<StyledInputTrailingIconButton
						accessibilityRole='button'
						disabled={disabled}
						onPress={handleIconPress}
					>
						<AppIcon
							color={
								isFocused
									? BrandColors.Primary
									: TextColors.Secondary
							}
							disabled={disabled}
							name={resolvedIcon}
							{...(isFocused && {
								strokeWidth: IconStrokeWidths.Thick,
							})}
						/>
					</StyledInputTrailingIconButton>
				) : null}
			</StyledInputContainer>

			<StyledErrorMessageContainer>
				{shouldShowError && resolvedErrorMessage ? (
					<Typography
						size='Body2'
						tone='Error'
					>
						{resolvedErrorMessage}
					</Typography>
				) : null}
			</StyledErrorMessageContainer>
		</StyledInputFieldContainer>
	);
};
