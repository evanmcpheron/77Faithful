import type { ComponentProps } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

export const StyledSecondaryActionsRow = styled(FilteredView)({
	alignItems: 'center',
	flexDirection: 'row',
	justifyContent: 'space-between',
});

export const StyledDividerRow = styled(FilteredView)({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.XSmall,
});

export const StyledSocialButtonsRow = styled(FilteredView)({
	marginTop: Spacing.Small,
	alignSelf: 'center',
	gap: Spacing.Large,
	flexDirection: 'row',
	justifyContent: 'space-around',
});
