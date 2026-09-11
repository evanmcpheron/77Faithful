import type { ReactNode } from 'react';

import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { TComponentTone, TTextAlign } from '@td/types/ui.types';

export const ButtonVariant = {
	Solid: 'Solid',
	Outline: 'Outline',
	Ghost: 'Ghost',
	Inverse: 'Inverse',
	Link: 'Link',
} as const;

export type TButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const ButtonSize = {
	XSmall: 'XSmall',
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

export interface IButtonProps {
	children?: ReactNode;
	variant?: TButtonVariant;
	tone?: TComponentTone;
	size?: TButtonSize;
	fullWidth?: boolean;
	disabled?: boolean;
	loading?: boolean;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	align?: TTextAlign;
	accessibilityLabel?: string;
	testID?: string;
	onPress: () => void;
}
