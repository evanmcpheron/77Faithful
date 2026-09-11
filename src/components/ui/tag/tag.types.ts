import type { ReactNode } from 'react';

import type { TBadgeVariant } from '@td/components/ui/badge/badge.types';

export interface ITagProps {
	children: ReactNode;
	variant?: TBadgeVariant;
	testID?: string;
}
