import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import type {
	TTypographySize,
	TTypographyTone,
	TTypographyWeight,
} from '@td/theme/typography';
import type { TTextAlign } from '@td/types/ui.types';

export interface ITypographyProps {
	children?: ReactNode;
	size?: TTypographySize;
	tone?: TTypographyTone;
	weight?: TTypographyWeight;
	align?: TTextAlign;
	underline?: boolean;
	numberOfLines?: number;
	testID?: string;
	style?: StyleProp<TextStyle>;
}
