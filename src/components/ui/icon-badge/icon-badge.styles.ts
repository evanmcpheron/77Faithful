import styled from 'styled-components/native';

import { IconSizes } from '@td/theme/icon-sizes';
import { Radius } from '@td/theme/radius';

interface IIconBadgeBackgroundStyleProps {
	backgroundColor: string;
}

export const StyledIconBadge = styled.View({
	height: IconSizes.Medium * 1.5,
	position: 'relative',
	width: IconSizes.Medium * 1.5,
});

export const StyledIconBadgeBackground =
	styled.View<IIconBadgeBackgroundStyleProps>(({ backgroundColor }) => ({
		backgroundColor,
		borderRadius: Radius.Full,
		height: IconSizes.Medium * 1.25,
		left: 0,
		position: 'absolute',
		top: 0,
		width: IconSizes.Medium * 1.25,
		opacity: 0.05,
	}));

export const StyledIconBadgeIconContainer = styled.View({
	bottom: 0,
	position: 'absolute',
	right: 0,
});
