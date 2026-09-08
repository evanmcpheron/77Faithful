import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../../amplify/data/resource';
import {
  DataServiceError,
  type DailyEntryRecord,
  type DailyEntryUpdate,
  type JourneyRecord,
  type ParticipantProfile,
  type ProfileDraftUpdate,
} from '@/data/types';
import { bibleTranslations, type TranslationId } from '@/content/scripture/translations';
import { toCalendarDate, toJourneyTimeZone } from '@/journey/calendar';
import { toJourneyDayNumber } from '@/journey/invariants';
import {
  createPracticeSchedule,
  isOptionalPracticeId,
  toOptionalPracticeSelection,
} from '@/journey/practices';
import { toPracticeCompletion } from '@/journey/participation';

import './amplify';

const dataClient = generateClient<Schema>({ authMode: 'userPool' });
type AmplifyDataClient = typeof dataClient;

function throwForErrors(errors: readonly unknown[] | undefined, missing = false): void {
  if (!errors?.length) {
    if (missing) throw new DataServiceError('notFound');
    return;
  }
  const normalized = JSON.stringify(errors).toLowerCase();
  if (normalized.includes('unauthorized') || normalized.includes('not authorized')) {
    throw new DataServiceError('unauthorized');
  }
  if (
    normalized.includes('conditionalcheckfailed') ||
    normalized.includes('conflict') ||
    normalized.includes('active_journey_exists')
  ) {
    throw new DataServiceError('conflict');
  }
  if (
    normalized.includes('invalid') ||
    normalized.includes('required') ||
    normalized.includes('unavailable')
  ) {
    throw new DataServiceError('invalid');
  }
  throw new DataServiceError('retryable');
}

function translationId(value: unknown): TranslationId | null {
  return typeof value === 'string' && bibleTranslations.some(({ id }) => id === value)
    ? (value as TranslationId)
    : null;
}

function mapProfile(value: unknown): ParticipantProfile {
  if (typeof value !== 'object' || value === null) throw new DataServiceError('invalid');
  const userId = Reflect.get(value, 'userId');
  const overview = Reflect.get(value, 'onboardingOverviewCompleted');
  if (typeof userId !== 'string' || typeof overview !== 'boolean') {
    throw new DataServiceError('invalid');
  }
  const first = Reflect.get(value, 'optionalPracticeAId');
  const second = Reflect.get(value, 'optionalPracticeBId');
  let optionalPractices = null;
  if (first != null || second != null) {
    try {
      optionalPractices = toOptionalPracticeSelection([first, second]);
    } catch {
      throw new DataServiceError('invalid');
    }
  }
  const savedTranslation = Reflect.get(value, 'translationId');
  const mappedTranslation = translationId(savedTranslation);
  if (savedTranslation != null && mappedTranslation === null) throw new DataServiceError('invalid');
  return {
    userId,
    onboardingOverviewCompleted: overview,
    optionalPractices,
    translationId: mappedTranslation,
  };
}

function mapJourney(value: unknown): JourneyRecord {
  if (typeof value !== 'object' || value === null) throw new DataServiceError('invalid');
  const journeyId = Reflect.get(value, 'journeyId');
  const contentVersion = Reflect.get(value, 'contentVersion');
  const schedule = Reflect.get(value, 'practiceSchedule');
  if (
    typeof journeyId !== 'string' ||
    typeof contentVersion !== 'string' ||
    !Array.isArray(schedule)
  ) {
    throw new DataServiceError('invalid');
  }
  try {
    return {
      journeyId,
      startDate: toCalendarDate(Reflect.get(value, 'startDate')),
      timeZone: toJourneyTimeZone(Reflect.get(value, 'timeZone')),
      contentVersion,
      practiceSchedule: createPracticeSchedule(
        schedule.map((entry) => ({
          effectiveDay: Reflect.get(entry, 'effectiveDay'),
          selection: [
            Reflect.get(entry, 'optionalPracticeAId'),
            Reflect.get(entry, 'optionalPracticeBId'),
          ],
        })),
      ),
    };
  } catch {
    throw new DataServiceError('invalid');
  }
}

