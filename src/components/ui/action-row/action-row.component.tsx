import { IconBadge } from '@td/components/ui/icon-badge/icon-badge.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconSizes } from '@td/theme/icon-sizes';

import { Typography } from '../typography/typography.component';

import {
	StyledActionRow,
	StyledActionRowContent,
	StyledActionRowTitleRow,
} from './action-row.styles';
import type { IActionRowProps } from './action-row.types';

export const ActionRow = ({
	accessibilityLabel,
	children,
	description,
	disabled = false,
	leadingIconName,
	testID,
	title,
	tone = 'Brand',
	trailingIconName,
	variant = 'Default',
	onPress,
}: IActionRowProps) => {
	return (
		<StyledActionRow
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={onPress ? 'button' : undefined}
			accessibilityState={{ disabled }}
			disabled={disabled}
			testID={testID}
			tone={tone}
			variant={variant}
			onPress={onPress}
		>
			{leadingIconName ? (
				<AppIcon
					name={leadingIconName}
					size={IconSizes.Medium}
					tone={tone}
				/>
			) : null}

			<StyledActionRowContent>
				<StyledActionRowTitleRow>
					{title ? (
						<Typography
							size='H2'
							weight='Semibold'
						>
							{title}
						</Typography>
					) : null}
					{trailingIconName && (
						<IconBadge
							name={trailingIconName}
							size={IconSizes.Medium}
						/>
					)}
				</StyledActionRowTitleRow>

				{description ? (
					<Typography
						size='Body2'
						tone='Muted'
					>
						{description}
					</Typography>
				) : null}
			</StyledActionRowContent>

			{children}
		</StyledActionRow>
	);
};
