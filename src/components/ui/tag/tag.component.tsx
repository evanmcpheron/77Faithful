import { Badge } from '@td/components/ui/badge/badge.component';

import type { ITagProps } from './tag.types';

export const Tag = ({ children, testID, variant = 'Default' }: ITagProps) => {
	return (
		<Badge
			testID={testID}
			variant={variant}
		>
			{children}
		</Badge>
	);
};
