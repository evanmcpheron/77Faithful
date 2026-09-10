import type { ComponentProps } from 'react';
import type { ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import styled from 'styled-components/native';

import { NeutralColors } from '@td/theme/colors';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const FilteredGestureHandlerRootView = withFilteredProps<
	ComponentProps<typeof GestureHandlerRootView>,
	object
>(GestureHandlerRootView, []);

export const StyledRootGestureContainer = styled(
	FilteredGestureHandlerRootView,
)({
	flex: 1,
	backgroundColor: NeutralColors.White,
});

export const StackContentStyle = {
	backgroundColor: NeutralColors.White,
} satisfies ViewStyle;
