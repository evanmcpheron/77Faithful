import { toCalendarDate, toJourneyTimeZone } from './calendar';
import { toJourneyDayNumber, type JourneyState } from './invariants';
import {
  dayParticipationStatus,
  journeyStatistics,
  recordedPracticeCount,
  toPracticeCompletion,
  type DayParticipation,
} from './participation';
import {
  dailyPracticeSnapshot,
  initialPracticeSchedule,
  toOptionalPracticeSelection,
} from './practices';
import { journeyStateAtInstant } from './progression';

const schedule = initialPracticeSchedule(toOptionalPracticeSelection(['movement', 'gratitude']));
function completion(count: number) {
  return toPracticeCompletion({
    scripture: count > 0,
    prayer: count > 1,
    optionalPracticeA: count > 2,
    optionalPracticeB: count > 3,
    reflection: count > 4,
  });
}
function record(day: number, count: number): DayParticipation {
  return {
    snapshot: dailyPracticeSnapshot(schedule, toJourneyDayNumber(day)),
    completion: completion(count),
  };
}
const active = (day: number): JourneyState => ({
  status: 'active',
  currentDay: toJourneyDayNumber(day),
});

it.each([
  [0, 'notStarted'],
  [1, 'inProgress'],
  [2, 'inProgress'],
  [3, 'inProgress'],
  [4, 'inProgress'],
  [5, 'complete'],
] as const)('derives %s recorded practices as %s', (count, status) => {
  expect(recordedPracticeCount(completion(count))).toBe(count);
  expect(dayParticipationStatus(completion(count))).toBe(status);
});

it('counts every combination of five independent binary states', () => {
  for (let mask = 0; mask < 32; mask++) {
    const flags = toPracticeCompletion({
      scripture: Boolean(mask & 1),
      prayer: Boolean(mask & 2),
      optionalPracticeA: Boolean(mask & 4),
      optionalPracticeB: Boolean(mask & 8),
      reflection: Boolean(mask & 16),
    });
    expect(recordedPracticeCount(flags)).toBe(mask.toString(2).replaceAll('0', '').length);
  }
});

it('excludes intention, reader activity, and reflection writing from completion', () => {
  const data = {
    ...completion(0),
    intention: true,
    readerOpened: true,
    reflectionText: 'Synthetic private test response',
  };
  expect(toPracticeCompletion(data)).toEqual(completion(0));
  expect(recordedPracticeCount(data)).toBe(0);
  expect(dayParticipationStatus(data)).toBe('notStarted');
});

it.each([
  null,
  undefined,
  {},
  [],
  { scripture: false },
  { ...completion(0), prayer: undefined },
  { ...completion(0), prayer: null },
  { ...completion(0), prayer: 0 },
  { ...completion(0), reflection: 'complete' },
])('rejects missing or non-binary completion %j', (input) => {
  expect(() => toPracticeCompletion(input)).toThrow(TypeError);
});

it('requires all five explicitly known false values for zero participation', () => {
  const input = { ...completion(0) };
  const known = toPracticeCompletion(input);
  input.scripture = true;
  expect(recordedPracticeCount(known)).toBe(0);
  expect(Object.isFrozen(known)).toBe(true);
});

it('counts full and partial days while known zero and future days contribute neither', () => {
  const records = [
    record(5, 5),
    record(3, 2),
    record(1, 5),
    record(4, 0),
    record(2, 1),
    record(6, 5),
  ];
  expect(journeyStatistics(active(5), records)).toMatchObject({
    fullyRecordedDays: 2,
    partiallyRecordedDays: 2,
  });
  expect(journeyStatistics(active(1), [record(1, 0)])).toMatchObject({
    fullyRecordedDays: 0,
    partiallyRecordedDays: 0,
  });
  expect(journeyStatistics({ status: 'notStarted' }, [])).toMatchObject({
    fullyRecordedDays: 0,
    partiallyRecordedDays: 0,
  });
});

