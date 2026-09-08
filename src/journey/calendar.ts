declare const calendarDate: unique symbol;
declare const journeyTimeZone: unique symbol;

// Date-only Gregorian YYYY-MM-DD; never a midnight instant.
export type CalendarDate = string & { readonly [calendarDate]: true };
export type JourneyTimeZone = string & { readonly [journeyTimeZone]: true };

export type JourneyCalendar = {
  readonly startDate: CalendarDate;
  readonly timeZone: JourneyTimeZone;
};

function utcDate(value: string): Date {
  const date = new Date(0);
  // setUTCFullYear avoids Date.UTC's special treatment of years 0–99.
  date.setUTCFullYear(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  );
  return date;
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.length !== 10 ||
    value.startsWith('0000')
  )
    return false;
  const date = utcDate(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toCalendarDate(value: unknown): CalendarDate {
  if (!isCalendarDate(value))
    throw new RangeError('Expected a Gregorian date YYYY-MM-DD in years 0001–9999.');
  return value;
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  if (!Number.isSafeInteger(days))
    throw new RangeError('Calendar days must be a whole safe integer.');
  const result = utcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  if (!Number.isFinite(result.getTime())) throw new RangeError('Calendar date is out of range.');
  return toCalendarDate(result.toISOString().split('T')[0]);
}

/** Signed number of calendar boundaries from start to end. */
export function calendarDaysBetween(start: CalendarDate, end: CalendarDate): number {
  // UTC encodes date ordinals here, not elapsed time between Journey instants/local midnights.
  return (utcDate(end).getTime() - utcDate(start).getTime()) / 86_400_000;
}

export function toJourneyTimeZone(value: unknown): JourneyTimeZone {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(value) ||
    value.trim() !== value
  ) {
    throw new RangeError('Expected a supported IANA timezone identifier.');
  }
  // Intl rejects unknown names; never omit timeZone and inherit the device setting.
  new Intl.DateTimeFormat('en-US', { timeZone: value });
  return value as JourneyTimeZone;
}

export function calendarDateAtInstant(
  epochMilliseconds: number,
  timeZone: JourneyTimeZone,
): CalendarDate {
  if (
    !Number.isSafeInteger(epochMilliseconds) ||
    !Number.isFinite(new Date(epochMilliseconds).getTime())
  ) {
    throw new RangeError('Expected a valid instant in epoch milliseconds.');
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    era: 'short',
  }).formatToParts(epochMilliseconds);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  if (part('era') !== 'AD') throw new RangeError('Calendar date is out of range.');
  return toCalendarDate(`${part('year')?.padStart(4, '0')}-${part('month')}-${part('day')}`);
}
