import { Typography } from '@td/components/ui/typography/typography.component';

import { useAuth } from '@td/providers/auth/auth.hook';
import { TypographySize, TypographyWeight } from '@td/theme/typography';
import { StyledAvatar, StyledAvatarImage } from './avatar.styles';
import type { IAvatarProps } from './avatar.types';

export const Avatar = ({
	accessibilityLabel,
	imageUrl,
	size = 'Medium',
	testID,
	variant = 'Default',
}: IAvatarProps) => {
	const { user } = useAuth();
	const firstInitial = user?.firstName?.slice(0, 1).toUpperCase();
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
					{firstInitial}
				</Typography>
			)}
		</StyledAvatar>
	);
};
