import { JOURNEY_DAY_COUNT, type JourneyState } from './invariants';
import type { DailyPracticeSnapshot } from './practices';

const completionSlots = [
  'scripture',
  'prayer',
  'optionalPracticeA',
  'optionalPracticeB',
  'reflection',
] as const;
export type PracticeCompletion = Readonly<Record<(typeof completionSlots)[number], boolean>>;
export type RecordedPracticeCount = 0 | 1 | 2 | 3 | 4 | 5;
export type DayParticipationStatus = 'notStarted' | 'inProgress' | 'complete';
export type DayParticipation = {
  readonly snapshot: DailyPracticeSnapshot;
  readonly completion: PracticeCompletion;
};

function isPracticeCompletion(value: unknown): value is PracticeCompletion {
  return (
    typeof value === 'object' &&
    value !== null &&
    completionSlots.every(
      (slot) => Object.hasOwn(value, slot) && typeof Reflect.get(value, slot) === 'boolean',
    )
  );
}

export function toPracticeCompletion(value: unknown): PracticeCompletion {
  if (!isPracticeCompletion(value))
    throw new TypeError('Five explicit practice completion states are required.');
  return Object.freeze({
    scripture: value.scripture,
    prayer: value.prayer,
    optionalPracticeA: value.optionalPracticeA,
    optionalPracticeB: value.optionalPracticeB,
    reflection: value.reflection,
  });
}

export function recordedPracticeCount(completion: PracticeCompletion): RecordedPracticeCount {
  let count = 0;
  for (const slot of completionSlots) {
    if (typeof completion[slot] !== 'boolean')
      throw new TypeError('Unknown practice completion cannot become zero participation.');
    if (completion[slot]) count++;
  }
  return count as RecordedPracticeCount;
}

export function dayParticipationStatus(completion: PracticeCompletion): DayParticipationStatus {
  const count = recordedPracticeCount(completion);
  return count === 0 ? 'notStarted' : count === 5 ? 'complete' : 'inProgress';
}

export type JourneyStatistics = {
  readonly fullyRecordedDays: number;
  readonly partiallyRecordedDays: number;
  readonly completeDayStreak: number;
};

/** Requires known records for every unlocked day, including confirmed no-interaction days. */
export function journeyStatistics(
  state: JourneyState,
  records: readonly DayParticipation[],
): JourneyStatistics {
  const elapsedDayCount =
    state.status === 'ended' ? JOURNEY_DAY_COUNT : state.status === 'active' ? state.currentDay : 0;
  const known = new Map<number, PracticeCompletion>();
  for (const record of records) {
    const day = record.snapshot.day;
    if (known.has(day)) throw new RangeError('Participation days must be unique.');
    known.set(day, record.completion);
  }
  let fullyRecordedDays = 0;
  let partiallyRecordedDays = 0;
  let completeDayStreak = 0;
  for (let day = 1; day <= elapsedDayCount; day++) {
    const completion = known.get(day);
    if (!completion)
      throw new RangeError('Known participation is required for every unlocked Journey day.');
    const count = recordedPracticeCount(completion);
    if (count === 5) {
      fullyRecordedDays++;
      completeDayStreak++;
    } else {
      if (count > 0) partiallyRecordedDays++;
      // Only today's incomplete record has grace; historical dates have already ended.
      if (state.status !== 'active' || day !== state.currentDay) completeDayStreak = 0;
    }
  }
  return { fullyRecordedDays, partiallyRecordedDays, completeDayStreak };
}
