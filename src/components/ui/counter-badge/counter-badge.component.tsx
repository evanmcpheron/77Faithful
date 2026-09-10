import { Typography } from '@td/components/ui/typography/typography.component';

import { StyledCounterBadge } from './counter-badge.styles';
import type { ICounterBadgeProps } from './counter-badge.types';

export const CounterBadge = ({
	accessibilityLabel,
	count,
	maxCount = 99,
	testID,
	variant = 'Default',
}: ICounterBadgeProps) => {
	const displayCount = count > maxCount ? `${maxCount}+` : `${count}`;
	return (
		<StyledCounterBadge
			accessibilityLabel={accessibilityLabel ?? `${displayCount} items`}
			accessible
			testID={testID}
			variant={variant}
		>
			<Typography
				size='Body2'
				tone={variant === 'Active' ? 'Error' : 'Secondary'}
				weight='Bold'
			>
				{displayCount}
			</Typography>
		</StyledCounterBadge>
	);
};
