import type { ReactNode } from 'react';

import type { TIconName } from '@td/components/ui/icon/icon.types';

export interface IKeyValueRowProps {
	label: string;
	value?: ReactNode;
	iconName?: TIconName;
	testID?: string;
}
