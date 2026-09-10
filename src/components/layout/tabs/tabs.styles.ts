import type { ComponentProps } from 'react';
import { Animated, Pressable, Text, View, type TextProps } from 'react-native';
import styled from 'styled-components/native';

import { NeutralColors, SurfaceColors, TextColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface ITabLabelStyleProps {
	isActive: boolean;
}

const TRACK_BACKGROUND_COLOR = SurfaceColors.Muted;
const ACTIVE_THUMB_BACKGROUND_COLOR = NeutralColors.White;
const ACTIVE_TEXT_COLOR = TextColors.Secondary;
const INACTIVE_TEXT_COLOR = TextColors.Disabled;

const TRACK_PADDING = Spacing.XSmall;
const TRACK_HEIGHT = 60;
const TRACK_BORDER_RADIUS = Radius.Medium;

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

const FilteredAnimatedView = withFilteredProps<
	ComponentProps<typeof Animated.View>,
	object
>(Animated.View, []);

const FilteredPressable = withFilteredProps<
	ComponentProps<typeof Pressable>,
	object
>(Pressable, []);

const FilteredTabLabel = withFilteredProps<TextProps, ITabLabelStyleProps>(
	Text,
	['isActive'],
);

export const StyledTabsContainer = styled(FilteredView)({
	gap: Spacing.Small,
	width: '100%',
});

export const StyledTabsTrackContainer = styled(FilteredView)({
	alignItems: 'stretch',
	backgroundColor: TRACK_BACKGROUND_COLOR,
	borderRadius: TRACK_BORDER_RADIUS,
	flexDirection: 'row',
	flexShrink: 0,
	padding: TRACK_PADDING,
	position: 'relative',
});

export const StyledTabsActiveThumb = styled(FilteredAnimatedView)({
	...Shadows.Subtle,
	backgroundColor: ACTIVE_THUMB_BACKGROUND_COLOR,
	borderRadius: TRACK_BORDER_RADIUS - TRACK_PADDING,
	bottom: TRACK_PADDING,
	left: TRACK_PADDING,
	position: 'absolute',
	top: TRACK_PADDING,
});

export const StyledTabsItemPressable = styled(FilteredPressable)(
	({ disabled }) => ({
		alignItems: 'center',
		borderRadius: TRACK_BORDER_RADIUS - TRACK_PADDING,
		flex: 1,
		justifyContent: 'center',
		minHeight: TRACK_HEIGHT - TRACK_PADDING * 2,
		opacity: disabled ? 0.45 : 1,
		zIndex: 1,
	}),
);

export const StyledTabsLabel = styled(FilteredTabLabel)<ITabLabelStyleProps>(
	({ isActive }) => ({
		color: isActive ? ACTIVE_TEXT_COLOR : INACTIVE_TEXT_COLOR,
	}),
);

export const tabsConstants = {
	listPadding: TRACK_PADDING,
};
