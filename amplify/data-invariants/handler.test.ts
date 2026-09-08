import assert from 'node:assert/strict';
import test from 'node:test';

import { GetCommand, type PutCommand } from '@aws-sdk/lib-dynamodb';

import {
  catalogForEnvironment,
  createInvariantHandler,
  dailyEntryId,
  journeyIdForParticipant,
  SYNTHETIC_CATALOG_TOKEN,
  SYNTHETIC_CONTENT_VERSION,
} from './handler';

const tables = { userProfile: 'profiles', journey: 'journeys', dailyEntry: 'days' };
const now = () => '2026-09-08T12:00:00.000Z';
const verifiedIdentity = (sub = 'synthetic-user-a') => ({
  sub,
  claims: { email_verified: 'true' },
});

class MemoryDataClient {
  readonly tables = new Map<string, Map<string, Record<string, unknown>>>();

  table(name: string) {
    let table = this.tables.get(name);
    if (!table) {
      table = new Map();
      this.tables.set(name, table);
    }
    return table;
  }

  async send(command: GetCommand | PutCommand) {
    if (command instanceof GetCommand) {
      const input = command.input;
      const table = this.table(input.TableName as string);
      const key = Object.values(input.Key ?? {})[0] as string;
      return { Item: table.get(key) };
    }
    const input = command.input;
    const table = this.table(input.TableName as string);
    const item = input.Item as Record<string, unknown>;
    const keyName = Object.values(input.ExpressionAttributeNames ?? {})[0] as string;
    const key = item[keyName] as string;
    if (input.ConditionExpression && table.has(key)) {
      throw Object.assign(new Error('conditional'), {
        name: 'ConditionalCheckFailedException',
      });
    }
    table.set(key, structuredClone(item));
    return {};
  }
}

function event(fieldName: string, args: Record<string, unknown> = {}, sub = 'synthetic-user-a') {
  return { arguments: args, fieldName, identity: verifiedIdentity(sub) };
}

function fixture() {
  const client = new MemoryDataClient();
  const catalog = {
    isPublishedVersion: (version: string) => version === 'synthetic-published-v1',
    isAvailableTranslation: (version: string, translation: string) =>
      version === 'synthetic-published-v1' && translation === 'bsb',
  };
  return { client, handler: createInvariantHandler(client, tables, catalog, now) };
}

async function readyProfile(client: MemoryDataClient, sub = 'synthetic-user-a') {
  client.table(tables.userProfile).set(sub, {
    userId: sub,
    owner: sub,
    onboardingOverviewCompleted: true,
    optionalPracticeAId: 'movement',
    optionalPracticeBId: 'gratitude',
    translationId: 'bsb',
  });
}

const startArguments = {
  startDate: '2026-09-08',
  timeZone: 'America/New_York',
  contentVersion: 'synthetic-published-v1',
};

test('keeps the synthetic catalog behind the exact operator-controlled test token', () => {
  assert.equal(
    catalogForEnvironment(undefined).isPublishedVersion(SYNTHETIC_CONTENT_VERSION),
    false,
  );
  assert.equal(
    catalogForEnvironment('wrong-environment').isPublishedVersion(SYNTHETIC_CONTENT_VERSION),
    false,
  );
  const testCatalog = catalogForEnvironment(SYNTHETIC_CATALOG_TOKEN);
  assert.equal(testCatalog.isPublishedVersion(SYNTHETIC_CONTENT_VERSION), true);
  assert.equal(testCatalog.isAvailableTranslation(SYNTHETIC_CONTENT_VERSION, 'bsb'), true);
  assert.equal(testCatalog.isAvailableTranslation(SYNTHETIC_CONTENT_VERSION, 'kjv'), false);
});

test('requires verified Cognito identity for every trusted mutation', async () => {
  const { handler } = fixture();
  await assert.rejects(
    handler({
      arguments: {},
      fieldName: 'ensureUserProfile',
      identity: { sub: 'synthetic-user-a', claims: { email_verified: 'false' } },
    }),
    /EMAIL_VERIFICATION_REQUIRED/,
  );
});

