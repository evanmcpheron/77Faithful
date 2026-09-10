import type { ReactNode } from 'react';

import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { TComponentTone } from '@td/types/ui.types';

export const ChipVariant = {
	Soft: 'Soft',
	Outline: 'Outline',
} as const;

export type TChipVariant = (typeof ChipVariant)[keyof typeof ChipVariant];

export interface IChipProps {
	children: ReactNode;
	tone?: TComponentTone;
	variant?: TChipVariant;
	selected?: boolean;
	disabled?: boolean;
	leadingIconName?: TIconName;
	/**
	 * Deprecated. Use leadingIconName.
	 */
	iconName?: TIconName;
	accessibilityLabel?: string;
	testID?: string;
	onPress?: () => void;
}
