import { PhotoGrid } from '@td/components/media/photo-grid/photo-grid.component';

import type { IBeforeAfterPhotoRowProps } from './before-after-photo-row.types';

export const BeforeAfterPhotoRow = ({
	afterSource,
	beforeSource,
	testID,
}: IBeforeAfterPhotoRowProps) => {
	return (
		<PhotoGrid
			accessibilityLabel='Before and after photos'
			sources={[beforeSource, afterSource]}
			testID={testID}
			thumbnailSize='Large'
		/>
	);
};
