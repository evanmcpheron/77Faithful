import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import {
	ActionColors,
	BorderColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';

interface IStyledNavigationActionListItemProps {
	disabled?: boolean;
}

const NavigationActionListIconSize = IconSizes.Large * 2;

export const StyledNavigationActionList = styled.View({
	...Shadows.Card,
	backgroundColor: NeutralColors.White,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.XLarge,
	borderWidth: 1,
	paddingHorizontal: Spacing.Small,
	paddingVertical: Spacing.XSmall,
});

export const StyledNavigationActionListItem = styled(
	Pressable,
)<IStyledNavigationActionListItemProps>(({ disabled }) => ({
	alignItems: 'center',
	flexDirection: 'row',
	gap: Spacing.Small,
	minHeight: Spacing.Huge,
	opacity: disabled ? ActionColors.DisabledOpacity : 1,
}));

export const StyledNavigationActionListIconContainer = styled.View({
	alignItems: 'center',
	backgroundColor: SurfaceColors.Muted,
	borderRadius: Radius.Full,
	height: NavigationActionListIconSize,
	justifyContent: 'center',
	width: NavigationActionListIconSize,
});

export const StyledNavigationActionListTitleContainer = styled.View({
	flex: 1,
});

export const StyledNavigationActionListChevron = styled.View`
	transform: rotate(90deg);
`;

export const StyledNavigationActionListSeparator = styled.View({
	alignSelf: 'stretch',
	backgroundColor: BorderColors.Default,
	height: 1,
});