it('requires complete known elapsed-day input and never converts an incomplete load to zero', () => {
  expect(() => journeyStatistics(active(1), [])).toThrow('Known participation');
  expect(() => journeyStatistics(active(3), [record(1, 5), record(3, 5)])).toThrow(
    'Known participation',
  );
  expect(() => journeyStatistics(active(3), [record(1, 0), record(2, 0), record(4, 0)])).toThrow(
    'Known participation',
  );
  expect(() =>
    journeyStatistics(
      { status: 'ended' },
      Array.from({ length: 76 }, (_, index) => record(index + 1, 0)),
    ),
  ).toThrow('Known participation');
  expect(() =>
    // @ts-expect-error An unreadable completion cannot be supplied as a known record.
    journeyStatistics(active(1), [{ ...record(1, 0), completion: null }]),
  ).toThrow();
});

it('rejects contradictory duplicate records instead of choosing array order', () => {
  expect(() => journeyStatistics(active(1), [record(1, 0), record(1, 5)])).toThrow('unique');
});

it('includes Day 77 when ended, without requiring Day 78', () => {
  const records = Array.from({ length: 77 }, (_, index) => record(index + 1, index === 76 ? 5 : 0));
  expect(journeyStatistics({ status: 'ended' }, records)).toMatchObject({
    fullyRecordedDays: 1,
    partiallyRecordedDays: 0,
  });
  expect(journeyStatistics(active(76), records)).toMatchObject({
    fullyRecordedDays: 0,
    partiallyRecordedDays: 0,
  });
});

it('recomputes historical corrections and reversed completion without changing snapshots', () => {
  const original = [record(1, 4), record(2, 5), record(3, 0)];
  const corrected = [{ ...original[0], completion: completion(5) }, original[1], original[2]];
  const reversed = [corrected[0], { ...original[1], completion: completion(4) }, original[2]];
  expect(journeyStatistics(active(3), original)).toMatchObject({
    fullyRecordedDays: 1,
    partiallyRecordedDays: 1,
  });
  expect(journeyStatistics(active(3), corrected)).toMatchObject({
    fullyRecordedDays: 2,
    partiallyRecordedDays: 0,
  });
  expect(journeyStatistics(active(3), reversed)).toMatchObject({
    fullyRecordedDays: 1,
    partiallyRecordedDays: 1,
  });
  expect(reversed.map(({ snapshot }) => snapshot)).toEqual(
    original.map(({ snapshot }) => snapshot),
  );
});

it.each([
  { counts: [0], expected: 0 },
  { counts: [5], expected: 1 },
  { counts: [5, 5, 0], expected: 2 },
  { counts: [5, 5, 1], expected: 2 },
  { counts: [5, 5, 4], expected: 2 },
  { counts: [5, 5, 5], expected: 3 },
  { counts: [5, 5, 5, 0, 5, 0], expected: 1 },
  { counts: [5, 5, 5, 0, 0], expected: 0 },
  { counts: [5, 5, 5, 0, 5], expected: 1 },
])(
  'derives the current run from $counts as $expected, with grace only for today',
  ({ counts, expected }) => {
    const records = counts.map((count, index) => record(index + 1, count));
    expect(journeyStatistics(active(counts.length), records).completeDayStreak).toBe(expected);
  },
);

it('requires known participation even when an earlier gap or today would stop the streak', () => {
  expect(() => journeyStatistics(active(4), [record(2, 0), record(3, 5), record(4, 0)])).toThrow(
    'Known participation',
  );
  expect(() => journeyStatistics(active(3), [record(1, 5), record(2, 5)])).toThrow(
    'Known participation',
  );
});

it('extends and reverses today explicitly, keeping the run through yesterday', () => {
  const original = [record(1, 5), record(2, 5), record(3, 0)];
  const completed = [...original.slice(0, 2), { ...original[2], completion: completion(5) }];
  const reversed = [...original.slice(0, 2), { ...original[2], completion: completion(4) }];
  expect(journeyStatistics(active(3), original)).toEqual({
    fullyRecordedDays: 2,
    partiallyRecordedDays: 0,
    completeDayStreak: 2,
  });
  expect(journeyStatistics(active(3), completed)).toEqual({
    fullyRecordedDays: 3,
    partiallyRecordedDays: 0,
    completeDayStreak: 3,
  });
  expect(journeyStatistics(active(3), reversed)).toEqual({
    fullyRecordedDays: 2,
    partiallyRecordedDays: 1,
    completeDayStreak: 2,
  });
  expect(completed[2].snapshot).toBe(original[2].snapshot);
  expect(reversed[2].snapshot).toBe(original[2].snapshot);
});

