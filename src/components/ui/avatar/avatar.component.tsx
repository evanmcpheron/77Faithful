import { Typography } from '@td/components/ui/typography/typography.component';

import { TypographySize, TypographyWeight } from '@td/theme/typography';
import { StyledAvatar, StyledAvatarImage } from './avatar.styles';
import type { IAvatarProps } from './avatar.types';

export const Avatar = ({
	accessibilityLabel,
	imageUrl,
	initials,
	size = 'Medium',
	testID,
	variant = 'Default',
}: IAvatarProps) => {
	return (
		<StyledAvatar
			accessibilityLabel={accessibilityLabel}
			accessible={Boolean(accessibilityLabel)}
			size={size}
			testID={testID}
			variant={variant}
		>
			{imageUrl ? (
				<StyledAvatarImage
					resizeMode='cover'
					size={size}
					source={{ uri: imageUrl }}
				/>
			) : (
				<Typography
					size={
						size === 'Small'
							? TypographySize.Body
							: TypographySize.H2
					}
					weight={TypographyWeight.Bold}
				>
					{initials}
				</Typography>
			)}
		</StyledAvatar>
	);
};
