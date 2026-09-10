import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { FlashList } from '@shopify/flash-list';
import type { SharedValue } from 'react-native-reanimated';
import Reanimated, {
	runOnJS,
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

import { TurndownButton } from '@td/components/ui/button/button.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { BrandColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

import {
	StyledScreenContent,
	StyledScreenKeyboardAvoidingView,
	StyledScreenRoot,
	StyledScreenSafeArea,
	StyledScreenStateCard,
	StyledScreenStateContainer,
	screenShellFillStyle,
	screenShellScrollContentStyle,
} from './screen.styles';
import type {
	IListScreenProps,
	ITurndownListScreenProps,
	ITurndownScrollScreenProps,
	ITurndownStaticScreenProps,
	TScreenHeaderRenderer,
	TScreenProps,
} from './screen.types';

const AnimatedFlashList = Reanimated.createAnimatedComponent(FlashList);

const DEFAULT_SAFE_AREA_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

interface IScreenStateViewProps {
	contentStyle: StyleProp<ViewStyle>;
	title: string;
	message?: string | undefined;
	actionLabel?: string | undefined;
	onActionPress?: (() => void) | undefined;
	customComponent?: ReactNode | undefined;
	showLoadingIndicator?: boolean | undefined;
}

const ScreenStateView = ({
	contentStyle,
	title,
	message,
	actionLabel,
	onActionPress,
	customComponent,
	showLoadingIndicator = false,
}: IScreenStateViewProps) => {
	if (customComponent) {
		return (
			<StyledScreenContent style={contentStyle}>
				{customComponent}
			</StyledScreenContent>
		);
	}

	return (
		<StyledScreenStateContainer style={contentStyle}>
			<StyledScreenStateCard>
				{showLoadingIndicator ? (
					<ActivityIndicator
						size='small'
						color={BrandColors.Primary}
					/>
				) : null}

				<Typography size='H2'>{title}</Typography>

				{message ? (
					<Typography
						size='Body'
						tone='Muted'
					>
						{message}
					</Typography>
				) : null}

				{onActionPress && actionLabel ? (
					<TurndownButton
						variant='Outline'
						onPress={onActionPress}
					>
						{actionLabel}
					</TurndownButton>
				) : null}
			</StyledScreenStateCard>
		</StyledScreenStateContainer>
	);
};

const getResolvedHorizontalPadding = (
	contentPadding: number | undefined,
	horizontalPadding: number | undefined,
): number => {
	return horizontalPadding ?? contentPadding ?? Spacing.Small;
};

const getResolvedVerticalPadding = (
	contentPadding: number | undefined,
	verticalPadding: number | undefined,
): number => {
	return verticalPadding ?? contentPadding ?? Spacing.Small;
};

const getResolvedBottomSpacing = (
	bottomSpacing: number | undefined,
): number => {
	// The custom bottom navigation already reserves its own layout height
	// via BAR_HEIGHT. The dome and active circle are absolutely positioned
	// on top of the bar, so scene content is intended to scroll underneath
	// them rather than reserve additional space.
	return bottomSpacing ?? 0;
};

const getBaseContentStyle = ({
	contentPadding,
	horizontalPadding,
	verticalPadding,
	bottomSpacing,
}: {
	contentPadding?: number | undefined;
	horizontalPadding?: number | undefined;
	verticalPadding?: number | undefined;
	bottomSpacing?: number | undefined;
}): ViewStyle => {
	const resolvedHorizontalPadding = getResolvedHorizontalPadding(
		contentPadding,
		horizontalPadding,
	);
	const resolvedVerticalPadding = getResolvedVerticalPadding(
		contentPadding,
		verticalPadding,
	);
	const resolvedBottomSpacing = getResolvedBottomSpacing(bottomSpacing);

	return {
		paddingBottom: resolvedVerticalPadding + resolvedBottomSpacing,
		paddingHorizontal: resolvedHorizontalPadding,
		paddingTop: resolvedVerticalPadding,
	};
};

const getSafeAreaEdges = ({
	safeAreaEdges,
	hasHeader,
}: {
	safeAreaEdges: Edge[];
	hasHeader: boolean;
}): Edge[] => {
	if (!hasHeader) {
		return safeAreaEdges;
	}

	return safeAreaEdges.filter((safeAreaEdge) => safeAreaEdge !== 'top');
};

const getContentGapStyle = (gap: number): ViewStyle | null => {
	if (gap <= 0) {
		return null;
	}

	return {
		gap,
	};
};

const getRenderedHeader = ({
	header,
	scrollOffset,
}: {
	header?: ReactNode | TScreenHeaderRenderer;
	scrollOffset: SharedValue<number>;
}): ReactNode => {
	if (typeof header === 'function') {
		return header(scrollOffset);
	}

	return header ?? null;
};

const Screen = <TItem,>(props: TScreenProps<TItem>) => {
	const {
		backgroundColor = 'transparent',
		contentBackgroundColor = backgroundColor,
		header,
		contentPadding,
		horizontalPadding,
		verticalPadding,
		bottomSpacing,
		safeAreaEdges = [...DEFAULT_SAFE_AREA_EDGES],
		keyboardEnabled = true,
		keyboardVerticalOffset = 0,
		isLoading = false,
		loadingComponent,
		errorMessage,
		errorComponent,
		onRetry,
		isEmpty = false,
		emptyComponent,
		gap = Spacing.XSmall,
		emptyTitle = 'Nothing to show yet',
		emptyMessage = 'There is no content available for this screen right now.',
		testID,
		scrollOffset: externalScrollOffset,
		onScrollPositionChange,
	} = props;

	const internalScrollOffset = useSharedValue(0);
	const headerScrollOffset = externalScrollOffset ?? internalScrollOffset;

	const animatedScrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			'worklet';
			headerScrollOffset.value = event.contentOffset.y;
		},
		onEndDrag: (event) => {
			'worklet';

			if (onScrollPositionChange) {
				runOnJS(onScrollPositionChange)(event.contentOffset.y);
			}
		},
		onMomentumEnd: (event) => {
			'worklet';

			if (onScrollPositionChange) {
				runOnJS(onScrollPositionChange)(event.contentOffset.y);
			}
		},
	});

	const insets = useSafeAreaInsets();

	const rootStyle: ViewStyle = {
		backgroundColor,
	};

	const surfaceStyle: ViewStyle = {
		backgroundColor: contentBackgroundColor,
	};

	const bodySafeAreaStyle: ViewStyle = {
		backgroundColor: contentBackgroundColor,
	};

	const baseContentStyle = getBaseContentStyle({
		contentPadding,
		horizontalPadding,
		verticalPadding,
		bottomSpacing,
	});
	const stateContentStyle: StyleProp<ViewStyle> = [
		surfaceStyle,
		baseContentStyle,
	];
	const contentGapStyle = getContentGapStyle(gap);

	const hasErrorState = Boolean(errorComponent) || Boolean(errorMessage);
	const screenHeader = getRenderedHeader({
		header,
		scrollOffset: headerScrollOffset,
	});
	const hasHeader = screenHeader !== null;
	const bodySafeAreaEdges = getSafeAreaEdges({
		safeAreaEdges,
		hasHeader,
	});

	const renderRootLayout = (content: ReactNode) => {
		return (
			<StyledScreenRoot
				style={rootStyle}
				testID={testID}
			>
				{content}
			</StyledScreenRoot>
		);
	};

	const renderBodySafeArea = (content: ReactNode) => {
		return (
			<StyledScreenSafeArea
				edges={bodySafeAreaEdges}
				style={bodySafeAreaStyle}
			>
				{content}
			</StyledScreenSafeArea>
		);
	};

	const renderScreenLayout = (content: ReactNode) => {
		return renderRootLayout(
			<>
				{screenHeader}
				{renderBodySafeArea(content)}
			</>,
		);
	};

	if (isLoading) {
		return renderScreenLayout(
			<ScreenStateView
				contentStyle={stateContentStyle}
				title='Loading'
				message='Please wait while the screen content loads.'
				customComponent={loadingComponent}
				showLoadingIndicator={!loadingComponent}
			/>,
		);
	}

	if (hasErrorState) {
		return renderScreenLayout(
			<ScreenStateView
				contentStyle={stateContentStyle}
				title='Something went wrong'
				message={errorMessage}
				actionLabel={onRetry ? 'Retry' : undefined}
				onActionPress={onRetry}
				customComponent={errorComponent}
			/>,
		);
	}

	if (isEmpty) {
		return renderScreenLayout(
			<ScreenStateView
				contentStyle={stateContentStyle}
				title={emptyTitle}
				message={emptyMessage}
				customComponent={emptyComponent}
			/>,
		);
	}

	if (props.contentMode === 'static') {
		const staticContent = (
			<StyledScreenContent
				style={[surfaceStyle, baseContentStyle, contentGapStyle]}
			>
				{props.children}
			</StyledScreenContent>
		);

		return renderScreenLayout(
			keyboardEnabled ? (
				<StyledScreenKeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					keyboardVerticalOffset={keyboardVerticalOffset}
				>
					{staticContent}
				</StyledScreenKeyboardAvoidingView>
			) : (
				staticContent
			),
		);
	}

	if (props.contentMode === 'scroll') {
		const baseHorizontalPadding =
			(baseContentStyle.paddingHorizontal as number) || 0;
		const baseTopPadding = (baseContentStyle.paddingTop as number) || 0;
		const baseBottomPadding =
			(baseContentStyle.paddingBottom as number) || 0;

		const scrollBodyStyle: ViewStyle = {
			paddingTop:
				baseTopPadding +
				(bodySafeAreaEdges.includes('top') ? insets.top : 0),
			paddingBottom:
				baseBottomPadding +
				(bodySafeAreaEdges.includes('bottom') ? insets.bottom : 0),
			paddingLeft:
				baseHorizontalPadding +
				(bodySafeAreaEdges.includes('left') ? insets.left : 0),
			paddingRight:
				baseHorizontalPadding +
				(bodySafeAreaEdges.includes('right') ? insets.right : 0),
		};

		const scrollBodyContent = (
			<View style={[surfaceStyle, contentGapStyle, scrollBodyStyle]}>
				{props.children}
			</View>
		);
		const scrollContent = (
			<>
				{screenHeader}
				{scrollBodyContent}
			</>
		);

		const scrollView = (
			<Reanimated.ScrollView
				style={[screenShellFillStyle, surfaceStyle]}
				onScroll={animatedScrollHandler}
				scrollEventThrottle={16}
				decelerationRate={Platform.OS === 'ios' ? 'normal' : 'fast'}
				overScrollMode='never'
				removeClippedSubviews={Platform.OS === 'android'}
				keyboardDismissMode={
					Platform.OS === 'ios' ? 'interactive' : 'on-drag'
				}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
				alwaysBounceVertical={true}
				contentInsetAdjustmentBehavior='never'
			>
				{scrollContent}
			</Reanimated.ScrollView>
		);

		return renderRootLayout(
			<StyledScreenContent>
				{keyboardEnabled ? (
					<StyledScreenKeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						keyboardVerticalOffset={keyboardVerticalOffset}
					>
						{scrollView}
					</StyledScreenKeyboardAvoidingView>
				) : (
					scrollView
				)}
			</StyledScreenContent>,
		);
	}
	const listProps = props as IListScreenProps<TItem>;
	const {
		contentContainerStyle,
		data,
		horizontal,
		ItemSeparatorComponent,
		keyboardDismissMode,
		keyboardShouldPersistTaps,
		renderItem,
		showsVerticalScrollIndicator,
		style,
		ListHeaderComponent,
		...flashListProps
	} = listProps;

	const listData = data ?? [];
	const isHorizontalList = Boolean(horizontal);

	const ListItemGapSeparator = () => {
		const listItemGapSeparatorStyle: ViewStyle = isHorizontalList
			? { width: gap }
			: { height: gap };

		return <View style={listItemGapSeparatorStyle} />;
	};

	const resolvedItemSeparatorComponent =
		ItemSeparatorComponent === undefined && gap > 0
			? ListItemGapSeparator
			: ItemSeparatorComponent;

	const baseHorizontalPadding =
		(baseContentStyle.paddingHorizontal as number) || 0;
	const baseTopPadding = (baseContentStyle.paddingTop as number) || 0;
	const baseBottomPadding = (baseContentStyle.paddingBottom as number) || 0;

	const listPaddingLeft =
		baseHorizontalPadding +
		(bodySafeAreaEdges.includes('left') ? insets.left : 0);
	const listPaddingRight =
		baseHorizontalPadding +
		(bodySafeAreaEdges.includes('right') ? insets.right : 0);
	const listPaddingTop =
		baseTopPadding + (bodySafeAreaEdges.includes('top') ? insets.top : 0);
	const listPaddingBottom =
		baseBottomPadding +
		(bodySafeAreaEdges.includes('bottom') ? insets.bottom : 0);

	const listContentContainerStyle: StyleProp<ViewStyle> = [
		{ paddingBottom: listPaddingBottom },
		listData.length === 0 ? screenShellScrollContentStyle : null,
		contentContainerStyle,
	];

	const renderListHeader = () => {
		if (!screenHeader && !ListHeaderComponent) return null;

		let userHeader = null;
		if (React.isValidElement(ListHeaderComponent)) {
			userHeader = ListHeaderComponent;
		} else if (ListHeaderComponent) {
			const Component = ListHeaderComponent as React.FC<any>;
			userHeader = <Component />;
		}

		return (
			<View>
				{screenHeader}
				{userHeader ? (
					<View
						style={[
							contentGapStyle,
							{
								paddingTop: listPaddingTop,
								paddingLeft: listPaddingLeft,
								paddingRight: listPaddingRight,
								paddingBottom: listData.length > 0 ? gap : 0,
							},
						]}
					>
						{userHeader}
					</View>
				) : null}
			</View>
		);
	};

	const wrappedRenderItem = renderItem
		? (info: any) => (
				<View
					style={{
						paddingLeft: listPaddingLeft,
						paddingRight: listPaddingRight,
					}}
				>
					{renderItem(info)}
				</View>
			)
		: null;

	const listElement = (
		<AnimatedFlashList
			{...(flashListProps as any)}
			onScroll={animatedScrollHandler}
			scrollEventThrottle={16}
			data={listData as any}
			renderItem={wrappedRenderItem}
			horizontal={horizontal}
			ItemSeparatorComponent={resolvedItemSeparatorComponent}
			ListHeaderComponent={renderListHeader()}
			style={{ ...screenShellFillStyle, ...surfaceStyle, ...style }}
			contentContainerStyle={listContentContainerStyle}
			keyboardDismissMode={
				keyboardDismissMode ??
				(Platform.OS === 'ios' ? 'interactive' : 'on-drag')
			}
			keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
			showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
			testID={testID ? `${testID}.list` : undefined}
		/>
	);

	return renderRootLayout(
		<StyledScreenSafeArea
			edges={bodySafeAreaEdges.filter((e) => e !== 'bottom')}
			style={bodySafeAreaStyle}
		>
			{keyboardEnabled ? (
				<StyledScreenKeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					keyboardVerticalOffset={keyboardVerticalOffset}
				>
					{listElement}
				</StyledScreenKeyboardAvoidingView>
			) : (
				listElement
			)}
		</StyledScreenSafeArea>,
	);
};

export const TurndownStaticScreen = (props: ITurndownStaticScreenProps) => {
	return (
		<Screen
			{...props}
			contentMode='static'
		/>
	);
};

export const TurndownScrollScreen = (props: ITurndownScrollScreenProps) => {
	return (
		<Screen
			{...props}
			contentMode='scroll'
		/>
	);
};

export const TurndownListScreen = <TItem,>(
	props: ITurndownListScreenProps<TItem>,
) => {
	return (
		<Screen<TItem>
			{...props}
			contentMode='list'
		/>
	);
};
