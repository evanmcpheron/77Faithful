import { Typography } from '@td/components/ui/typography/typography.component';

import {
	StyledProgressBar,
	StyledProgressBarFill,
	StyledProgressBarTrack,
} from './progress-bar.styles';
import type { IProgressBarProps } from './progress-bar.types';

const clampProgressValue = (value: number, min: number, max: number) => {
	return Math.min(Math.max(value, min), max);
};

export const ProgressBar = ({
	label,
	max = 100,
	min = 0,
	showLabel = false,
	testID,
	value,
}: IProgressBarProps) => {
	const clampedValue = clampProgressValue(value, min, max);
	const progressPercent =
		max === min ? 0 : ((clampedValue - min) / (max - min)) * 100;
	const displayLabel = label ?? `${Math.round(progressPercent)}%`;

	return (
		<StyledProgressBar testID={testID}>
			{showLabel ? (
				<Typography
					size='Body2'
					tone='Muted'
				>
					{displayLabel}
				</Typography>
			) : null}

			<StyledProgressBarTrack>
				<StyledProgressBarFill progressPercent={progressPercent} />
			</StyledProgressBarTrack>
		</StyledProgressBar>
	);
};
