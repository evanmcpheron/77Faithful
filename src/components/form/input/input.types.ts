import type { FocusEvent, NativeSyntheticEvent } from 'react-native';

import type { TIconName } from '@td/components/ui/icon/icon.types';

export const InputType = {
	Text: 'Text',
	Email: 'Email',
	Password: 'Password',
	Phone: 'Phone',
	Number: 'Number',
} as const;

export type TInputType = (typeof InputType)[keyof typeof InputType];

export interface IInputProps {
	name?: string;
	label?: string;
	placeholder?: string;
	type?: TInputType;
	value?: string;
	defaultValue?: string;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	disabled?: boolean;
	readOnly?: boolean;
	testID?: string;
	hasError?: boolean;
	errorMessage?: string;
	ignoreError?: boolean;
	ignoreForm?: boolean;
	multiline?: boolean;
	onBlur?: (event: NativeSyntheticEvent<FocusEvent>) => void;
	onFocus?: (event: NativeSyntheticEvent<FocusEvent>) => void;
	onTrailingIconPress?: () => void;
	onChange?: (text: string) => void;
	/**
	 * Deprecated. Use leadingIconName.
	 */
	leadingIcon?: TIconName;
	/**
	 * Deprecated. Use trailingIconName.
	 */
	icon?: TIconName;
	/**
	 * Deprecated. Use onTrailingIconPress.
	 */
	onPressIcon?: () => void;
	/**
	 * Kept as a scoped existing shape prop until input variants are defined.
	 */
	rounded?: boolean;
}
