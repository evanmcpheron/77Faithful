import { ActivityIndicator } from 'react-native';

import { BrandColors } from '@td/theme/colors';

import { Typography } from '@td/components/ui/typography/typography.component';

import { StyledLoadingState } from './loading-state.styles';
import type { ILoadingStateProps } from './loading-state.types';

export const LoadingState = ({
	label,
	size = 'Large',
	testID,
}: ILoadingStateProps) => {
	return (
		<StyledLoadingState testID={testID}>
			<ActivityIndicator
				color={BrandColors.Secondary}
				size={size === 'Large' ? 'large' : 'small'}
			/>

			{label ? (
				<Typography
					size='Body'
					tone='Muted'
				>
					{label}
				</Typography>
			) : null}
		</StyledLoadingState>
	);
};
