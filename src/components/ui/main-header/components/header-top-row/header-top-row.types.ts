import type { IInputProps } from '@td/components/form/input/input.types';
import type { TIconName } from '@td/components/ui/icon/icon.types';
import type { SharedValue } from 'react-native-reanimated';

export interface IHeaderTopRowProps {
	hasGradientHeader?: boolean;
	canGoBack?: boolean;
	hasLogo?: boolean;
	title?: string;
	titleIcon?: TIconName;
	searchInput?: IInputProps;
	scrollOffset?: SharedValue<number>;
	onAddPress?: () => void;
	onEditPress?: () => void;
}
