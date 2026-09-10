import type { ReactNode } from 'react';

import type { FlashListProps } from '@shopify/flash-list';
import type { SharedValue } from 'react-native-reanimated';
import type { Edge } from 'react-native-safe-area-context';

export const ScreenContentMode = {
	Static: 'static',
	Scroll: 'scroll',
	List: 'list',
} as const;

export type TScreenContentMode =
	(typeof ScreenContentMode)[keyof typeof ScreenContentMode];

export type TScreenHeaderRenderer = (
	scrollOffset: SharedValue<number>,
) => ReactNode;

export interface IScreenBaseProps {
	backgroundColor?: string;
	contentBackgroundColor?: string;
	header?: ReactNode | TScreenHeaderRenderer;
	contentPadding?: number;
	horizontalPadding?: number;
	verticalPadding?: number;
	bottomSpacing?: number;
	safeAreaEdges?: Edge[];
	keyboardEnabled?: boolean;
	keyboardVerticalOffset?: number;
	isLoading?: boolean;
	loadingComponent?: ReactNode;
	errorMessage?: string;
	errorComponent?: ReactNode;
	onRetry?: () => void;
	isEmpty?: boolean;
	emptyComponent?: ReactNode;
	emptyTitle?: string;
	emptyMessage?: string;
	gap?: number;
	testID?: string;
	scrollOffset?: SharedValue<number>;
	onScrollPositionChange?: (y: number) => void;
}

export interface ITurndownStaticScreenProps extends IScreenBaseProps {
	children?: ReactNode;
}

export interface ITurndownScrollScreenProps extends IScreenBaseProps {
	children?: ReactNode;
}

export interface ITurndownListScreenProps<TItem>
	extends
		IScreenBaseProps,
		Omit<FlashListProps<TItem>, keyof IScreenBaseProps | 'contentMode'> {
	children?: never;
}

interface IStaticScreenProps extends ITurndownStaticScreenProps {
	contentMode: typeof ScreenContentMode.Static;
}

interface IScrollScreenProps extends ITurndownScrollScreenProps {
	contentMode: typeof ScreenContentMode.Scroll;
}

export interface IListScreenProps<
	TItem,
> extends ITurndownListScreenProps<TItem> {
	contentMode: typeof ScreenContentMode.List;
}

export type TScreenProps<TItem> =
	IStaticScreenProps | IScrollScreenProps | IListScreenProps<TItem>;
