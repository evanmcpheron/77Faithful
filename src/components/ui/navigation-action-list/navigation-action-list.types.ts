import type { TIconName } from '@td/components/ui/icon/icon.types';

export interface INavigationActionListItem {
	id: string;
	title: string;
	iconName: TIconName;
	accessibilityLabel?: string;
	disabled?: boolean;
	onPress?: (item: INavigationActionListItem) => void;
}

export type TNavigationActionListActions =
	INavigationActionListItem | readonly INavigationActionListItem[];

export interface INavigationActionListProps {
	actions: TNavigationActionListActions;
	testID?: string;
}