it('recomputes the trailing run after historical completion and reversal', () => {
  const original = [record(1, 5), record(2, 4), record(3, 5), record(4, 0)];
  const corrected = [
    original[0],
    { ...original[1], completion: completion(5) },
    original[2],
    original[3],
  ];
  const reversed = [
    ...corrected.slice(0, 2),
    { ...original[2], completion: completion(4) },
    original[3],
  ];
  expect(journeyStatistics(active(4), original).completeDayStreak).toBe(1);
  expect(journeyStatistics(active(4), corrected).completeDayStreak).toBe(3);
  expect(journeyStatistics(active(4), reversed).completeDayStreak).toBe(0);
  expect(reversed.map(({ snapshot }) => snapshot)).toEqual(
    original.map(({ snapshot }) => snapshot),
  );
});

it('excludes future records from the streak and returns zero before start', () => {
  const records = [record(1, 5), record(2, 0), record(3, 5)];
  expect(journeyStatistics(active(2), records).completeDayStreak).toBe(1);
  expect(journeyStatistics({ status: 'notStarted' }, records)).toEqual({
    fullyRecordedDays: 0,
    partiallyRecordedDays: 0,
    completeDayStreak: 0,
  });
});

it.each([0, 4, 5])('ends Day 77 grace at Journey end with %s recorded practices', (lastCount) => {
  const records = Array.from({ length: 77 }, (_, index) =>
    record(index + 1, index === 76 ? lastCount : 5),
  );
  expect(journeyStatistics(active(77), records).completeDayStreak).toBe(lastCount === 5 ? 77 : 76);
  expect(journeyStatistics({ status: 'ended' }, records).completeDayStreak).toBe(
    lastCount === 5 ? 77 : 0,
  );
  const corrected = [...records.slice(0, 76), { ...records[76], completion: completion(5) }];
  expect(journeyStatistics({ status: 'ended' }, corrected).completeDayStreak).toBe(77);
  const reversed = [...corrected.slice(0, 76), { ...corrected[76], completion: completion(4) }];
  expect(journeyStatistics({ status: 'ended' }, reversed).completeDayStreak).toBe(0);
});

it.each([
  { start: '2026-09-07', before: '2026-09-09T03:59:59.999Z', after: '2026-09-09T04:00:00.000Z' },
  { start: '2026-03-07', before: '2026-03-09T03:59:59.999Z', after: '2026-03-09T04:00:00.000Z' },
  { start: '2026-10-31', before: '2026-11-02T04:59:59.999Z', after: '2026-11-02T05:00:00.000Z' },
])(
  'breaks an unfinished day only at fixed-timezone midnight: $after',
  ({ start, before, after }) => {
    const calendar = {
      startDate: toCalendarDate(start),
      timeZone: toJourneyTimeZone('America/New_York'),
    };
    const records = [record(1, 5), record(2, 4), record(3, 0)];
    const today = journeyStateAtInstant(calendar, Date.parse(before));
    const tomorrow = journeyStateAtInstant(calendar, Date.parse(after));
    expect(today).toEqual({ status: 'active', currentDay: 2 });
    expect(tomorrow).toEqual({ status: 'active', currentDay: 3 });
    expect(journeyStatistics(today, records).completeDayStreak).toBe(1);
    expect(journeyStatistics(tomorrow, records).completeDayStreak).toBe(0);
    expect(calendar.startDate).toBe(start);
  },
);

it('retains a completed Day 77 run after end and never counts post-Journey dates', () => {
  const calendar = {
    startDate: toCalendarDate('2026-01-01'),
    timeZone: toJourneyTimeZone('America/New_York'),
  };
  const records = Array.from({ length: 77 }, (_, index) => record(index + 1, index === 73 ? 0 : 5));
  for (const instant of ['2026-03-19T04:00:00Z', '2026-12-31T12:00:00Z']) {
    const state = journeyStateAtInstant(calendar, Date.parse(instant));
    expect(state).toEqual({ status: 'ended' });
    expect(journeyStatistics(state, records).completeDayStreak).toBe(3);
  }
});
