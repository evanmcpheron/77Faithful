export const JOURNEY_DAY_COUNT = 77;
export const JOURNEY_WEEK_COUNT = 11;

declare const journeyDayNumber: unique symbol;
export type JourneyDayNumber = number & { readonly [journeyDayNumber]: true };
export type JourneyWeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export function isJourneyDayNumber(value: unknown): value is JourneyDayNumber {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= JOURNEY_DAY_COUNT
  );
}

export function toJourneyDayNumber(value: unknown): JourneyDayNumber {
  if (!isJourneyDayNumber(value)) throw new RangeError('Expected a Journey day from 1 through 77.');
  return value;
}

export function isJourneyWeekNumber(value: unknown): value is JourneyWeekNumber {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= JOURNEY_WEEK_COUNT
  );
}

export function toJourneyWeekNumber(value: unknown): JourneyWeekNumber {
  if (!isJourneyWeekNumber(value))
    throw new RangeError('Expected a Journey week from 1 through 11.');
  return value;
}

export function journeyWeekForDay(day: JourneyDayNumber): JourneyWeekNumber {
  return toJourneyWeekNumber(Math.floor((day - 1) / 7) + 1);
}

export type JourneyState =
  | { readonly status: 'notStarted'; readonly currentDay?: never }
  | { readonly status: 'active'; readonly currentDay: JourneyDayNumber }
  | { readonly status: 'ended'; readonly currentDay?: never };
