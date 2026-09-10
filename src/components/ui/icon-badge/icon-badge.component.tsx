import { BrandColors } from '@td/theme/colors';

import { AppIcon } from '../icon/icon.component';
import {
	StyledIconBadge,
	StyledIconBadgeBackground,
	StyledIconBadgeIconContainer,
} from './icon-badge.styles';
import type { IIconBadgeProps } from './icon-badge.types';

export const IconBadge = ({
	name,
	size,
	color,
	backgroundColor = BrandColors.Secondary,
	tone,
	strokeWidth,
	testID,
}: IIconBadgeProps) => {
	return (
		<StyledIconBadge testID={testID}>
			<StyledIconBadgeBackground backgroundColor={backgroundColor} />

			<StyledIconBadgeIconContainer>
				<AppIcon
					name={name}
					size={size}
					color={color}
					tone={tone}
					strokeWidth={strokeWidth}
				/>
			</StyledIconBadgeIconContainer>
		</StyledIconBadge>
	);
};
