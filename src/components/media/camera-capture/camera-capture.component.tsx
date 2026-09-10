import { TurndownButton } from '@td/components/ui/button/button.component';

import type { ICameraCaptureProps } from './camera-capture.types';

export const CameraCapture = ({
	accessibilityLabel,
	label = 'Take Photo',
	testID,
	onCapture,
}: ICameraCaptureProps) => {
	return (
		<TurndownButton
			accessibilityLabel={accessibilityLabel ?? label}
			testID={testID}
			onPress={onCapture}
		>
			{label}
		</TurndownButton>
	);
};
