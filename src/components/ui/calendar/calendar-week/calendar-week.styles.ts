import { Pressable, View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { BrandColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface ICalendarWeekSelectableStyleProps {
	selected?: boolean;
}

const CalendarWeekLayout = {
	DateCellSize: 30,
	DayCellMinWidth: 38,
	DayCellHeight: 60,
} as const;

const FilteredDateView = withFilteredProps<
	ViewProps,
	ICalendarWeekSelectableStyleProps
>(View, ['selected']);

export const StyledHeaderRow = styled(View)({
	alignItems: 'center',
	flexDirection: 'row',
	justifyContent: 'space-between',
});

export const StyledDaysRow = styled(View)({
	flexDirection: 'row',
	justifyContent: 'space-between',
});

export const StyledDayPressable = styled(Pressable)({
	borderRadius: Radius.Large,
});

export const StyledDateCell = styled(
	FilteredDateView,
)<ICalendarWeekSelectableStyleProps>(({ selected }) => ({
	alignItems: 'center',
	backgroundColor: selected ? NeutralColors.White : 'transparent',
	borderRadius: Radius.Full,
	height: CalendarWeekLayout.DateCellSize,
	justifyContent: 'center',
	width: CalendarWeekLayout.DateCellSize,
}));

export const StyledDayCell = styled(
	FilteredDateView,
)<ICalendarWeekSelectableStyleProps>(({ selected }) => ({
	alignItems: 'center',
	backgroundColor: selected ? BrandColors.Primary : SurfaceColors.Muted,
	borderRadius: Radius.Large,
	height: CalendarWeekLayout.DayCellHeight,
	justifyContent: 'center',
	minWidth: CalendarWeekLayout.DayCellMinWidth,
	padding: Spacing.XXSmall,
}));
