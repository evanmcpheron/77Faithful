import { createHash } from 'node:crypto';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  type NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';

import { readingPlans } from '../../src/content/scripture/reading-plans';
import { getAvailableTranslations } from '../../src/services/scripture';
import { toCalendarDate, toJourneyTimeZone } from '../../src/journey/calendar';
import {
  createPracticeSchedule,
  dailyPracticeSnapshot,
  toOptionalPracticeSelection,
  type OptionalPracticeId,
} from '../../src/journey/practices';
import { toJourneyDayNumber } from '../../src/journey/invariants';

type DataTables = {
  userProfile: string;
  journey: string;
  dailyEntry: string;
};

type AppSyncIdentity = {
  sub?: unknown;
  claims?: Record<string, unknown>;
};

type InvariantEvent = {
  arguments: Record<string, unknown>;
  fieldName: string;
  identity?: AppSyncIdentity | null;
};

type DataClient = {
  send(command: GetCommand | PutCommand): Promise<{ Item?: Record<string, NativeAttributeValue> }>;
};

type ContentCatalog = {
  isPublishedVersion(contentVersion: string): boolean;
  isAvailableTranslation(contentVersion: string, translationId: string): boolean;
};

function failure(code: string): never {
  throw new Error(code);
}

function callerSub(event: InvariantEvent): string {
  const sub = event.identity?.sub;
  if (typeof sub !== 'string' || sub.length === 0) failure('DATA_UNAUTHORIZED');
  const verified = event.identity?.claims?.email_verified;
  if (verified !== true && verified !== 'true') failure('EMAIL_VERIFICATION_REQUIRED');
  return sub;
}

function requiredString(value: unknown, code: string): string {
  if (typeof value !== 'string' || value.length === 0) failure(code);
  return value;
}

function deterministicId(namespace: string, ...values: (string | number)[]): string {
  const digest = createHash('sha256')
    .update([namespace, ...values].join('\0'))
    .digest('hex');
  return `${namespace}_${digest}`;
}

export function journeyIdForParticipant(sub: string): string {
  return deterministicId('journey_v1', sub);
}

export function dailyEntryId(journeyId: string, day: number): string {
  return deterministicId('daily_entry', journeyId, day);
}

function isConditionalFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    Reflect.get(error, 'name') === 'ConditionalCheckFailedException'
  );
}

async function getItem(
  client: DataClient,
  tableName: string,
  key: Record<string, NativeAttributeValue>,
) {
  return (await client.send(new GetCommand({ TableName: tableName, Key: key }))).Item;
}

async function putOnce(
  client: DataClient,
  tableName: string,
  item: Record<string, NativeAttributeValue>,
  keyName: string,
): Promise<boolean> {
  try {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(#key)',
        ExpressionAttributeNames: { '#key': keyName },
      }),
    );
    return true;
  } catch (error) {
    if (isConditionalFailure(error)) return false;
    throw error;
  }
}

function publicProfile(item: Record<string, NativeAttributeValue>) {
  return item;
}

