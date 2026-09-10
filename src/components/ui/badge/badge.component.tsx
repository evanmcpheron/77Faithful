import { Typography } from '@td/components/ui/typography/typography.component';
import type { ITypographyProps } from '@td/components/ui/typography/typography.types';
import type { TComponentTone } from '@td/types/ui.types';

import { StyledBadge } from './badge.styles';
import type { IBadgeProps } from './badge.types';

const BadgeTypographyToneByTone = {
	Brand: 'Primary',
	Neutral: 'Primary',
	Success: 'Success',
	Warning: 'Warning',
	Error: 'Error',
	Info: 'Info',
	Inverse: 'Inverse',
} satisfies Record<TComponentTone, NonNullable<ITypographyProps['tone']>>;

const SolidBadgeTypographyToneByTone = {
	Brand: 'Inverse',
	Neutral: 'Inverse',
	Success: 'Inverse',
	Warning: 'Inverse',
	Error: 'Inverse',
	Info: 'Inverse',
	Inverse: 'Inverse',
} satisfies Record<TComponentTone, NonNullable<ITypographyProps['tone']>>;

export const Badge = ({
	children,
	testID,
	style,
	tone = 'Brand',
	variant = 'Soft',
}: IBadgeProps) => {
	const typographyTone =
		variant === 'Solid'
			? SolidBadgeTypographyToneByTone[tone]
			: BadgeTypographyToneByTone[tone];

	return (
		<StyledBadge
			testID={testID}
			tone={tone}
			style={style}
			variant={variant}
		>
			<Typography
				size='Body2'
				tone={typographyTone}
				weight='Semibold'
			>
				{children}
			</Typography>
		</StyledBadge>
	);
};
