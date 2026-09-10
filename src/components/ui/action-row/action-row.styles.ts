import { Pressable, type PressableProps } from 'react-native';
import styled from 'styled-components/native';

import {
	ActionColors,
	BorderColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IActionRowProps } from './action-row.types';

type TActionRowStyleProps = Required<
	Pick<IActionRowProps, 'disabled' | 'tone' | 'variant'>
>;

const FilteredPressable = withFilteredProps<
	PressableProps,
	TActionRowStyleProps
>(Pressable, ['tone', 'variant']);

export const StyledActionRow = styled(FilteredPressable).attrs({
	renderToHardwareTextureAndroid: true,
	shouldRasterizeIOS: true,
})<TActionRowStyleProps>(({ disabled, variant }) => ({
	...Shadows.Card,
	alignItems: 'center',
	alignSelf: 'stretch',
	backgroundColor:
		variant === 'Muted' ? SurfaceColors.Muted : NeutralColors.White,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Large,
	borderWidth: 1,
	flexDirection: 'row',
	gap: Spacing.Small,
	opacity: disabled ? ActionColors.DisabledOpacity : 1,
	padding: Spacing.Small,
}));

export const StyledActionRowContent = styled.View({
	flex: 1,
	gap: 2,
});

export const StyledActionRowTitleRow = styled.View({
	alignItems: 'center',
	flexDirection: 'row',
	justifyContent: 'space-between',
});
