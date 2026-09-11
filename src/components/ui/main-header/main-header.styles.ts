import type { ComponentProps } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

export const MainHeaderLayout = {
	HeaderBackgroundHeight: 175,
	HeroCardHeight: 130,
} as const;

export const HeroCardOverhang = MainHeaderLayout.HeroCardHeight / 2;
const HeaderRowGap = MainHeaderLayout.HeroCardHeight + Spacing.Small;

interface IMainHeaderStyleProps {
	hasGradientHeader: boolean;
	canGoBack: boolean;
	hasHeroContent: boolean;
}

const MainHeaderStylePropNames = [
	'hasGradientHeader',
	'canGoBack',
	'hasHeroContent',
] as const satisfies readonly (keyof IMainHeaderStyleProps)[];

const FilteredView = withFilteredProps<ViewProps, IMainHeaderStyleProps>(
	View,
	MainHeaderStylePropNames,
);

const FilteredAnimatedView = withFilteredProps<
	ComponentProps<typeof Animated.View>,
	IMainHeaderStyleProps
>(Animated.View, MainHeaderStylePropNames);

export const StyledHeader = styled(FilteredView)<IMainHeaderStyleProps>(({
	hasHeroContent,
}) => {
	return {
		backgroundColor: 'transparent',
		minHeight: 0,
		overflow: 'visible',
		paddingBottom: hasHeroContent ? HeaderRowGap : Spacing.Small,
		paddingHorizontal: Spacing.Small,
		paddingTop: Spacing.XXHuge,
		position: 'relative',
	};
});

export const StyledHeaderBackground = styled(FilteredAnimatedView).attrs({
	renderToHardwareTextureAndroid: true,
	shouldRasterizeIOS: true,
})<IMainHeaderStyleProps>(
	({ hasGradientHeader, canGoBack, hasHeroContent }) => {
		return {
			backgroundColor: hasGradientHeader
				? 'transparent'
				: SurfaceColors.Header,
			...(hasGradientHeader && { marginBottom: -HeaderRowGap }),
			borderBottomLeftRadius:
				!canGoBack || !hasGradientHeader ? Radius.XLarge : 0,
			borderBottomRightRadius:
				!canGoBack || !hasGradientHeader ? Radius.XLarge : 0,
			bottom: hasHeroContent ? HeroCardOverhang : 0,
			left: 0,
			overflow: 'hidden',
			position: 'absolute',
			right: 0,
			top: -60,
		};
	},
);

const HeaderGradientColors = [
	SurfaceColors.HeaderGradientStart,
	SurfaceColors.HeaderGradientEnd,
] as const;

const HeaderGradientLocations = [0, 1] as const;

export const StyledHeaderGradient = styled(LinearGradient).attrs({
	colors: HeaderGradientColors,
	end: {
		x: 0.5,
		y: 1,
	},
	locations: HeaderGradientLocations,
	start: {
		x: 0.5,
		y: 0,
	},
})({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledHeroCard = styled.View.attrs({
	renderToHardwareTextureAndroid: true,
	shouldRasterizeIOS: true,
	style: Platform.OS !== 'web' ? { elevation: 8 } : undefined,
})({
	...Shadows.Card,
	backgroundColor: SurfaceColors.Accent,
	borderRadius: Radius.XLarge,
	bottom: 0,
	height: MainHeaderLayout.HeroCardHeight,
	justifyContent: 'center',
	left: Spacing.Small,
	overflow: 'hidden',
	paddingHorizontal: Spacing.Small,
	position: 'absolute',
	right: Spacing.Small,
	zIndex: 2,
});

export const StyledHeroImage = styled.Image.attrs({
	resizeMode: 'cover',
})({
	aspectRatio: 1,
	height: '100%',
	position: 'absolute',
});
