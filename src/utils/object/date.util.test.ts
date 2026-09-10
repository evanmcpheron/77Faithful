import dayjs from 'dayjs';
import {
	addDays,
	daysBetween,
	endOfDay,
	formatDate,
	isFuture,
	isPast,
	isToday,
	startOfDay,
	subtractDays,
	timeAgo,
} from './date.util';

describe('Date Utilities', () => {
	describe('formatDate', () => {
		it('should format a Date object with default format', () => {
			expect(formatDate('2025-01-15')).toBe('01/15/2025');
		});

		it('should format a date string', () => {
			expect(formatDate('2025-06-30')).toBe('06/30/2025');
		});

		it('should apply a custom format', () => {
			expect(formatDate('2025-01-15', 'MM/DD/YY HH:mm A')).toBe(
				'01/15/25 00:00 AM',
			);
		});

		it("should return '--' for undefined", () => {
			expect(formatDate(undefined)).toBe('--');
		});
	});

	describe('timeAgo', () => {
		it('should return a relative string for a past date', () => {
			const threeDaysAgo = dayjs().subtract(3, 'day').toDate();
			expect(timeAgo(threeDaysAgo)).toBe('3 days ago');
		});

		it('should return a relative string for a recent date', () => {
			const fewSecondsAgo = dayjs().subtract(5, 'second').toDate();
			expect(timeAgo(fewSecondsAgo)).toBe('a few seconds ago');
		});

		it("should return '--' for undefined", () => {
			expect(timeAgo(undefined)).toBe('--');
		});
	});

	describe('addDays', () => {
		it('should add days to a date', () => {
			const result = addDays('2025-01-01', 7);
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-01-08');
		});

		it('should handle adding 0 days', () => {
			const result = addDays('2025-01-01', 0);
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-01-01');
		});

		it('should handle adding across month boundaries', () => {
			const result = addDays('2025-01-28', 5);
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-02-02');
		});
	});

	describe('subtractDays', () => {
		it('should subtract days from a date', () => {
			const result = subtractDays('2025-01-08', 7);
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-01-01');
		});

		it('should handle subtracting across month boundaries', () => {
			const result = subtractDays('2025-02-02', 5);
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-01-28');
		});
	});

	describe('daysBetween', () => {
		it('should return the number of days between two dates', () => {
			expect(daysBetween('2025-01-01', '2025-01-08')).toBe(7);
		});

		it('should return an absolute value regardless of order', () => {
			expect(daysBetween('2025-01-08', '2025-01-01')).toBe(7);
		});

		it('should return 0 for the same date', () => {
			expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0);
		});
	});

	describe('isToday', () => {
		it('should return true for today', () => {
			expect(isToday(new Date())).toBe(true);
		});

		it('should return false for yesterday', () => {
			const yesterday = dayjs().subtract(1, 'day').toDate();
			expect(isToday(yesterday)).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isToday(undefined)).toBe(false);
		});
	});

	describe('isPast', () => {
		it('should return true for a past date', () => {
			expect(isPast('2020-01-01')).toBe(true);
		});

		it('should return false for a future date', () => {
			expect(isPast('2099-01-01')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isPast(undefined)).toBe(false);
		});
	});

	describe('isFuture', () => {
		it('should return true for a future date', () => {
			expect(isFuture('2099-01-01')).toBe(true);
		});

		it('should return false for a past date', () => {
			expect(isFuture('2020-01-01')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isFuture(undefined)).toBe(false);
		});
	});

	describe('startOfDay', () => {
		it('should return midnight for a given date', () => {
			const result = startOfDay('2025-04-21T14:30:00');
			const d = dayjs(result);
			expect(d.hour()).toBe(0);
			expect(d.minute()).toBe(0);
			expect(d.second()).toBe(0);
		});

		it('should preserve the date', () => {
			const result = startOfDay('2025-04-21T14:30:00');
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-04-21');
		});
	});

	describe('endOfDay', () => {
		it('should return 23:59:59 for a given date', () => {
			const result = endOfDay('2025-04-21T08:00:00');
			const d = dayjs(result);
			expect(d.hour()).toBe(23);
			expect(d.minute()).toBe(59);
			expect(d.second()).toBe(59);
		});

		it('should preserve the date', () => {
			const result = endOfDay('2025-04-21T08:00:00');
			expect(dayjs(result).format('YYYY-MM-DD')).toBe('2025-04-21');
		});
	});
});
