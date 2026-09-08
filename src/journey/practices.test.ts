import { toJourneyDayNumber, type JourneyState } from './invariants';
import {
  changeOptionalPractices,
  createPracticeSchedule,
  dailyPracticeSnapshot,
  initialPracticeSchedule,
  optionalPracticeCatalog,
  toOptionalPracticeSelection,
} from './practices';

const initial = toOptionalPracticeSelection(['movement', 'gratitude']);
const changed = toOptionalPracticeSelection(['serve-or-encourage', 'scripture-memorization']);
const later = toOptionalPracticeSelection(['worship', 'family-devotion']);
const active = (day: number): JourneyState => ({
  status: 'active',
  currentDay: toJourneyDayNumber(day),
});

it('encodes only the ten settled V1 identities with stable definitions', () => {
  expect(optionalPracticeCatalog.map(({ id }) => id)).toEqual([
    'movement',
    'serve-or-encourage',
    'scripture-memorization',
    'gratitude',
    'christian-reading',
    'worship',
    'generosity',
    'family-devotion',
    'personal-fasting-or-discipline',
    'intentional-witness',
  ]);
  for (const entry of optionalPracticeCatalog) {
    expect(entry.label.length).toBeGreaterThan(0);
    expect(entry.definition.length).toBeGreaterThan(0);
    expect(
      toOptionalPracticeSelection([entry.id, entry.id === 'movement' ? 'gratitude' : 'movement']),
    ).toHaveLength(2);
  }
});

it.each(
  [
    [],
    ['movement'],
    ['movement', 'gratitude', 'worship'],
    ['movement', 'movement'],
    ['unknown', 'gratitude'],
    ['scripture', 'movement'],
    ['prayer', 'movement'],
    ['reflection', 'movement'],
    ['intention', 'movement'],
    ['toString', 'movement'],
    null,
    undefined,
  ].map((selection) => ({ selection })),
)('rejects invalid optional selections $selection', ({ selection }) => {
  expect(() => toOptionalPracticeSelection(selection)).toThrow(RangeError);
});

it('provides the required three and two selected practices in daily order from Day 1', () => {
  const schedule = initialPracticeSchedule(initial);
  for (let day = 1; day <= 77; day++) {
    const snapshot = dailyPracticeSnapshot(schedule, toJourneyDayNumber(day));
    expect(snapshot.practices.map(({ id }) => id)).toEqual([
      'scripture',
      'prayer',
      'movement',
      'gratitude',
      'reflection',
    ]);
    expect(snapshot.day).toBe(day);
    expect(snapshot.catalogVersion).toBe('v1');
  }
});

it('changes Day 19 onward while preserving every earlier snapshot including unrecorded days', () => {
  const original = initialPracticeSchedule(initial);
  const history = Array.from({ length: 18 }, (_, index) =>
    dailyPracticeSnapshot(original, toJourneyDayNumber(index + 1)),
  );
  const result = changeOptionalPractices(original, active(18), changed);
  expect(result.outcome).toBe('changed');
  if (result.outcome !== 'changed') throw new Error('Expected a valid change.');
  expect(result.effectiveDay).toBe(19);
  for (const snapshot of history)
    expect(dailyPracticeSnapshot(result.schedule, snapshot.day)).toEqual(snapshot);
  for (let day = 19; day <= 77; day++) {
    expect(
      dailyPracticeSnapshot(result.schedule, toJourneyDayNumber(day)).practices.map(({ id }) => id),
    ).toEqual([
      'scripture',
      'prayer',
      'serve-or-encourage',
      'scripture-memorization',
      'reflection',
    ]);
  }
  expect(original).toHaveLength(1);
  expect(history[17].practices[2].label).toBe('Movement');
});

it('resolves multiple changes by effective day independently of input order', () => {
  const schedule = createPracticeSchedule([
    { effectiveDay: 31, selection: later },
    { effectiveDay: 1, selection: initial },
    { effectiveDay: 19, selection: changed },
  ]);
  for (const [day, expected] of [
    [1, initial],
    [18, initial],
    [19, changed],
    [30, changed],
    [31, later],
    [77, later],
  ] as const) {
    expect(
      dailyPracticeSnapshot(schedule, toJourneyDayNumber(day))
        .practices.slice(2, 4)
        .map(({ id }) => id),
    ).toEqual(expected);
  }
});

it('replaces a same-day pending save explicitly without creating an ambiguous schedule', () => {
  const first = changeOptionalPractices(initialPracticeSchedule(initial), active(18), changed);
  const second = changeOptionalPractices(first.schedule, active(18), later);
  expect(second.schedule.map(({ effectiveDay }) => effectiveDay)).toEqual([1, 19]);
  expect(dailyPracticeSnapshot(second.schedule, toJourneyDayNumber(18)).practices[2].id).toBe(
    'movement',
  );
  expect(dailyPracticeSnapshot(second.schedule, toJourneyDayNumber(19)).practices[2].id).toBe(
    'worship',
  );
});

it('replaces the initial selection before start without a pre-Day-1 entry', () => {
  const result = changeOptionalPractices(
    initialPracticeSchedule(initial),
    { status: 'notStarted' },
    changed,
  );
  expect(result).toMatchObject({ outcome: 'changed', effectiveDay: 1 });
  expect(result.schedule).toEqual([{ effectiveDay: 1, selection: changed }]);
});

it.each([
  { state: active(77), reason: 'finalDay' },
  { state: { status: 'ended' } as const, reason: 'ended' },
])('leaves history untouched for $reason', ({ state, reason }) => {
  const schedule = initialPracticeSchedule(initial);
  expect(changeOptionalPractices(schedule, state, changed)).toEqual({
    outcome: 'unchanged',
    reason,
    schedule,
  });
  expect(changeOptionalPractices(schedule, state, changed).schedule).toBe(schedule);
});

it.each(
  [
    [],
    [{ effectiveDay: 2, selection: initial }],
    [{ effectiveDay: 0, selection: initial }],
    [
      { effectiveDay: 1, selection: initial },
      { effectiveDay: 78, selection: changed },
    ],
    [
      { effectiveDay: 1, selection: initial },
      { effectiveDay: 1, selection: changed },
    ],
    [
      { effectiveDay: 1, selection: initial },
      { effectiveDay: 19, selection: changed },
      { effectiveDay: 19, selection: later },
    ],
    [{ effectiveDay: 1, selection: ['movement'] }],
  ].map((entries) => ({ entries })),
)('rejects invalid/ambiguous schedule $entries', ({ entries }) => {
  expect(() => createPracticeSchedule(entries)).toThrow(RangeError);
});

it('copies and freezes the schedule and historical definitions', () => {
  const input = [{ effectiveDay: 1, selection: ['movement', 'gratitude'] }];
  const schedule = createPracticeSchedule(input);
  const snapshot = dailyPracticeSnapshot(schedule, toJourneyDayNumber(1));
  input[0].selection[0] = 'worship';
  input[0].effectiveDay = 2;
  expect(dailyPracticeSnapshot(schedule, toJourneyDayNumber(1))).toEqual(snapshot);
  expect(Object.isFrozen(schedule)).toBe(true);
  expect(Object.isFrozen(schedule[0].selection)).toBe(true);
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(Object.isFrozen(snapshot.practices)).toBe(true);
  expect(snapshot.practices.every(Object.isFrozen)).toBe(true);
  expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
});
