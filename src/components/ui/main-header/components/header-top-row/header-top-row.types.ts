import type { IInputProps } from '@td/components/form/input/input.types';
import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { IProgressBarProps } from '@td/components/ui/progress-bar/progress-bar.types';
import type { SharedValue } from 'react-native-reanimated';

export interface IHeaderTopRowProps {
	hasGradientHeader?: boolean;
	canGoBack?: boolean;
	onBackPress?: () => void;
	showNotifications?: boolean;
	hasLogo?: boolean;
	title?: string;
	progress?: Pick<IProgressBarProps, 'value' | 'max'>;
	titleIcon?: TIconName;
	searchInput?: IInputProps;
	scrollOffset?: SharedValue<number>;
	onAddPress?: () => void;
	onEditPress?: () => void;
}
