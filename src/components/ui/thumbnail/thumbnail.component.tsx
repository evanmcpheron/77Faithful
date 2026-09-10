import { AppIcon } from '@td/components/ui/icon/icon.component';

import { StyledThumbnail, StyledThumbnailImage } from './thumbnail.styles';
import type { IThumbnailProps } from './thumbnail.types';

export const Thumbnail = ({
	accessibilityLabel,
	fallbackIconName,
	imageUrl,
	size = 'Medium',
	testID,
}: IThumbnailProps) => {
	return (
		<StyledThumbnail
			accessibilityLabel={accessibilityLabel}
			accessible={Boolean(accessibilityLabel)}
			size={size}
			testID={testID}
		>
			{imageUrl ? (
				<StyledThumbnailImage
					resizeMode='cover'
					size={size}
					source={{ uri: imageUrl }}
				/>
			) : fallbackIconName ? (
				<AppIcon name={fallbackIconName} />
			) : null}
		</StyledThumbnail>
	);
};
