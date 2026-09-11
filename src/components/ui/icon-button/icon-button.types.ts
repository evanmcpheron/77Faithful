import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { TIconSize, TIconStrokeWidth } from '@td/theme/icon-sizes';
import type { TComponentTone } from '@td/types/ui.types';

export const IconButtonVariant = {
	Solid: 'Solid',
	Ghost: 'Ghost',
	Soft: 'Soft',
} as const;

export type TIconButtonVariant =
	(typeof IconButtonVariant)[keyof typeof IconButtonVariant];

export const IconButtonSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TIconButtonSize =
	(typeof IconButtonSize)[keyof typeof IconButtonSize];

export interface IIconButtonProps {
	name: TIconName;
	accessibilityLabel: string;
	variant?: TIconButtonVariant;
	tone?: TComponentTone;
	hasBackground?: boolean;
	size?: TIconButtonSize;
	iconSize?: TIconSize;
	strokeWidth?: TIconStrokeWidth;
	disabled?: boolean;
	testID?: string;
	onPress: () => void;
}