test('ensures exactly one profile under concurrent retries', async () => {
  const { client, handler } = fixture();
  const [first, second] = await Promise.all([
    handler(event('ensureUserProfile')),
    handler(event('ensureUserProfile')),
  ]);
  assert.equal(first.userId, 'synthetic-user-a');
  assert.deepEqual(first, second);
  assert.equal(client.table(tables.userProfile).size, 1);
});

test('starts one Journey and returns it for an exact retry', async () => {
  const { client, handler } = fixture();
  await readyProfile(client);
  const first = await handler(event('startJourney', startArguments));
  const retry = await handler(event('startJourney', startArguments));
  assert.deepEqual(retry, first);
  assert.equal(first.journeyId, journeyIdForParticipant('synthetic-user-a'));
  assert.equal(client.table(tables.journey).size, 1);
});

test('concurrent Journey starts persist one logical Journey', async () => {
  const { client, handler } = fixture();
  await readyProfile(client);
  const results = await Promise.all([
    handler(event('startJourney', startArguments)),
    handler(event('startJourney', startArguments)),
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(client.table(tables.journey).size, 1);
});

test('rejects conflicting Journey retry and invalid creation inputs', async () => {
  const { client, handler } = fixture();
  await readyProfile(client);
  await handler(event('startJourney', startArguments));
  await assert.rejects(
    handler(event('startJourney', { ...startArguments, startDate: '2026-09-09' })),
    /ACTIVE_JOURNEY_EXISTS/,
  );
  await assert.rejects(
    handler(event('startJourney', { ...startArguments, timeZone: 'Not\/AZone' }, 'user-b')),
    /INVALID_TIME_ZONE/,
  );
  await assert.rejects(
    handler(
      event('startJourney', { ...startArguments, contentVersion: 'not-published' }, 'user-b'),
    ),
    /CONTENT_VERSION_UNAVAILABLE/,
  );
});

test('rejects duplicate and malformed optional-practice selections', async () => {
  const { client, handler } = fixture();
  await readyProfile(client);
  client.table(tables.userProfile).get('synthetic-user-a')!.optionalPracticeBId = 'movement';
  await assert.rejects(
    handler(event('startJourney', startArguments)),
    /INVALID_PRACTICE_SELECTION/,
  );
});

test('ensures one DailyEntry with the applicable immutable practice snapshot', async () => {
  const { client, handler } = fixture();
  const journeyId = journeyIdForParticipant('synthetic-user-a');
  client.table(tables.journey).set(journeyId, {
    journeyId,
    owner: 'synthetic-user-a',
    practiceSchedule: [
      { effectiveDay: 1, optionalPracticeAId: 'movement', optionalPracticeBId: 'gratitude' },
      { effectiveDay: 2, optionalPracticeAId: 'worship', optionalPracticeBId: 'generosity' },
    ],
  });
  const args = { journeyId, day: 2 };
  const first = await handler(event('ensureDailyEntry', args));
  const retry = await handler(event('ensureDailyEntry', args));
  assert.deepEqual(retry, first);
  assert.equal(first.id, dailyEntryId(journeyId, 2));
  assert.equal(first.optionalPracticeAId, 'worship');
  assert.equal(first.optionalPracticeBId, 'generosity');
  assert.equal(client.table(tables.dailyEntry).size, 1);
});

test('rejects invalid days and cross-owner Journey references', async () => {
  const { client, handler } = fixture();
  const journeyId = journeyIdForParticipant('synthetic-user-a');
  client.table(tables.journey).set(journeyId, {
    journeyId,
    owner: 'synthetic-user-a',
    practiceSchedule: [
      { effectiveDay: 1, optionalPracticeAId: 'movement', optionalPracticeBId: 'gratitude' },
    ],
  });
  await assert.rejects(handler(event('ensureDailyEntry', { journeyId, day: 0 })), /INVALID_DAY/);
  await assert.rejects(handler(event('ensureDailyEntry', { journeyId, day: 78 })), /INVALID_DAY/);
  await assert.rejects(
    handler(event('ensureDailyEntry', { journeyId, day: 1 }, 'synthetic-user-b')),
    /JOURNEY_NOT_FOUND/,
  );
});
