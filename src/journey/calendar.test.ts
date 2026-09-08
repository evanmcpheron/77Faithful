import {
  addCalendarDays,
  calendarDateAtInstant,
  calendarDaysBetween,
  compareCalendarDates,
  isCalendarDate,
  toCalendarDate,
  toJourneyTimeZone,
} from './calendar';

it.each(['2026-09-08', '2024-02-29', '2000-02-29', '0001-01-01', '0099-12-31', '9999-12-31'])(
  'accepts date-only %s',
  (value) => {
    expect(isCalendarDate(value)).toBe(true);
    expect(toCalendarDate(value)).toBe(value);
  },
);

it.each([
  '2026-02-29',
  '1900-02-29',
  '2026-02-31',
  '2026-04-31',
  '2026-00-01',
  '2026-13-01',
  '2026-01-00',
  '2026-01-32',
  '0000-01-01',
  '10000-01-01',
  '2026-9-08',
  '2026-09-8',
  '2026-09-08\n',
  ' 2026-09-08',
  '2026-09-08T00:00:00Z',
  '',
  null,
  undefined,
  20260908,
])('rejects invalid date-only input %s without normalization', (value) => {
  expect(isCalendarDate(value)).toBe(false);
  expect(() => toCalendarDate(value)).toThrow(RangeError);
});

it.each([
  ['2024-02-28', 1, '2024-02-29'],
  ['2024-02-28', 2, '2024-03-01'],
  ['2026-03-01', -1, '2026-02-28'],
  ['2026-12-31', 1, '2027-01-01'],
  ['0099-12-31', 1, '0100-01-01'],
  ['2026-09-08', 0, '2026-09-08'],
] as const)('adds calendar days from %s by %s to %s', (start, days, end) => {
  expect(addCalendarDays(toCalendarDate(start), days)).toBe(end);
  expect(calendarDaysBetween(toCalendarDate(start), toCalendarDate(end))).toBe(days);
  expect(calendarDaysBetween(toCalendarDate(end), toCalendarDate(start))).toBe(
    days === 0 ? 0 : -days,
  );
  expect(compareCalendarDates(toCalendarDate(start), toCalendarDate(end))).toBe(
    days > 0 ? -1 : days < 0 ? 1 : 0,
  );
});

it.each([1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects non-whole day addition %s',
  (days) => {
    expect(() => addCalendarDays(toCalendarDate('2026-09-08'), days)).toThrow(RangeError);
  },
);

it('rejects arithmetic outside the supported date-only range', () => {
  expect(() => addCalendarDays(toCalendarDate('0001-01-01'), -1)).toThrow(RangeError);
  expect(() => addCalendarDays(toCalendarDate('9999-12-31'), 1)).toThrow(RangeError);
  expect(() => addCalendarDays(toCalendarDate('2026-09-08'), Number.MAX_SAFE_INTEGER)).toThrow(
    RangeError,
  );
});

it.each(['UTC', 'America/New_York', 'Pacific/Kiritimati', 'Asia/Kathmandu', 'US/Eastern'])(
  'accepts supported IANA name %s',
  (value) => {
    expect(toJourneyTimeZone(value)).toBe(value);
  },
);

it.each([
  '',
  'Invalid/Zone',
  'America/New York',
  'UTC\n',
  ' UTC',
  '+14:00',
  '-0500',
  undefined,
  null,
  0,
])('rejects unsupported timezone %s', (value) => {
  expect(() => toJourneyTimeZone(value)).toThrow(RangeError);
});

it.each([
  ['UTC', '2026-09-08T23:59:59.999Z', '2026-09-08'],
  ['UTC', '2026-09-09T00:00:00.000Z', '2026-09-09'],
  ['America/New_York', '2026-09-09T03:59:59.999Z', '2026-09-08'],
  ['America/New_York', '2026-09-09T04:00:00.000Z', '2026-09-09'],
  ['Pacific/Kiritimati', '2026-09-08T09:59:59.999Z', '2026-09-08'],
  ['Pacific/Kiritimati', '2026-09-08T10:00:00.000Z', '2026-09-09'],
  ['Asia/Kathmandu', '2026-09-08T18:15:00.000Z', '2026-09-09'],
] as const)('observes %s at explicit instant %s', (zone, instant, expected) => {
  expect(calendarDateAtInstant(Date.parse(instant), toJourneyTimeZone(zone))).toBe(expected);
});

it.each([
  ['2026-03-08T05:00:00Z', '2026-03-09T04:00:00Z', 23],
  ['2026-11-01T04:00:00Z', '2026-11-02T05:00:00Z', 25],
] as const)('counts one local date across DST from %s to %s (%s hours)', (start, end, hours) => {
  const zone = toJourneyTimeZone('America/New_York');
  expect((Date.parse(end) - Date.parse(start)) / 3_600_000).toBe(hours);
  expect(
    calendarDaysBetween(
      calendarDateAtInstant(Date.parse(start), zone),
      calendarDateAtInstant(Date.parse(end), zone),
    ),
  ).toBe(1);
});

it('uses the supplied Journey timezone even when travel would change the device date', () => {
  const instant = Date.parse('2026-09-09T02:00:00Z');
  expect(calendarDateAtInstant(instant, toJourneyTimeZone('America/New_York'))).toBe('2026-09-08');
  expect(calendarDateAtInstant(instant, toJourneyTimeZone('Asia/Tokyo'))).toBe('2026-09-09');
});

it.each([
  NaN,
  Infinity,
  0.5,
  8_640_000_000_000_001,
  Date.parse('0000-01-01T00:00:00Z'),
  Date.parse('+010000-01-01T00:00:00Z'),
])('rejects invalid/out-of-range instant %s', (instant) => {
  expect(() => calendarDateAtInstant(instant, toJourneyTimeZone('UTC'))).toThrow(RangeError);
});
