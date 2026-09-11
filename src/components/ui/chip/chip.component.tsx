import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import type { ITypographyProps } from '@td/components/ui/typography/typography.types';
import { IconSizes } from '@td/theme/icon-sizes';
import type { TComponentTone } from '@td/types/ui.types';

import { StyledChip } from './chip.styles';
import type { IChipProps } from './chip.types';

const ChipTypographyToneByTone = {
	Brand: 'Primary',
	Neutral: 'Primary',
	Success: 'Success',
	Warning: 'Warning',
	Error: 'Error',
	Info: 'Info',
	Inverse: 'Inverse',
} satisfies Record<TComponentTone, NonNullable<ITypographyProps['tone']>>;

export const Chip = ({
	accessibilityLabel,
	children,
	disabled = false,
	iconName,
	leadingIconName,
	selected = false,
	testID,
	tone = 'Neutral',
	variant = 'Soft',
	onPress,
}: IChipProps) => {
	const resolvedIconName = leadingIconName ?? iconName;

	return (
		<StyledChip
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={onPress ? 'button' : undefined}
			accessibilityState={{ disabled, selected }}
			disabled={disabled}
			selected={selected}
			testID={testID}
			tone={tone}
			variant={variant}
			onPress={onPress}
		>
			{resolvedIconName ? (
				<AppIcon
					name={resolvedIconName}
					size={IconSizes.Small}
					tone={tone}
				/>
			) : null}

			<Typography
				size='Body2'
				tone={ChipTypographyToneByTone[tone]}
				weight='Semibold'
			>
				{children}
			</Typography>
		</StyledChip>
	);
};
