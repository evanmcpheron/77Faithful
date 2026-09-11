import { Image, View, type ImageProps, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IAvatarProps, TAvatarSize } from './avatar.types';

type TStyledAvatarProps = Required<Pick<IAvatarProps, 'size' | 'variant'>>;

type TAvatarSizeConfig = {
	size: number;
};

const AVATAR_SIZE_CONFIG: Record<TAvatarSize, TAvatarSizeConfig> = {
	Small: { size: 32 },
	Medium: { size: 48 },
	Large: { size: 64 },
};

const FilteredView = withFilteredProps<ViewProps, TStyledAvatarProps>(View, [
	'size',
	'variant',
]);

type TStyledAvatarImageProps = Pick<TStyledAvatarProps, 'size'>;

const FilteredImage = withFilteredProps<ImageProps, TStyledAvatarImageProps>(
	Image,
	['size'],
);

export const StyledAvatar = styled(FilteredView)<TStyledAvatarProps>(({
	size,
	variant,
}) => {
	const avatarSize = AVATAR_SIZE_CONFIG[size].size;

	return {
		alignItems: 'center',
		backgroundColor: SurfaceColors.Muted,
		borderColor:
			variant === 'Muted' ? NeutralColors.Grey200 : BorderColors.Inverse,
		borderRadius: Radius.Full,
		borderWidth: 1,
		height: avatarSize,
		justifyContent: 'center',
		overflow: 'hidden',
		width: avatarSize,
	};
});

export const StyledAvatarImage = styled(FilteredImage)<TStyledAvatarImageProps>(
	({ size }) => {
		const avatarSize = AVATAR_SIZE_CONFIG[size].size;

		return {
			height: avatarSize,
			width: avatarSize,
		};
	},
);
