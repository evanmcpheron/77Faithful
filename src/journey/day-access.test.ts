import { dayTargetDecision, journeyDayAccess, type DayTarget } from './day-access';
import { toJourneyDayNumber, type JourneyState } from './invariants';

it.each([
  [1, 1, 'current', 'content'],
  [18, 17, 'historical', 'content'],
  [18, 18, 'current', 'content'],
  [18, 19, 'futureLocked', 'metadataOnly'],
  [77, 77, 'current', 'content'],
] as const)(
  'classifies active day %s requested %s as %s',
  (current, requested, relationship, access) => {
    expect(
      journeyDayAccess(
        { status: 'active', currentDay: toJourneyDayNumber(current) },
        toJourneyDayNumber(requested),
      ),
    ).toEqual({ relationship, access });
  },
);

it.each([1, 76, 77])('keeps ended Day %s historical and accessible for every target', (day) => {
  expect(journeyDayAccess({ status: 'ended' }, toJourneyDayNumber(day))).toEqual({
    relationship: 'historical',
    access: 'content',
  });
  for (const target of ['detail', 'scripture', 'reflection'] as const) {
    expect(dayTargetDecision({ status: 'ended' }, toJourneyDayNumber(day), target)).toEqual({
      decision: 'render',
      relationship: 'historical',
    });
  }
});

it('makes every pre-start day unavailable', () => {
  for (let day = 1; day <= 77; day++) {
    expect(journeyDayAccess({ status: 'notStarted' }, toJourneyDayNumber(day))).toEqual({
      relationship: 'unavailable',
      access: 'none',
    });
  }
});

it.each([1, 77])('canonicalizes only the current Day %s detail index', (day) => {
  const currentDay = toJourneyDayNumber(day);
  const state: JourneyState = { status: 'active', currentDay };
  expect(dayTargetDecision(state, currentDay, 'detail')).toEqual({ decision: 'canonicalToday' });
  for (const target of ['scripture', 'reflection'] as const) {
    expect(dayTargetDecision(state, currentDay, target)).toEqual({
      decision: 'render',
      relationship: 'current',
    });
  }
});

it.each<DayTarget>(['detail', 'scripture', 'reflection'])(
  'denies future/pre-start %s but allows history',
  (target) => {
    const state: JourneyState = { status: 'active', currentDay: toJourneyDayNumber(18) };
    expect(dayTargetDecision(state, toJourneyDayNumber(19), target)).toEqual({
      decision: 'denied',
      reason: 'futureLocked',
    });
    expect(dayTargetDecision({ status: 'notStarted' }, toJourneyDayNumber(1), target)).toEqual({
      decision: 'denied',
      reason: 'unavailable',
    });
    expect(dayTargetDecision(state, toJourneyDayNumber(17), target)).toEqual({
      decision: 'render',
      relationship: 'historical',
    });
  },
);
