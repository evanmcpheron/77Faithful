import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';

import {
	StyledKeyValueRow,
	StyledKeyValueRowContent,
} from './key-value-row.styles';
import type { IKeyValueRowProps } from './key-value-row.types';

export const KeyValueRow = ({
	iconName,
	label,
	testID,
	value,
}: IKeyValueRowProps) => {
	return (
		<StyledKeyValueRow testID={testID}>
			{iconName ? <AppIcon name={iconName} /> : null}

			<StyledKeyValueRowContent>
				<Typography
					size='Body2'
					tone='Secondary'
				>
					{label}
				</Typography>

				{typeof value === 'string' || typeof value === 'number' ? (
					<Typography
						size='Body'
						weight='Medium'
					>
						{value}
					</Typography>
				) : (
					value
				)}
			</StyledKeyValueRowContent>
		</StyledKeyValueRow>
	);
};
