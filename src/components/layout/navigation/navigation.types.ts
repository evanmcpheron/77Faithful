import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

import type { TIconName } from '@td/components/ui/icon/icon.types';

export type TTabMeta = {
	label: string;
	icon: TIconName;
};

export type TNavigationTabConfig = {
	name: string;
	label: string;
	icon: TIconName;
	title?: string;
	routeName?: string;
	options?: BottomTabNavigationOptions;
};

export interface ITabsLayoutProps {
	tabs: TNavigationTabConfig[];
}

export interface ITabButtonProps {
	label: string;
	icon: TIconName;
	focused: boolean;
	onPress: () => void;
	onLongPress: () => void;
	onPressIn: () => void;
	onPressOut: () => void;
}
