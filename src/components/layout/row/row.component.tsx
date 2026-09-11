import { Children } from 'react';

import { StyledRow, StyledRowItem } from './row.styles';
import type { IRowProps } from './row.types';

export const Row = ({
	children,
	fillChildren = true,
	gap,
	justifyContent,
}: IRowProps) => {
	const rowChildren = fillChildren
		? Children.map(children, (child) => {
				if (
					child === null ||
					child === undefined ||
					typeof child === 'boolean'
				) {
					return child;
				}

				return <StyledRowItem>{child}</StyledRowItem>;
			})
		: children;

	return (
		<StyledRow
			gap={gap}
			justifyContent={justifyContent}
		>
			{rowChildren}
		</StyledRow>
	);
};
