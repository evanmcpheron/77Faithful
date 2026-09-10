import type { ReactNode } from 'react';

import type { TIconName } from '@td/components/ui/icon/icon.types';

export interface IEmptyStateProps {
	title: string;
	description?: string;
	iconName?: TIconName;
	actionLabel?: string;
	children?: ReactNode;
	testID?: string;
	onActionPress?: () => void;
}
