import { Spacing } from '@td/theme/spacing';
import { AccessibilityProps, StyleProp, ViewStyle } from 'react-native';

export interface DomProperties<
	TStyle extends object = ViewStyle,
> extends AccessibilityProps {
	style?: StyleProp<TStyle>;
	className?: string;
	nativeID?: string;
	children?: React.ReactNode;
}

export const ComponentTone = {
	Brand: 'Brand',
	Neutral: 'Neutral',
	Success: 'Success',
	Warning: 'Warning',
	Error: 'Error',
	Info: 'Info',
	Inverse: 'Inverse',
} as const;

export type TComponentTone = (typeof ComponentTone)[keyof typeof ComponentTone];

export const ComponentSize = {
	None: 0,
	XSmall: Spacing.XSmall,
	Small: Spacing.Small,
	Medium: Spacing.Medium,
	Large: Spacing.Large,
} as const;

export type TComponentSize = (typeof ComponentSize)[keyof typeof ComponentSize];

export const ComponentPadding = {
	None: 0,
	Small: Spacing.XSmall,
	Medium: Spacing.Small,
	Large: Spacing.Medium,
} as const;

export type TComponentPadding =
	(typeof ComponentPadding)[keyof typeof ComponentPadding];

export const TextAlign = {
	Left: 'left',
	Center: 'center',
	Right: 'right',
} as const;

export type TTextAlign = (typeof TextAlign)[keyof typeof TextAlign];
