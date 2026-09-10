import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(isoWeek);

type DateInput = Date | string | undefined;
type DateFormatTypes = 'MM/DD/YYYY' | 'MM/DD/YY HH:mm A';

export const formatDate = (
	date?: DateInput,
	format: DateFormatTypes = 'MM/DD/YYYY',
): string => {
	if (!date) {
		return '--';
	}
	return dayjs(date).format(format);
};

/**
 * Returns a human-readable relative time string
 * @example timeAgo('2024-01-01') => '3 months ago'
 * @example timeAgo(new Date()) => 'a few seconds ago'
 */
export const timeAgo = (date: DateInput): string => {
	if (!date) {
		return '--';
	}
	return dayjs(date).fromNow();
};

/**
 * Adds days to a date
 * @example addDays(new Date('2025-01-01'), 7) => Date('2025-01-08')
 */
export const addDays = (date: DateInput, days: number): Date => {
	return dayjs(date).add(days, 'day').toDate();
};

/**
 * Subtracts days from a date
 * @example subtractDays(new Date('2025-01-08'), 7) => Date('2025-01-01')
 */
export const subtractDays = (date: DateInput, days: number): Date => {
	return dayjs(date).subtract(days, 'day').toDate();
};

/**
 * Returns the number of days between two dates (absolute value)
 * @example daysBetween('2025-01-01', '2025-01-08') => 7
 */
export const daysBetween = (dateA: DateInput, dateB: DateInput): number => {
	return Math.abs(dayjs(dateA).diff(dayjs(dateB), 'day'));
};

/**
 * Checks if a date is today
 * @example isToday(new Date()) => true
 */
export const isToday = (date: DateInput): boolean => {
	if (!date) {
		return false;
	}
	return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Checks if a date is in the past
 * @example isPast('2020-01-01') => true
 */
export const isPast = (date: DateInput): boolean => {
	if (!date) {
		return false;
	}
	return dayjs(date).isBefore(dayjs());
};

/**
 * Checks if a date is in the future
 * @example isFuture('2099-01-01') => true
 */
export const isFuture = (date: DateInput): boolean => {
	if (!date) {
		return false;
	}
	return dayjs(date).isAfter(dayjs());
};

/**
 * Returns the start of the day (midnight) for a given date
 * @example startOfDay(new Date('2025-04-21T14:30:00')) => Date('2025-04-21T00:00:00')
 */
export const startOfDay = (date: DateInput): Date => {
	return dayjs(date).startOf('day').toDate();
};

/**
 * Returns the end of the day (23:59:59.999) for a given date
 * @example endOfDay(new Date('2025-04-21T14:30:00')) => Date('2025-04-21T23:59:59.999')
 */
export const endOfDay = (date: DateInput): Date => {
	return dayjs(date).endOf('day').toDate();
};

/**
 * Returns the start of the week (Monday at 00:00:00) for a given date.
 * @example startOfWeek('2025-04-23') => Date('2025-04-21T00:00:00')
 */
export const startOfWeek = (date: DateInput): Date => {
	return dayjs(date).startOf('isoWeek').toDate();
};

/**
 * Returns the end of the week (Sunday at 23:59:59.999) for a given date.
 * @example endOfWeek('2025-04-23') => Date('2025-04-27T23:59:59.999')
 */
export const endOfWeek = (date: DateInput): Date => {
	return dayjs(date).endOf('isoWeek').toDate();
};

/**
 * Returns the seven dates of the week (Monday through Sunday) that
 * contain the given date. Each entry is set to the start of its day.
 * @example getWeekDays('2025-04-23') => [Mon 04/21, Tue 04/22, ..., Sun 04/27]
 */
export const getWeekDays = (date: DateInput): Date[] => {
	const weekStart = dayjs(date).startOf('isoWeek');

	return Array.from({ length: 7 }, (_, index) =>
		weekStart.add(index, 'day').toDate(),
	);
};

/**
 * Returns the same weekday in the next week (7 days forward).
 * @example addWeeks(new Date('2025-04-23'), 1) => Date('2025-04-30')
 */
export const addWeeks = (date: DateInput, weeks: number): Date => {
	return dayjs(date).add(weeks, 'week').toDate();
};

/**
 * Returns the same weekday in a previous week (7 days backward).
 * @example subtractWeeks(new Date('2025-04-30'), 1) => Date('2025-04-23')
 */
export const subtractWeeks = (date: DateInput, weeks: number): Date => {
	return dayjs(date).subtract(weeks, 'week').toDate();
};
