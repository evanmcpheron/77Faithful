import { toCalendarDate, toJourneyTimeZone } from './calendar';
import { journeyDayAccess } from './day-access';
import { toJourneyDayNumber } from './invariants';
import { validateOneActiveJourney, type JourneyCalendarRecord } from './lifecycle';
import { dayParticipationStatus, journeyStatistics, toPracticeCompletion } from './participation';
import {
  dailyPracticeSnapshot,
  initialPracticeSchedule,
  toOptionalPracticeSelection,
} from './practices';
import { journeyStateAtInstant } from './progression';

const timeZone = toJourneyTimeZone('America/New_York');
const current: JourneyCalendarRecord = {
  id: 'synthetic-current',
  calendar: { startDate: toCalendarDate('2026-01-01'), timeZone },
};
const historical: JourneyCalendarRecord = {
  id: 'synthetic-history',
  calendar: { startDate: toCalendarDate('2025-01-01'), timeZone },
};
const instant = Date.parse('2026-01-05T05:00:00Z');
const schedule = initialPracticeSchedule(toOptionalPracticeSelection(['movement', 'gratitude']));
function records(length: number, complete: boolean) {
  return Array.from({ length }, (_, index) => ({
    snapshot: dailyPracticeSnapshot(schedule, toJourneyDayNumber(index + 1)),
    completion: toPracticeCompletion({
      scripture: complete,
      prayer: complete,
      optionalPracticeA: complete,
      optionalPracticeB: complete,
      reflection: complete,
    }),
  }));
}

it('allows zero/one active Journey and preserves historical records', () => {
  expect(validateOneActiveJourney([], instant)).toEqual({ valid: true });
  expect(validateOneActiveJourney([historical], instant)).toEqual({ valid: true });
  expect(validateOneActiveJourney([current], instant)).toEqual({ valid: true });
  expect(validateOneActiveJourney([current, historical], instant)).toEqual({ valid: true });
  const beforeStart = Date.parse('2025-12-31T05:00:00Z');
  expect(validateOneActiveJourney([current], beforeStart)).toEqual({ valid: true });
});

it('reports every conflicting active ID instead of selecting a winner', () => {
  const second = {
    id: 'synthetic-second',
    calendar: { ...current.calendar, startDate: toCalendarDate('2026-01-02') },
  };
  expect(validateOneActiveJourney([current, historical, second], instant)).toEqual({
    valid: false,
    reason: 'multipleActiveJourneys',
    journeyIds: ['synthetic-current', 'synthetic-second'],
  });
  expect(validateOneActiveJourney([second, current], instant)).toMatchObject({
    valid: false,
    journeyIds: ['synthetic-second', 'synthetic-current'],
  });
});

it('evaluates each record in its own fixed timezone at the same explicit instant', () => {
  const west = {
    id: 'synthetic-west',
    calendar: {
      startDate: toCalendarDate('2026-01-01'),
      timeZone: toJourneyTimeZone('America/Los_Angeles'),
    },
  };
  expect(validateOneActiveJourney([current, west], Date.parse('2026-03-19T05:00:00Z'))).toEqual({
    valid: true,
  });
});

it.each([false, true])(
  'reaches Day 5 with Days 1–4 completion=%s, preserving editable Day 4',
  (complete) => {
    const history = records(4, complete);
    const before = journeyStateAtInstant(current.calendar, Date.parse('2026-01-04T05:00:00Z'));
    expect(before).toEqual({ status: 'active', currentDay: 4 });
    expect(journeyStatistics(before, history).fullyRecordedDays).toBe(complete ? 4 : 0);
    const tomorrow = journeyStateAtInstant(current.calendar, instant);
    expect(tomorrow).toEqual({ status: 'active', currentDay: 5 });
    expect(journeyDayAccess(tomorrow, toJourneyDayNumber(4))).toEqual({
      relationship: 'historical',
      access: 'content',
    });
    expect(current.calendar.startDate).toBe('2026-01-01');
  },
);

it.each([false, true])(
  'keeps Day 77 active with completion=%s and ends only at midnight',
  (complete) => {
    const history = records(77, complete);
    expect(dayParticipationStatus(history[76].completion)).toBe(
      complete ? 'complete' : 'notStarted',
    );
    const finalDay = journeyStateAtInstant(
      current.calendar,
      Date.parse('2026-03-19T03:59:59.999Z'),
    );
    expect(finalDay).toEqual({ status: 'active', currentDay: 77 });
    expect(journeyStatistics(finalDay, history).fullyRecordedDays).toBe(complete ? 77 : 0);
    const ended = journeyStateAtInstant(current.calendar, Date.parse('2026-03-19T04:00:00.000Z'));
    expect(ended).toEqual({ status: 'ended' });
    expect(ended).not.toHaveProperty('currentDay');
    expect(journeyDayAccess(ended, toJourneyDayNumber(77))).toEqual({
      relationship: 'historical',
      access: 'content',
    });
    expect(current.calendar.startDate).toBe('2026-01-01');
  },
);

it('leaves ended Journeys ended without creating another Journey', () => {
  const journeys = Object.freeze([Object.freeze(current), Object.freeze(historical)]);
  const later = Date.parse('2028-09-08T12:00:00Z');
  expect(validateOneActiveJourney(journeys, later)).toEqual({ valid: true });
  for (const record of journeys)
    expect(journeyStateAtInstant(record.calendar, later)).toEqual({ status: 'ended' });
  expect(journeys.map(({ id }) => id)).toEqual(['synthetic-current', 'synthetic-history']);
});
