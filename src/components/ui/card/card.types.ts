import type { ReactNode } from 'react';

import type { TComponentPadding, TComponentTone } from '@td/types/ui.types';

export const CardVariant = {
	Default: 'Default',
	Outlined: 'Outlined',
	Muted: 'Muted',
} as const;

export type TCardVariant = (typeof CardVariant)[keyof typeof CardVariant];

export interface ICardProps {
	children: ReactNode;
	variant?: TCardVariant;
	tone?: Extract<TComponentTone, 'Neutral' | 'Brand' | 'Inverse'>;
	onPress?: () => void;
	padding?: TComponentPadding;
	testID?: string;
}
