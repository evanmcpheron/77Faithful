import {
  JOURNEY_DAY_COUNT,
  toJourneyDayNumber,
  type JourneyDayNumber,
  type JourneyState,
} from './invariants';

// Definitions are the settled V1 catalog in docs/PRODUCT_REQUIREMENTS.md.
const optionalDefinitions = {
  movement: {
    label: 'Movement',
    definition:
      "Intentionally move the body in a manner appropriate to the participant's ability and circumstances. No required duration, distance, calories, performance target, or health/fitness integration.",
  },
  'serve-or-encourage': {
    label: 'Serve or Encourage',
    definition: 'Intentionally serve, help, encourage, or care for another person.',
  },
  'scripture-memorization': {
    label: 'Scripture Memorization',
    definition:
      'Spend intentional time learning or reviewing Scripture. Completion represents faithful practice, not perfect memorization.',
  },
  gratitude: {
    label: 'Gratitude',
    definition:
      'Intentionally recognize or express gratitude to God. A written gratitude entry is not required.',
  },
  'christian-reading': {
    label: 'Christian Reading',
    definition:
      'Spend intentional time reading Christian formation, theology, devotional, or similar material beyond the assigned Bible passage.',
  },
  worship: {
    label: 'Worship',
    definition:
      'Spend intentional time worshiping God through an appropriate expression such as singing, listening, prayerful worship, or another personal practice. No media integration is required.',
  },
  generosity: {
    label: 'Generosity',
    definition:
      'Intentionally practice generosity with time, attention, possessions, or money. Never require financial giving or track giving totals.',
  },
  'family-devotion': {
    label: 'Family Devotion',
    definition:
      'Spend intentional spiritual time with family/household through Scripture, prayer, discussion, worship, or a comparable practice.',
  },
  'personal-fasting-or-discipline': {
    label: 'Personal Fasting or Discipline',
    definition:
      'Intentionally abstain from or limit something for spiritual focus. The app must not prescribe unsafe food restriction, duration, medical behavior, or health-risk behavior.',
  },
  'intentional-witness': {
    label: 'Intentional Witness',
    definition:
      'Intentionally share, discuss, or demonstrate faith in Christ with another person. No quotas, pressure mechanics, ranking, or forced reporting.',
  },
} as const;

export type OptionalPracticeId = keyof typeof optionalDefinitions;
export type RequiredPracticeId = 'scripture' | 'prayer' | 'reflection';
export type PracticeId = RequiredPracticeId | OptionalPracticeId;
export type PracticeDefinition<Id extends PracticeId = PracticeId> = {
  readonly id: Id;
  readonly label: string;
  readonly definition: string;
};
export type OptionalPracticeSelection = readonly [OptionalPracticeId, OptionalPracticeId];

export function isOptionalPracticeId(value: unknown): value is OptionalPracticeId {
  return typeof value === 'string' && Object.hasOwn(optionalDefinitions, value);
}

export const optionalPracticeCatalog: readonly PracticeDefinition<OptionalPracticeId>[] =
  Object.freeze(
    Object.keys(optionalDefinitions)
      .filter(isOptionalPracticeId)
      .map((id) => Object.freeze({ id, ...optionalDefinitions[id] })),
  );

export function toOptionalPracticeSelection(value: unknown): OptionalPracticeSelection {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !isOptionalPracticeId(value[0]) ||
    !isOptionalPracticeId(value[1]) ||
    value[0] === value[1]
  ) {
    throw new RangeError('Select exactly two distinct optional practices from the V1 catalog.');
  }
  return Object.freeze([value[0], value[1]]);
}

export type EffectivePracticeSelection = {
  readonly effectiveDay: JourneyDayNumber;
  readonly selection: OptionalPracticeSelection;
};

declare const practiceSchedule: unique symbol;
export type PracticeSchedule = readonly EffectivePracticeSelection[] & {
  readonly [practiceSchedule]: true;
};

