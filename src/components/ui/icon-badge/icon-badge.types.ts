import type { TIconSize, TIconStrokeWidth } from '@td/theme/icon-sizes';
import { TComponentTone } from '@td/types/ui.types';
import { TIconName } from '../icon/icon.types';

export interface IIconBadgeProps {
	name: TIconName;
	size?: TIconSize;
	color?: string;
	tone?: TComponentTone;
	backgroundColor?: string;
	strokeWidth?: TIconStrokeWidth;
	testID?: string;
}
