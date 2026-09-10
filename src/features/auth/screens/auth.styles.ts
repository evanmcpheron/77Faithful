import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Layout } from '@td/theme/layout';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

const FilteredAnimatedScrollView = withFilteredProps<
	ComponentProps<typeof Animated.ScrollView>,
	object
>(Animated.ScrollView, []);

const FilteredAnimatedView = withFilteredProps<
	ComponentProps<typeof Animated.View>,
	object
>(Animated.View, []);

const FilteredSafeAreaView = withFilteredProps<
	ComponentProps<typeof SafeAreaView>,
	object
>(SafeAreaView, []);

export const StyledAuthScreen = styled(FilteredView)({
	backgroundColor: SurfaceColors.Screen,
	flex: 1,
});

export const StyledAuthScrollView = styled(FilteredAnimatedScrollView)({
	flex: 1,
});

export const AuthScrollContentStyle = {
	flexGrow: 1,
};

export const StyledAuthHeaderContainer = styled(FilteredAnimatedView)({
	backgroundColor: SurfaceColors.Header,
	height: Layout.AuthHeaderHeight,
	overflow: 'hidden',
});

export const StyledAuthHeaderSafeArea = styled(FilteredSafeAreaView)({
	flex: 1,
});

export const StyledAuthHeaderContent = styled(FilteredView)({
	alignItems: 'center',
	flex: 1,
	justifyContent: 'center',
	paddingHorizontal: Spacing.Small,
});

export const StyledAuthBodyContainer = styled(FilteredView)({
	backgroundColor: SurfaceColors.Card,
	borderTopLeftRadius: Radius.XLarge,
	borderTopRightRadius: Radius.XLarge,
	flex: 1,
	marginTop: -Spacing.Large,
	paddingBottom: Spacing.Medium,
	paddingHorizontal: Spacing.Small,
	paddingTop: Spacing.Small,
});

export const StyledAuthBodyCard = styled(FilteredView)({
	...Shadows.Card,
	backgroundColor: SurfaceColors.Card,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Large,
	borderWidth: 1,
	flex: 1,
	minHeight: 0,
	padding: Spacing.Medium,
});
