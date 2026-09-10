import { Badge } from '@td/components/ui/badge/badge.component';
import type { TComponentTone } from '@td/types/ui.types';

import { Status, type TStatus } from '@td/types/global.types';
import type { IStatusBadgeProps } from './status-badge.types';

const STATUS_BADGE_LABELS: Record<TStatus, string> = {
	[Status.PENDING]: 'Pending',
	[Status.IN_PROGRESS]: 'In Progress',
	[Status.COMPLETED]: 'Completed',
	[Status.OVERDUE]: 'Overdue',
	[Status.ACTIVE]: 'Active',
	[Status.INACTIVE]: 'Inactive',
};

const STATUS_BADGE_TONES: Record<TStatus, TComponentTone> = {
	[Status.PENDING]: 'Neutral',
	[Status.IN_PROGRESS]: 'Info',
	[Status.COMPLETED]: 'Success',
	[Status.OVERDUE]: 'Error',
	[Status.ACTIVE]: 'Brand',
	[Status.INACTIVE]: 'Neutral',
};

export const StatusBadge = ({
	label,
	status,
	style,
	testID,
}: IStatusBadgeProps) => {
	return (
		<Badge
			style={style}
			testID={testID}
			tone={STATUS_BADGE_TONES[status]}
		>
			{label ?? STATUS_BADGE_LABELS[status]}
		</Badge>
	);
};