export function createPracticeSchedule(
  entries: readonly { effectiveDay: number; selection: unknown }[],
): PracticeSchedule {
  const sorted = entries
    .map(({ effectiveDay, selection }) =>
      Object.freeze({
        effectiveDay: toJourneyDayNumber(effectiveDay),
        selection: toOptionalPracticeSelection(selection),
      }),
    )
    .sort((left, right) => left.effectiveDay - right.effectiveDay);
  if (sorted[0]?.effectiveDay !== 1)
    throw new RangeError('A practice schedule must start on Day 1.');
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index].effectiveDay === sorted[index - 1].effectiveDay)
      throw new RangeError('Practice effective days must be unique.');
  }
  return Object.freeze(sorted) as PracticeSchedule;
}

export function initialPracticeSchedule(selection: OptionalPracticeSelection): PracticeSchedule {
  return createPracticeSchedule([{ effectiveDay: 1, selection }]);
}

export type PracticeChangeResult =
  | {
      readonly outcome: 'changed';
      readonly effectiveDay: JourneyDayNumber;
      readonly schedule: PracticeSchedule;
    }
  | {
      readonly outcome: 'unchanged';
      readonly reason: 'finalDay' | 'ended';
      readonly schedule: PracticeSchedule;
    };

export function changeOptionalPractices(
  schedule: PracticeSchedule,
  state: JourneyState,
  selection: OptionalPracticeSelection,
): PracticeChangeResult {
  if (state.status === 'ended') return { outcome: 'unchanged', reason: 'ended', schedule };
  if (state.status === 'active' && state.currentDay === JOURNEY_DAY_COUNT)
    return { outcome: 'unchanged', reason: 'finalDay', schedule };
  const effectiveDay = toJourneyDayNumber(state.status === 'notStarted' ? 1 : state.currentDay + 1);
  // A second save today replaces tomorrow's pending selection explicitly.
  const retained =
    state.status === 'notStarted'
      ? []
      : schedule.filter((entry) => entry.effectiveDay !== effectiveDay);
  return {
    outcome: 'changed',
    effectiveDay,
    schedule: createPracticeSchedule([...retained, { effectiveDay, selection }]),
  };
}

const requiredDefinitions = {
  scripture: Object.freeze({
    id: 'scripture',
    label: 'Scripture',
    definition:
      "Engage the assigned passage; reading in the participant's own Bible is valid and may be manually recorded. Reader activity and unavailable text never imply completion.",
  }),
  prayer: Object.freeze({
    id: 'prayer',
    label: 'Prayer',
    definition:
      "The day's prayer prompt, participant prayer, and explicit manual completion. No timer, tracked duration, or required written prayer.",
  }),
  reflection: Object.freeze({
    id: 'reflection',
    label: 'Reflection',
    definition:
      'Intentionally reflect; writing is optional. The participant explicitly saves/marks a written reflection complete or chooses I reflected without writing. Typing/autosave alone never completes the practice.',
  }),
} as const;

export type DailyPracticeSnapshot = {
  readonly day: JourneyDayNumber;
  readonly catalogVersion: 'v1';
  readonly practices: readonly [
    PracticeDefinition<'scripture'>,
    PracticeDefinition<'prayer'>,
    PracticeDefinition<OptionalPracticeId>,
    PracticeDefinition<OptionalPracticeId>,
    PracticeDefinition<'reflection'>,
  ];
};

export function dailyPracticeSnapshot(
  schedule: PracticeSchedule,
  day: JourneyDayNumber,
): DailyPracticeSnapshot {
  let applicable = schedule[0];
  for (const entry of schedule) {
    if (entry.effectiveDay > day) break;
    applicable = entry;
  }
  const [first, second] = applicable.selection;
  // Persist these definitions with the day; historical readers need no current Settings/catalog lookup.
  const practices: DailyPracticeSnapshot['practices'] = Object.freeze([
    requiredDefinitions.scripture,
    requiredDefinitions.prayer,
    Object.freeze({ id: first, ...optionalDefinitions[first] }),
    Object.freeze({ id: second, ...optionalDefinitions[second] }),
    requiredDefinitions.reflection,
  ]);
  return Object.freeze({ day, catalogVersion: 'v1', practices });
}
