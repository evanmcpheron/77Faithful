import type { ComponentProps } from 'react';
import { Platform, Pressable, Text, type TextStyle, View } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import { withFilteredProps } from '@td/utils/styles/styles.util';

import {
	ACTIVE_COLOR,
	BAR_HEIGHT,
	CIRCLE_ABSOLUTE_TOP,
	CIRCLE_SIZE,
	INACTIVE_ICON_SIZE,
	INACTIVE_LABEL_FONT_SIZE,
	SVG_OVERHANG,
	SVG_TOTAL_HEIGHT,
} from './navigation.utils';

const AnimatedText = Animated.createAnimatedComponent(Text);

const navigationTabLabelPlatformStyle: TextStyle =
	Platform.select<TextStyle>({
		android: {
			includeFontPadding: false,
		},
		default: {},
	}) ?? {};

interface INavigationNestedScreenStyleProps {
	isOnNestedScreen?: boolean;
}

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

const FilteredPressable = withFilteredProps<
	ComponentProps<typeof Pressable>,
	object
>(Pressable, []);

const FilteredAnimatedView = withFilteredProps<
	ComponentProps<typeof Animated.View>,
	object
>(Animated.View, []);

const FilteredAnimatedText = withFilteredProps<
	ComponentProps<typeof AnimatedText>,
	object
>(AnimatedText, []);

const FilteredNestedAwareAnimatedView = withFilteredProps<
	ComponentProps<typeof Animated.View>,
	INavigationNestedScreenStyleProps
>(Animated.View, ['isOnNestedScreen']);

const FilteredNestedAwareView = withFilteredProps<
	ComponentProps<typeof View>,
	INavigationNestedScreenStyleProps
>(View, ['isOnNestedScreen']);

export const StyledNavigationOuterContainer = styled(
	FilteredNestedAwareAnimatedView,
)<INavigationNestedScreenStyleProps>(({ isOnNestedScreen }) => ({
	backgroundColor: 'transparent',
	...(isOnNestedScreen ? { height: 0 } : { height: 90 }),
	overflow: 'visible',
	position: 'relative',
}));

export const StyledNavigationBarFrame = styled(FilteredAnimatedView)({
	bottom: 0,
	height: BAR_HEIGHT,
	left: 0,
	overflow: 'visible',
	position: 'absolute',
	right: 0,
});

export const StyledNavigationVisualLayer = styled(
	FilteredNestedAwareView,
)<INavigationNestedScreenStyleProps>(({ isOnNestedScreen }) => {
	return {
		bottom: 0,
		height: !isOnNestedScreen ? SVG_TOTAL_HEIGHT : SVG_TOTAL_HEIGHT,
		left: 0,
		position: 'absolute',
		right: 0,
	};
});

export const StyledNavigationShadowLayer = styled(FilteredView)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledNavigationActiveCircle = styled(FilteredAnimatedView)({
	alignItems: 'center',
	backgroundColor: ACTIVE_COLOR,
	borderRadius: CIRCLE_SIZE / 2,
	height: CIRCLE_SIZE,
	justifyContent: 'center',
	left: 0,
	position: 'absolute',
	top: CIRCLE_ABSOLUTE_TOP,
	width: CIRCLE_SIZE,
});

export const StyledNavigationTabsRow = styled(FilteredView)({
	alignItems: 'stretch',
	flexDirection: 'row',
	height: BAR_HEIGHT,
	left: 0,
	position: 'absolute',
	right: 0,
	top: SVG_OVERHANG,
});

export const StyledNavigationTabButton = styled(FilteredPressable)({
	alignItems: 'center',
	flexGrow: 1,
	justifyContent: 'flex-start',
	paddingBottom: 58,
	paddingTop: 12,
});

export const StyledNavigationTabIconArea = styled(FilteredView)({
	alignItems: 'center',
	height: INACTIVE_ICON_SIZE + 2,
	justifyContent: 'center',
	marginBottom: 4,
});

export const StyledNavigationTabLabel = styled(FilteredAnimatedText).attrs({
	style: navigationTabLabelPlatformStyle,
})({
	fontSize: INACTIVE_LABEL_FONT_SIZE,
	letterSpacing: -0.1,
	textAlign: 'center',
});