async function ensureUserProfile(client: DataClient, tables: DataTables, sub: string, now: string) {
  const existing = await getItem(client, tables.userProfile, { userId: sub });
  if (existing) {
    if (existing.owner !== sub) failure('DATA_CONFLICT');
    return publicProfile(existing);
  }

  const profile = {
    userId: sub,
    owner: sub,
    onboardingOverviewCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  if (await putOnce(client, tables.userProfile, profile, 'userId')) return profile;

  const raced = await getItem(client, tables.userProfile, { userId: sub });
  if (!raced || raced.owner !== sub) failure('DATA_CONFLICT');
  return publicProfile(raced);
}

function practicePair(profile: Record<string, NativeAttributeValue>) {
  try {
    return toOptionalPracticeSelection([profile.optionalPracticeAId, profile.optionalPracticeBId]);
  } catch {
    failure('INVALID_PRACTICE_SELECTION');
  }
}

async function startJourney(
  client: DataClient,
  tables: DataTables,
  catalog: ContentCatalog,
  event: InvariantEvent,
  sub: string,
  now: string,
) {
  const startDate = requiredString(event.arguments.startDate, 'INVALID_START_DATE');
  const timeZone = requiredString(event.arguments.timeZone, 'INVALID_TIME_ZONE');
  const contentVersion = requiredString(event.arguments.contentVersion, 'INVALID_CONTENT_VERSION');
  try {
    toCalendarDate(startDate);
  } catch {
    failure('INVALID_START_DATE');
  }
  try {
    toJourneyTimeZone(timeZone);
  } catch {
    failure('INVALID_TIME_ZONE');
  }
  if (!catalog.isPublishedVersion(contentVersion)) failure('CONTENT_VERSION_UNAVAILABLE');

  const profile = await getItem(client, tables.userProfile, { userId: sub });
  if (!profile || profile.owner !== sub) failure('PROFILE_REQUIRED');
  if (profile.onboardingOverviewCompleted !== true) failure('ONBOARDING_INCOMPLETE');
  const selection = practicePair(profile);
  const translationId = requiredString(profile.translationId, 'TRANSLATION_REQUIRED');
  if (!catalog.isAvailableTranslation(contentVersion, translationId)) {
    failure('TRANSLATION_UNAVAILABLE');
  }

  const journeyId = journeyIdForParticipant(sub);
  const journey = {
    journeyId,
    owner: sub,
    startDate,
    timeZone,
    contentVersion,
    practiceSchedule: [
      { effectiveDay: 1, optionalPracticeAId: selection[0], optionalPracticeBId: selection[1] },
    ],
    createdAt: now,
    updatedAt: now,
  };
  if (await putOnce(client, tables.journey, journey, 'journeyId')) return journey;

  const existing = await getItem(client, tables.journey, { journeyId });
  if (!existing || existing.owner !== sub) failure('DATA_CONFLICT');
  if (
    existing.startDate !== startDate ||
    existing.timeZone !== timeZone ||
    existing.contentVersion !== contentVersion
  ) {
    failure('ACTIVE_JOURNEY_EXISTS');
  }
  return existing;
}

function scheduleFromJourney(item: Record<string, NativeAttributeValue>) {
  if (!Array.isArray(item.practiceSchedule)) failure('INVALID_PRACTICE_SCHEDULE');
  try {
    return createPracticeSchedule(
      item.practiceSchedule.map((entry) => {
        if (typeof entry !== 'object' || entry === null) failure('INVALID_PRACTICE_SCHEDULE');
        return {
          effectiveDay: Reflect.get(entry, 'effectiveDay'),
          selection: [
            Reflect.get(entry, 'optionalPracticeAId'),
            Reflect.get(entry, 'optionalPracticeBId'),
          ],
        };
      }),
    );
  } catch {
    failure('INVALID_PRACTICE_SCHEDULE');
  }
}

async function ensureDailyEntry(
  client: DataClient,
  tables: DataTables,
  event: InvariantEvent,
  sub: string,
  now: string,
) {
  const journeyId = requiredString(event.arguments.journeyId, 'INVALID_JOURNEY');
  let day;
  try {
    day = toJourneyDayNumber(event.arguments.day);
  } catch {
    failure('INVALID_DAY');
  }

  const journey = await getItem(client, tables.journey, { journeyId });
  if (!journey || journey.owner !== sub) failure('JOURNEY_NOT_FOUND');
  const snapshot = dailyPracticeSnapshot(scheduleFromJourney(journey), day);
  const optionalPractices = snapshot.practices.filter(
    (practice) =>
      practice.id !== 'scripture' && practice.id !== 'prayer' && practice.id !== 'reflection',
  );
  if (optionalPractices.length !== 2) failure('INVALID_PRACTICE_SCHEDULE');

  const id = dailyEntryId(journeyId, day);
  const entry = {
    id,
    journeyId,
    day,
    practiceCatalogVersion: snapshot.catalogVersion,
    optionalPracticeAId: optionalPractices[0].id as OptionalPracticeId,
    optionalPracticeBId: optionalPractices[1].id as OptionalPracticeId,
    scriptureComplete: false,
    prayerComplete: false,
    optionalPracticeAComplete: false,
    optionalPracticeBComplete: false,
    reflectionComplete: false,
    owner: sub,
    createdAt: now,
    updatedAt: now,
  };
  if (await putOnce(client, tables.dailyEntry, entry, 'id')) return entry;

  const existing = await getItem(client, tables.dailyEntry, { id });
  if (!existing || existing.owner !== sub || existing.journeyId !== journeyId) {
    failure('DATA_CONFLICT');
  }
  return existing;
}

export function createInvariantHandler(
  client: DataClient,
  tables: DataTables,
  catalog: ContentCatalog,
  now: () => string = () => new Date().toISOString(),
) {
  return async (event: InvariantEvent): Promise<Record<string, NativeAttributeValue>> => {
    const sub = callerSub(event);
    switch (event.fieldName) {
      case 'ensureUserProfile':
        return ensureUserProfile(client, tables, sub, now());
      case 'startJourney':
        return startJourney(client, tables, catalog, event, sub, now());
      case 'ensureDailyEntry':
        return ensureDailyEntry(client, tables, event, sub, now());
      default:
        return failure('UNSUPPORTED_OPERATION');
    }
  };
}

function environment(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

const productionCatalog: ContentCatalog = {
  isPublishedVersion: (contentVersion) =>
    readingPlans.some(
      (plan) =>
        plan.version === contentVersion &&
        plan.publication.status === 'published' &&
        plan.days.length === 77,
    ),
  isAvailableTranslation: (contentVersion, translationId) =>
    getAvailableTranslations(contentVersion).some(({ id }) => id === translationId),
};

export const SYNTHETIC_CATALOG_TOKEN = '77faithful-isolated-authorization-v1';
export const SYNTHETIC_CONTENT_VERSION = 'synthetic-authorization-fixture';

export function catalogForEnvironment(testCatalogToken: string | undefined): ContentCatalog {
  if (testCatalogToken !== SYNTHETIC_CATALOG_TOKEN) return productionCatalog;

  return {
    isPublishedVersion: (contentVersion) =>
      contentVersion === SYNTHETIC_CONTENT_VERSION ||
      productionCatalog.isPublishedVersion(contentVersion),
    isAvailableTranslation: (contentVersion, translationId) =>
      (contentVersion === SYNTHETIC_CONTENT_VERSION && translationId === 'bsb') ||
      productionCatalog.isAvailableTranslation(contentVersion, translationId),
  };
}

let productionHandler: ReturnType<typeof createInvariantHandler> | undefined;

export const handler = (event: InvariantEvent) => {
  productionHandler ??= createInvariantHandler(
    DynamoDBDocumentClient.from(new DynamoDBClient({})),
    {
      userProfile: environment(process.env.USER_PROFILE_TABLE_NAME, 'USER_PROFILE_TABLE_NAME'),
      journey: environment(process.env.JOURNEY_TABLE_NAME, 'JOURNEY_TABLE_NAME'),
      dailyEntry: environment(process.env.DAILY_ENTRY_TABLE_NAME, 'DAILY_ENTRY_TABLE_NAME'),
    },
    catalogForEnvironment(process.env.DATA_INVARIANT_TEST_CATALOG),
  );
  return productionHandler(event);
};
