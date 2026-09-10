import { TurndownButton } from '../button/button.component';
import { Typography } from '../typography/typography.component';

import { StyledSectionHeader } from './section-header.styles';
import type { ISectionHeaderProps } from './section-header.types';

export const SectionHeader = ({
	title,
	callToActionText,
	onPress,
}: ISectionHeaderProps) => {
	return (
		<StyledSectionHeader>
			<Typography
				size='H1'
				weight='Bold'
			>
				{title}
			</Typography>
			<TurndownButton
				variant='Link'
				fullWidth
				align='right'
				onPress={onPress}
			>
				{callToActionText}
			</TurndownButton>
		</StyledSectionHeader>
	);
};
