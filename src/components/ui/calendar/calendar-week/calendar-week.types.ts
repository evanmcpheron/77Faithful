export interface ICalendarWeekProps {}

export interface ICalendarWeekDayProps {
	day: Date;
	isSelected: boolean;
	onSelect: (day: Date) => void;
}
