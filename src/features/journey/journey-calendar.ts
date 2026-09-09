import type { TCalendarDate } from '../../types/shared/persistence.types';

export const getJourneyCalendarDate = (instant: Date, timeZoneId: string): TCalendarDate => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === 'year')!.value;
  const month = parts.find((part) => part.type === 'month')!.value;
  const day = parts.find((part) => part.type === 'day')!.value;
  return `${year}-${month}-${day}` as TCalendarDate;
};

export const addJourneyCalendarDays = (
  calendarDate: TCalendarDate,
  days: number,
): TCalendarDate => {
  const date = new Date(`${calendarDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return getJourneyCalendarDate(date, 'UTC');
};

export const getJourneyDayNumber = (startDate: string, calendarDate: string): number => {
  return (
    Math.round(
      (Date.parse(`${calendarDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000,
    ) + 1
  );
};

export const getJourneyEndTime = (startDate: TCalendarDate, timeZoneId: string): number => {
  const endDate = addJourneyCalendarDays(startDate, 77);
  const utcMidnight = Date.parse(`${endDate}T00:00:00Z`);
  let earliest = utcMidnight - 2 * 86400000;
  let latest = utcMidnight + 2 * 86400000;
  // Find the first instant of the end date, including zones whose offset changes at midnight.
  while (earliest < latest) {
    const midpoint = Math.floor((earliest + latest) / 2);
    if (getJourneyCalendarDate(new Date(midpoint), timeZoneId) < endDate) earliest = midpoint + 1;
    else latest = midpoint;
  }
  return earliest;
};
