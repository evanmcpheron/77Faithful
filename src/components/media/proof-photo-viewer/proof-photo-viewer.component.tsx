import { ImageViewer } from '@td/components/media/image-viewer/image-viewer.component';

import type { IProofPhotoViewerProps } from './proof-photo-viewer.types';

export const ProofPhotoViewer = ({
	accessibilityLabel,
	contentFit,
	source,
	testID,
	title,
}: IProofPhotoViewerProps) => {
	return (
		<ImageViewer
			accessibilityLabel={accessibilityLabel}
			contentFit={contentFit}
			source={source}
			testID={testID}
			title={title}
		/>
	);
};
