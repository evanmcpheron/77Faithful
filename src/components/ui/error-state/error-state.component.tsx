import { TurndownButton } from '@td/components/ui/button/button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';

import {
	StyledErrorState,
	StyledErrorStateActions,
} from './error-state.styles';
import type { IErrorStateProps } from './error-state.types';

export const ErrorState = ({
	iconName,
	message = 'Something went wrong. Please try again.',
	retryLabel = 'Try again',
	testID,
	title = 'Unable to load',
	onRetry,
}: IErrorStateProps) => {
	return (
		<StyledErrorState testID={testID}>
			{iconName ? <AppIcon name={iconName} /> : null}

			<Typography
				size='H2'
				tone='Error'
				weight='Semibold'
			>
				{title}
			</Typography>

			<Typography
				size='Body'
				tone='Muted'
			>
				{message}
			</Typography>

			{onRetry ? (
				<StyledErrorStateActions>
					<TurndownButton
						fullWidth={false}
						variant='Outline'
						onPress={onRetry}
					>
						{retryLabel}
					</TurndownButton>
				</StyledErrorStateActions>
			) : null}
		</StyledErrorState>
	);
};
