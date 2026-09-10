import type { ReactNode } from 'react';

import type { TComponentTone } from '@td/types/ui.types';
import { StyleProp, ViewStyle } from 'react-native';

export const BadgeVariant = {
	Soft: 'Soft',
	Outline: 'Outline',
	Solid: 'Solid',
} as const;

export type TBadgeVariant = (typeof BadgeVariant)[keyof typeof BadgeVariant];

export interface IBadgeProps {
	children: ReactNode;
	tone?: TComponentTone;
	style?: StyleProp<ViewStyle>;
	variant?: TBadgeVariant;
	testID?: string;
}
