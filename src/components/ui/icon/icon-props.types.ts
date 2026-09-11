import type { StyleProp, ViewStyle } from 'react-native';

import type { TIconSize, TIconStrokeWidth } from '@td/theme/icon-sizes';
import type { TComponentTone } from '@td/types/ui.types';

import type { TIconName } from './icon-map.types';
import type { TIconVariant } from './icon-variant.types';

export interface IAppIconProps {
	name: TIconName;
	size?: TIconSize;
	tone?: TComponentTone;
	variant?: TIconVariant;
	hasBackground?: boolean;
	color?: string;
	style?: StyleProp<ViewStyle>;
	strokeWidth?: TIconStrokeWidth;
	disabled?: boolean;
	testID?: string;
}