function mapDailyEntry(value: unknown): DailyEntryRecord {
  if (typeof value !== 'object' || value === null) throw new DataServiceError('invalid');
  const id = Reflect.get(value, 'id');
  const journeyId = Reflect.get(value, 'journeyId');
  const catalogVersion = Reflect.get(value, 'practiceCatalogVersion');
  const first = Reflect.get(value, 'optionalPracticeAId');
  const second = Reflect.get(value, 'optionalPracticeBId');
  if (
    typeof id !== 'string' ||
    typeof journeyId !== 'string' ||
    catalogVersion !== 'v1' ||
    !isOptionalPracticeId(first) ||
    !isOptionalPracticeId(second)
  ) {
    throw new DataServiceError('invalid');
  }
  try {
    return {
      id,
      journeyId,
      day: toJourneyDayNumber(Reflect.get(value, 'day')),
      practiceCatalogVersion: catalogVersion,
      optionalPractices: toOptionalPracticeSelection([first, second]),
      completion: toPracticeCompletion({
        scripture: Reflect.get(value, 'scriptureComplete'),
        prayer: Reflect.get(value, 'prayerComplete'),
        optionalPracticeA: Reflect.get(value, 'optionalPracticeAComplete'),
        optionalPracticeB: Reflect.get(value, 'optionalPracticeBComplete'),
        reflection: Reflect.get(value, 'reflectionComplete'),
      }),
      morningIntention:
        typeof Reflect.get(value, 'morningIntention') === 'string'
          ? Reflect.get(value, 'morningIntention')
          : '',
      reflectionText:
        typeof Reflect.get(value, 'reflectionText') === 'string'
          ? Reflect.get(value, 'reflectionText')
          : '',
    };
  } catch {
    throw new DataServiceError('invalid');
  }
}

export function createDataService(client: AmplifyDataClient) {
  return {
    async ensureProfile() {
      const result = await client.mutations.ensureUserProfile();
      throwForErrors(result.errors, result.data == null);
      return mapProfile(result.data);
    },

    async getProfile(userId: string) {
      const result = await client.models.UserProfile.get({ userId });
      throwForErrors(result.errors, result.data == null);
      return mapProfile(result.data);
    },

    async updateProfile(userId: string, update: ProfileDraftUpdate) {
      const result = await client.models.UserProfile.update({ userId, ...update });
      throwForErrors(result.errors, result.data == null);
      return mapProfile(result.data);
    },

    async listJourneys() {
      const records: JourneyRecord[] = [];
      let nextToken: string | null | undefined;
      do {
        const result = await client.models.Journey.list({ limit: 25, nextToken });
        throwForErrors(result.errors);
        records.push(...result.data.map(mapJourney));
        nextToken = result.nextToken;
      } while (nextToken);
      return records;
    },

    async startJourney(input: { startDate: string; timeZone: string; contentVersion: string }) {
      const result = await client.mutations.startJourney(input);
      throwForErrors(result.errors, result.data == null);
      return mapJourney(result.data);
    },

    async getDailyEntry(journeyId: string, day: number) {
      const journeyDay = toJourneyDayNumber(day);
      const result = await client.models.DailyEntry.listDailyEntriesByJourney(
        { journeyId, day: { eq: journeyDay } },
        { limit: 2 },
      );
      throwForErrors(result.errors, result.data.length === 0);
      if (result.data.length !== 1) throw new DataServiceError('conflict');
      return mapDailyEntry(result.data[0]);
    },

    async listDailyEntries(journeyId: string) {
      const records: DailyEntryRecord[] = [];
      let nextToken: string | null | undefined;
      do {
        const result = await client.models.DailyEntry.listDailyEntriesByJourney(
          { journeyId },
          { sortDirection: 'ASC', limit: 25, nextToken },
        );
        throwForErrors(result.errors);
        records.push(...result.data.map(mapDailyEntry));
        nextToken = result.nextToken;
      } while (nextToken);
      return records;
    },

    async ensureDailyEntry(journeyId: string, day: number) {
      const result = await client.mutations.ensureDailyEntry({ journeyId, day });
      throwForErrors(result.errors, result.data == null);
      return mapDailyEntry(result.data);
    },

    async updateDailyEntry(id: string, update: DailyEntryUpdate) {
      const result = await client.models.DailyEntry.update({
        id,
        ...(update.scripture === undefined ? {} : { scriptureComplete: update.scripture }),
        ...(update.prayer === undefined ? {} : { prayerComplete: update.prayer }),
        ...(update.optionalPracticeA === undefined
          ? {}
          : { optionalPracticeAComplete: update.optionalPracticeA }),
        ...(update.optionalPracticeB === undefined
          ? {}
          : { optionalPracticeBComplete: update.optionalPracticeB }),
        ...(update.reflection === undefined ? {} : { reflectionComplete: update.reflection }),
        ...(update.morningIntention === undefined
          ? {}
          : { morningIntention: update.morningIntention }),
        ...(update.reflectionText === undefined ? {} : { reflectionText: update.reflectionText }),
      });
      throwForErrors(result.errors, result.data == null);
      return mapDailyEntry(result.data);
    },
  };
}

export const dataService = createDataService(dataClient);
