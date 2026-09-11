import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { IconBadge } from '@td/components/ui/icon-badge/icon-badge.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { BrandColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';

import {
	StyledEmptyStateContent,
	StyledEmptyStateIconWrapper,
} from './empty-state.styles';
import type { IEmptyStateProps } from './empty-state.types';

export const EmptyState = ({
	actionLabel,
	children,
	description,
	iconName,
	testID,
	title,
	onActionPress,
}: IEmptyStateProps) => {
	return (
		<Card
			{...(testID ? { testID } : {})}
			variant='Muted'
		>
			<StyledEmptyStateContent>
				{iconName ? (
					<StyledEmptyStateIconWrapper>
						<IconBadge
							name={iconName}
							size={IconSizes.Large}
							color={BrandColors.Secondary}
							backgroundColor={BrandColors.Secondary}
						/>
					</StyledEmptyStateIconWrapper>
				) : null}
				<Typography
					size='H2'
					weight='Semibold'
					align='center'
				>
					{title}
				</Typography>
				{description ? (
					<Typography
						size='Body'
						tone='Secondary'
						align='center'
					>
						{description}
					</Typography>
				) : null}
				{children}
				{actionLabel && onActionPress ? (
					<TurndownButton
						fullWidth
						onPress={onActionPress}
					>
						{actionLabel}
					</TurndownButton>
				) : null}
			</StyledEmptyStateContent>
		</Card>
	);
};
