import type { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components/native';

import HeaderBackgroundSvg from '@td/assets/backgrounds/header.svg';
import { NeutralColors } from '@td/theme/colors';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const WhiteScrollContentStyle = {
	flexGrow: 1,
};

const FilteredHeaderBackgroundSvg = withFilteredProps<
	ComponentProps<typeof HeaderBackgroundSvg>,
	object
>(HeaderBackgroundSvg, []);

const FilteredScrollView = withFilteredProps<
	ComponentProps<typeof ScrollView>,
	object
>(ScrollView, []);

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

export const StyledWhiteScrollScreen = styled(FilteredScrollView).attrs({
	contentContainerStyle: WhiteScrollContentStyle,
})({
	backgroundColor: NeutralColors.White,
	flex: 1,
});

export const StyledBlackScreen = styled(FilteredView)({
	backgroundColor: NeutralColors.Black,
	flex: 1,
});

export const StyledHeaderSvg = styled(FilteredHeaderBackgroundSvg)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});
