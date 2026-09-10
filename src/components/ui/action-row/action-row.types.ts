import type { ReactNode } from 'react';

import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { TComponentTone } from '@td/types/ui.types';

export const ActionRowVariant = {
	Default: 'Default',
	Muted: 'Muted',
} as const;

export type TActionRowVariant =
	(typeof ActionRowVariant)[keyof typeof ActionRowVariant];

export interface IActionRowProps {
	children?: ReactNode;
	title?: string;
	description?: string;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	variant?: TActionRowVariant;
	tone?: TComponentTone;
	disabled?: boolean;
	accessibilityLabel?: string;
	testID?: string;
	onPress?: () => void;
}
