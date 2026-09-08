import { calendarDateAtInstant, toCalendarDate, toJourneyTimeZone } from './calendar';
import { journeyWeekForDay, toJourneyDayNumber } from './invariants';
import { journeyDateForDay, journeyStateAtInstant, journeyStateOnDate } from './progression';

const journey = Object.freeze({
  startDate: toCalendarDate('2026-01-01'),
  timeZone: toJourneyTimeZone('America/New_York'),
});

it.each([
  ['2026-01-01T04:59:59.999Z', { status: 'notStarted' }],
  ['2026-01-01T05:00:00.000Z', { status: 'active', currentDay: 1 }],
  ['2026-01-02T05:00:00.000Z', { status: 'active', currentDay: 2 }],
  ['2026-03-18T04:00:00.000Z', { status: 'active', currentDay: 77 }],
  ['2026-03-19T03:59:59.999Z', { status: 'active', currentDay: 77 }],
  ['2026-03-19T04:00:00.000Z', { status: 'ended' }],
  ['2027-01-01T00:00:00.000Z', { status: 'ended' }],
])('derives calendar lifecycle at %s', (instant, expected) => {
  const state = journeyStateAtInstant(journey, Date.parse(instant));
  expect(state).toEqual(expected);
  if (state.status !== 'active') expect(state).not.toHaveProperty('currentDay');
});

it('maps every day to its represented date and back without accepting participation input', () => {
  for (let day = 1; day <= 77; day++) {
    const date = journeyDateForDay(journey.startDate, toJourneyDayNumber(day));
    expect(journeyStateOnDate(journey.startDate, date)).toEqual({
      status: 'active',
      currentDay: day,
    });
  }
  expect(journeyDateForDay(journey.startDate, toJourneyDayNumber(1))).toBe('2026-01-01');
  expect(journeyDateForDay(journey.startDate, toJourneyDayNumber(77))).toBe('2026-03-18');
  expect(journey.startDate).toBe('2026-01-01');
});

it.each([
  ['2026-03-07', '2026-03-08T04:59:59.999Z', 1],
  ['2026-03-07', '2026-03-08T05:00:00.000Z', 2],
  ['2026-03-07', '2026-03-08T06:59:59.999Z', 2],
  ['2026-03-07', '2026-03-08T07:00:00.000Z', 2],
  ['2026-03-07', '2026-03-09T03:59:59.999Z', 2],
  ['2026-03-07', '2026-03-09T04:00:00.000Z', 3],
  ['2026-10-31', '2026-11-01T03:59:59.999Z', 1],
  ['2026-10-31', '2026-11-01T04:00:00.000Z', 2],
  ['2026-10-31', '2026-11-01T05:59:59.999Z', 2],
  ['2026-10-31', '2026-11-01T06:00:00.000Z', 2],
  ['2026-10-31', '2026-11-02T04:59:59.999Z', 2],
  ['2026-10-31', '2026-11-02T05:00:00.000Z', 3],
] as const)('advances across DST from %s at %s to day %s', (start, instant, day) => {
  expect(
    journeyStateAtInstant({ ...journey, startDate: toCalendarDate(start) }, Date.parse(instant)),
  ).toEqual({ status: 'active', currentDay: day });
});

it.each([
  ['Pacific/Kiritimati', '2026-01-01T09:59:59.999Z', 1],
  ['Pacific/Kiritimati', '2026-01-01T10:00:00.000Z', 2],
  ['America/Los_Angeles', '2026-01-02T07:59:59.999Z', 1],
  ['America/Los_Angeles', '2026-01-02T08:00:00.000Z', 2],
  ['UTC', '2026-01-02T00:00:00.000Z', 2],
] as const)('uses %s midnight at %s', (zone, instant, day) => {
  expect(
    journeyStateAtInstant({ ...journey, timeZone: toJourneyTimeZone(zone) }, Date.parse(instant)),
  ).toEqual({ status: 'active', currentDay: day });
});

it('retains the fixed Journey date when a traveler sees tomorrow', () => {
  const instant = Date.parse('2026-01-02T03:00:00Z');
  expect(calendarDateAtInstant(instant, toJourneyTimeZone('Asia/Tokyo'))).toBe('2026-01-02');
  expect(journeyStateAtInstant(journey, instant)).toEqual({ status: 'active', currentDay: 1 });
});

it.each([
  [1, 1],
  [7, 1],
  [8, 2],
  [70, 10],
  [71, 11],
  [77, 11],
])('maps Day %s to Week %s', (day, week) => {
  expect(journeyWeekForDay(toJourneyDayNumber(day))).toBe(week);
});
