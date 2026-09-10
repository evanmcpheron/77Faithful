import type { ReactNode } from 'react';

export interface ITabsProps {
	children: ReactNode;
	defaultIndex?: number;
	onPress?: (index: number) => void;
}

export interface ITabItemProps {
	label: string;
	disabled?: boolean;
	testID?: string;
	onPress?: (index: number) => void;
	children: ReactNode;
}
