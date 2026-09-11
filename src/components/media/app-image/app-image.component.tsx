import { StyledAppImage } from './app-image.styles';
import { ImageSize, type IAppImageProps } from './app-image.types';

export const AppImage = ({
	accessibilityLabel,
	contentFit = 'cover',
	source,
	size = ImageSize.Medium,
	testID,
}: IAppImageProps) => {
	return (
		<StyledAppImage
			size={size}
			accessibilityLabel={accessibilityLabel}
			accessible={Boolean(accessibilityLabel)}
			contentFit={contentFit}
			source={source}
			testID={testID}
		/>
	);
};
