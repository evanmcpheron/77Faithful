import { TurndownButton } from '@td/components/ui/button/button.component';

import type { IImageUploaderProps } from './image-uploader.types';

export const ImageUploader = ({
	accessibilityLabel,
	label,
	testID,
	onPress,
}: IImageUploaderProps) => {
	return (
		<TurndownButton
			accessibilityLabel={accessibilityLabel ?? label}
			testID={testID}
			variant='Outline'
			onPress={onPress}
		>
			{label}
		</TurndownButton>
	);
};
