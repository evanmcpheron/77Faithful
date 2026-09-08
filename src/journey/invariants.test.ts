import {
  isJourneyDayNumber,
  isJourneyWeekNumber,
  toJourneyDayNumber,
  toJourneyWeekNumber,
} from './invariants';

it.each([1, 77])('accepts Journey day %s', (value) => {
  expect(isJourneyDayNumber(value)).toBe(true);
  expect(toJourneyDayNumber(value)).toBe(value);
});

it.each([0, 78, -1, 1.5, NaN, Infinity, '1', null, undefined])(
  'rejects invalid Journey day %s',
  (value) => {
    expect(isJourneyDayNumber(value)).toBe(false);
    expect(() => toJourneyDayNumber(value)).toThrow(RangeError);
  },
);

it.each([1, 11])('accepts Journey week %s', (value) => {
  expect(isJourneyWeekNumber(value)).toBe(true);
  expect(toJourneyWeekNumber(value)).toBe(value);
});

it.each([0, 12, -1, 1.5, NaN, Infinity, '1', null])('rejects invalid Journey week %s', (value) => {
  expect(isJourneyWeekNumber(value)).toBe(false);
  expect(() => toJourneyWeekNumber(value)).toThrow(RangeError);
});
