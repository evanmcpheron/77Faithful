import type { SharedValue } from 'react-native-reanimated';

export interface IMainHeaderProps {
	title?: string;
	hasGradientHeader?: boolean;
	canGoBack?: boolean;
	description?: string;
	scrollOffset?: SharedValue<number>;
}
