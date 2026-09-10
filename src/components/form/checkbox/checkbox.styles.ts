import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const FilteredPressable = withFilteredProps<
	ComponentProps<typeof Pressable>,
	object
>(Pressable, []);

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

export const StyledCheckboxContainer = styled(FilteredPressable)(
	({ disabled }) => ({
		alignItems: 'center',
		flexDirection: 'row',
		gap: Spacing.XSmall,
		opacity: disabled ? 0.5 : 1,
	}),
);

export const StyledCheckboxButton = styled(FilteredView)({
	alignItems: 'center',
	justifyContent: 'center',
});

export const StyledUncheckedBox = styled(FilteredView)({
	position: 'relative',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: NeutralColors.White,
	borderColor: BorderColors.Control,
	borderRadius: Radius.Small,
	borderWidth: 1,
	height: 24,
	width: 24,
});
