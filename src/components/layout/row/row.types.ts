import type { ReactNode } from 'react';

import type { TSpacing } from '@td/theme/spacing';

export interface IRowProps {
	children?: ReactNode;
	fillChildren?: boolean;
	justifyContent?:
		| 'space-between'
		| 'space-around'
		| 'space-evenly'
		| 'flex-start'
		| 'flex-end'
		| 'center';
	gap?: TSpacing;
}
