import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
  ListFunctionsCommand,
  UpdateFunctionConfigurationCommand,
  waitUntilFunctionUpdatedV2,
} from '@aws-sdk/client-lambda';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth';

const expectedEnvironment = 'auth-foundation';
if (process.env.AMPLIFY_DATA_TEST_ENV !== expectedEnvironment) {
  throw new Error(
    `Refusing credentialed verification without AMPLIFY_DATA_TEST_ENV=${expectedEnvironment}.`,
  );
}

const outputs = JSON.parse(
  await readFile(new URL('../amplify_outputs.json', import.meta.url), 'utf8'),
);
const region = outputs.auth?.aws_region;
const userPoolId = outputs.auth?.user_pool_id;
const userPoolClientId = outputs.auth?.user_pool_client_id;
const endpoint = outputs.data?.url;
assert.equal(outputs.data?.default_authorization_type, 'AMAZON_COGNITO_USER_POOLS');
assert.equal(outputs.auth?.unauthenticated_identities_enabled, false);
assert.equal(typeof region, 'string');
assert.equal(typeof userPoolId, 'string');
assert.equal(typeof userPoolClientId, 'string');
assert.match(endpoint, /^https:\/\/[a-z0-9]+\.appsync-api\.[a-z0-9-]+\.amazonaws\.com\/graphql$/);

const cognito = new CognitoIdentityProviderClient({ region });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const lambda = new LambdaClient({ region });
const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const password = `Synthetic-${randomBytes(18).toString('base64url')}!7a`;
const users = [
  { email: `data-a-${suffix}@example.com`, sub: '', token: '' },
  { email: `data-b-${suffix}@example.com`, sub: '', token: '' },
];
const unconfirmedEmail = `data-unconfirmed-${suffix}@example.com`;
const cleanup = [];
const evidence = [];
let restoreTestCatalog;

const syntheticCatalogToken = '77faithful-isolated-authorization-v1';
const syntheticContentVersion = 'synthetic-authorization-fixture';

function record(scenario, expected, actual) {
  evidence.push({ scenario, expected, actual });
}

async function graphQl(token, query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: token } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return { status: response.status, ...body };
}

function assertNoErrors(result) {
  assert.equal(result.status, 200);
  assert.equal(result.errors, undefined, JSON.stringify(result.errors));
}

function assertDenied(result) {
  assert.ok(
    result.status === 401 || result.errors?.length || result.data == null,
    'Expected the operation to be denied or return no data.',
  );
}

async function authenticatedToken(email) {
  Amplify.configure(outputs);
  const result = await signIn({ username: email, password });
  assert.equal(result.isSignedIn, true);
  const current = await getCurrentUser();
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  assert.ok(token);
  await signOut();
  return { sub: current.userId, token };
}

async function findTable(modelName) {
  const response = await dynamo.send(new ListTablesCommand({}));
  const matches = (response.TableNames ?? []).filter((name) => name.startsWith(`${modelName}-`));
  assert.equal(matches.length, 1, `Expected one isolated ${modelName} table.`);
  return matches[0];
}

async function findInvariantFunction() {
  const functions = [];
  let Marker;
  do {
    const response = await lambda.send(new ListFunctionsCommand({ Marker }));
    functions.push(...(response.Functions ?? []));
    Marker = response.NextMarker;
  } while (Marker);
  const matches = functions.filter(({ FunctionName }) =>
    FunctionName?.toLowerCase().includes('faithful77datainvariants'),
  );
  assert.equal(matches.length, 1, 'Expected one isolated Data invariant Lambda.');
  return matches[0].FunctionName;
}

async function configureSyntheticCatalog() {
  const FunctionName = await findInvariantFunction();
  const original = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName }));
  const originalVariables = original.Environment?.Variables ?? {};
  assert.equal(originalVariables.DATA_INVARIANT_TEST_CATALOG, undefined);
  await lambda.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName,
      Environment: {
        Variables: {
          ...originalVariables,
          DATA_INVARIANT_TEST_CATALOG: syntheticCatalogToken,
        },
      },
    }),
  );
  await waitUntilFunctionUpdatedV2({ client: lambda, maxWaitTime: 90 }, { FunctionName });

  return async () => {
    await lambda.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName,
        Environment: { Variables: originalVariables },
      }),
    );
    await waitUntilFunctionUpdatedV2({ client: lambda, maxWaitTime: 90 }, { FunctionName });
    const restored = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName }));
    assert.equal(restored.Environment?.Variables?.DATA_INVARIANT_TEST_CATALOG, undefined);
  };
}

async function pageThrough(token, query, variables) {
  const records = [];
  let nextToken = null;
  do {
    const result = await graphQl(token, query, { ...variables, nextToken });
    assertNoErrors(result);
    const page = result.data[Object.keys(result.data)[0]];
    records.push(...page.items);
    nextToken = page.nextToken;
  } while (nextToken);
  return records;
}

const profileFields = `userId onboardingOverviewCompleted optionalPracticeAId optionalPracticeBId translationId`;
const journeyFields = `journeyId startDate timeZone contentVersion practiceSchedule { effectiveDay optionalPracticeAId optionalPracticeBId }`;
const dailyFields = `id journeyId day practiceCatalogVersion optionalPracticeAId optionalPracticeBId scriptureComplete prayerComplete optionalPracticeAComplete optionalPracticeBComplete reflectionComplete morningIntention reflectionText`;

try {
  const tables = {
    profile: await findTable('UserProfile'),
    journey: await findTable('Journey'),
    daily: await findTable('DailyEntry'),
  };

  for (const user of users) {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.email,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
        ],
      }),
    );
    cleanup.push(() =>
      cognito.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: user.email })),
    );
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: user.email,
        Password: password,
        Permanent: true,
      }),
    );
    Object.assign(user, await authenticatedToken(user.email));
  }

  await cognito.send(
    new SignUpCommand({
      ClientId: userPoolClientId,
      Username: unconfirmedEmail,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: unconfirmedEmail }],
    }),
  );
  cleanup.push(() =>
    cognito.send(
      new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: unconfirmedEmail }),
    ),
  );

  const unauthenticated = await graphQl('', `mutation { ensureUserProfile { ${profileFields} } }`);
  assertDenied(unauthenticated);
  record('Unauthenticated Data access', 'Denied', `Denied (HTTP ${unauthenticated.status})`);

  Amplify.configure(outputs);
  const unconfirmedSignIn = await signIn({ username: unconfirmedEmail, password });
  assert.equal(unconfirmedSignIn.isSignedIn, false);
  assert.equal(unconfirmedSignIn.nextStep.signInStep, 'CONFIRM_SIGN_UP');
  record(
    'Unconfirmed participant sign-in',
    'No authenticated Data path',
    'Cognito required sign-up confirmation and issued no session',
  );

  for (const user of users) {
    const ensured = await graphQl(
      user.token,
      `mutation { ensureUserProfile { ${profileFields} } }`,
    );
    assertNoErrors(ensured);
    assert.equal(ensured.data.ensureUserProfile.userId, user.sub);
    cleanup.push(() =>
      dynamo.send(new DeleteCommand({ TableName: tables.profile, Key: { userId: user.sub } })),
    );
  }
  record(
    'Own profile create/ensure',
    'Allowed and sub-owned',
    'Both users created one own profile',
  );

  const [userA, userB] = users;
  const ownProfile = await graphQl(
    userA.token,
    `query($userId: ID!) { getUserProfile(userId: $userId) { ${profileFields} } }`,
    { userId: userA.sub },
  );
  assertNoErrors(ownProfile);
  assert.equal(ownProfile.data.getUserProfile.userId, userA.sub);
  record('Own profile read', 'Allowed', 'Returned User A profile');

  const profileUpdate = await graphQl(
    userA.token,
    `mutation($input: UpdateUserProfileInput!) { updateUserProfile(input: $input) { ${profileFields} } }`,
    {
      input: {
        userId: userA.sub,
        onboardingOverviewCompleted: true,
        optionalPracticeAId: 'movement',
        optionalPracticeBId: 'gratitude',
        translationId: 'bsb',
      },
    },
  );
  assertNoErrors(profileUpdate);
  assert.equal(profileUpdate.data.updateUserProfile.translationId, 'bsb');
  record('Own profile allowed update', 'Allowed', 'Preferences/onboarding draft updated');

  const crossProfile = await graphQl(
    userB.token,
    `query($userId: ID!) { getUserProfile(userId: $userId) { ${profileFields} } }`,
    { userId: userA.sub },
  );
  assert.equal(crossProfile.data?.getUserProfile ?? null, null);
  record('Cross-user profile read', 'No private fields', 'Returned null');

  const crossProfileUpdate = await graphQl(
    userB.token,
    `mutation($input: UpdateUserProfileInput!) { updateUserProfile(input: $input) { ${profileFields} } }`,
    { input: { userId: userA.sub, translationId: 'kjv' } },
  );
  assertDenied(crossProfileUpdate);
  record('Cross-user profile write', 'Denied', 'Owner resolver denied update');

  const ownerAttack = await graphQl(
    userA.token,
    `mutation($input: UpdateUserProfileInput!) { updateUserProfile(input: $input) { ${profileFields} } }`,
    { input: { userId: userA.sub, owner: userB.sub } },
  );
  assertDenied(ownerAttack);
  record('Profile owner reassignment', 'Denied/unavailable', 'Protected owner input rejected');

  for (const operation of [
    `query { listUserProfiles { items { userId } } }`,
    `mutation($input: CreateUserProfileInput!) { createUserProfile(input: $input) { userId } }`,
    `mutation { deleteUserProfile(input: { userId: "${userA.sub}" }) { userId } }`,
  ]) {
    assertDenied(
      await graphQl(userA.token, operation, {
        input: { userId: userB.sub, onboardingOverviewCompleted: false, owner: userA.sub },
      }),
    );
  }
  record('Generated profile list/create/delete bypass', 'Unavailable', 'GraphQL operations absent');

  const startBlocked = await graphQl(
    userA.token,
    `mutation { startJourney(startDate: "2026-09-08", timeZone: "America/New_York", contentVersion: "v1-draft") { journeyId } }`,
  );
  assertDenied(startBlocked);
  assert.match(JSON.stringify(startBlocked.errors), /CONTENT_VERSION_UNAVAILABLE/);
  record('Journey start without published content', 'Fail closed', 'CONTENT_VERSION_UNAVAILABLE');

  restoreTestCatalog = await configureSyntheticCatalog();

  const startMutation = `mutation($startDate: AWSDate!) {
    startJourney(
      startDate: $startDate
      timeZone: "America/New_York"
      contentVersion: "${syntheticContentVersion}"
    ) { ${journeyFields} }
  }`;
  const concurrentStarts = await Promise.all([
    graphQl(userA.token, startMutation, { startDate: '2026-09-08' }),
    graphQl(userA.token, startMutation, { startDate: '2026-09-08' }),
  ]);
  concurrentStarts.forEach(assertNoErrors);
  const startedJourney = concurrentStarts[0].data.startJourney;
  assert.deepEqual(concurrentStarts[1].data.startJourney, startedJourney);
  cleanup.push(() =>
    dynamo.send(
      new DeleteCommand({
        TableName: tables.journey,
        Key: { journeyId: startedJourney.journeyId },
      }),
    ),
  );
  const persistedStarts = await dynamo.send(
    new ScanCommand({
      TableName: tables.journey,
      FilterExpression: '#owner = :owner',
      ExpressionAttributeNames: { '#owner': 'owner' },
      ExpressionAttributeValues: { ':owner': userA.sub },
      ProjectionExpression: 'journeyId',
    }),
  );
  assert.equal(persistedStarts.Count, 1);
  record(
    'Concurrent Start Journey',
    'One backend record and identical responses',
    'Two simultaneous mutations returned one persisted Journey',
  );

  const exactRetry = await graphQl(userA.token, startMutation, { startDate: '2026-09-08' });
  assertNoErrors(exactRetry);
  assert.deepEqual(exactRetry.data.startJourney, startedJourney);
  record('Exact Start Journey retry', 'Idempotent', 'Returned the existing Journey');

  const conflictingStart = await graphQl(userA.token, startMutation, {
    startDate: '2026-09-09',
  });
  assertDenied(conflictingStart);
  assert.match(JSON.stringify(conflictingStart.errors), /ACTIVE_JOURNEY_EXISTS/);
  record('Second active Journey', 'Rejected', 'ACTIVE_JOURNEY_EXISTS');

  const now = new Date().toISOString();
  const journeys = [
    { id: startedJourney.journeyId, owner: userA.sub },
    { id: `synthetic-b-${suffix}`, owner: userB.sub },
  ];
  for (const journey of journeys.slice(1)) {
    await dynamo.send(
      new PutCommand({
        TableName: tables.journey,
        Item: {
          journeyId: journey.id,
          owner: journey.owner,
          startDate: '2026-09-08',
          timeZone: 'America/New_York',
          contentVersion: 'synthetic-authorization-fixture',
          practiceSchedule: [
            {
              effectiveDay: 1,
              optionalPracticeAId: 'movement',
              optionalPracticeBId: 'gratitude',
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
    cleanup.push(() =>
      dynamo.send(new DeleteCommand({ TableName: tables.journey, Key: { journeyId: journey.id } })),
    );
  }

  const ownJourney = await graphQl(
    userA.token,
    `query($journeyId: ID!) { getJourney(journeyId: $journeyId) { ${journeyFields} } }`,
    { journeyId: journeys[0].id },
  );
  assertNoErrors(ownJourney);
  assert.equal(ownJourney.data.getJourney.journeyId, journeys[0].id);
  record('Own Journey read', 'Allowed', 'Returned synthetic owned Journey');

  const crossJourney = await graphQl(
    userB.token,
    `query($journeyId: ID!) { getJourney(journeyId: $journeyId) { ${journeyFields} } }`,
    { journeyId: journeys[0].id },
  );
  assert.equal(crossJourney.data?.getJourney ?? null, null);
  record('Cross-user Journey read', 'No fields', 'Returned null');

  const listedJourneys = await pageThrough(
    userA.token,
    `query($nextToken: String) { listJourneys(limit: 1, nextToken: $nextToken) { items { journeyId } nextToken } }`,
    {},
  );
  assert.deepEqual(
    listedJourneys.map(({ journeyId }) => journeyId),
    [journeys[0].id],
  );
  record('Journey pagination leakage', 'Only owner records on every page', 'Only User A Journey');

  for (const operation of [
    `mutation { createJourney(input: { journeyId: "attack" }) { journeyId } }`,
    `mutation { updateJourney(input: { journeyId: "${journeys[0].id}", timeZone: "UTC" }) { journeyId } }`,
    `mutation { deleteJourney(input: { journeyId: "${journeys[0].id}" }) { journeyId } }`,
  ]) {
    assertDenied(await graphQl(userA.token, operation));
  }
  record('Generated Journey mutation bypass', 'Unavailable', 'Create/update/delete absent');

  const ensuredDay = await graphQl(
    userA.token,
    `mutation($journeyId: ID!) { ensureDailyEntry(journeyId: $journeyId, day: 1) { ${dailyFields} } }`,
    { journeyId: journeys[0].id },
  );
  assertNoErrors(ensuredDay);
  assert.equal(ensuredDay.data.ensureDailyEntry.owner, undefined);
  const dailyId = ensuredDay.data.ensureDailyEntry.id;
  cleanup.push(() =>
    dynamo.send(new DeleteCommand({ TableName: tables.daily, Key: { id: dailyId } })),
  );
  const retriedDay = await graphQl(
    userA.token,
    `mutation($journeyId: ID!) { ensureDailyEntry(journeyId: $journeyId, day: 1) { id } }`,
    { journeyId: journeys[0].id },
  );
  assertNoErrors(retriedDay);
  assert.equal(retriedDay.data.ensureDailyEntry.id, dailyId);
  record('DailyEntry idempotent ensure', 'One Journey/day identity', 'Retry returned same ID');

  const crossReference = await graphQl(
    userB.token,
    `mutation($journeyId: ID!) { ensureDailyEntry(journeyId: $journeyId, day: 2) { id } }`,
    { journeyId: journeys[0].id },
  );
  assertDenied(crossReference);
  assert.match(JSON.stringify(crossReference.errors), /JOURNEY_NOT_FOUND/);
  record('Cross-owner Journey reference', 'Denied', 'JOURNEY_NOT_FOUND');

  const invalidDay = await graphQl(
    userA.token,
    `mutation($journeyId: ID!) { ensureDailyEntry(journeyId: $journeyId, day: 78) { id } }`,
    { journeyId: journeys[0].id },
  );
  assertDenied(invalidDay);
  record('DailyEntry Day 1–77 boundary', 'Day 78 denied', 'INVALID_DAY');

  const updatedDay = await graphQl(
    userA.token,
    `mutation($input: UpdateDailyEntryInput!) { updateDailyEntry(input: $input) { ${dailyFields} } }`,
    {
      input: {
        id: dailyId,
        scriptureComplete: true,
        reflectionComplete: true,
        morningIntention: 'Synthetic private intention.',
        reflectionText: 'Synthetic private reflection.',
      },
    },
  );
  assertNoErrors(updatedDay);
  assert.equal(updatedDay.data.updateDailyEntry.scriptureComplete, true);
  assert.equal(updatedDay.data.updateDailyEntry.reflectionComplete, true);
  record('Own DailyEntry mutable update', 'Allowed', 'Completion and private text updated');

  const ownDay = await graphQl(
    userA.token,
    `query($id: ID!) { getDailyEntry(id: $id) { ${dailyFields} } }`,
    { id: dailyId },
  );
  assertNoErrors(ownDay);
  assert.equal(ownDay.data.getDailyEntry.id, dailyId);
  record('Own DailyEntry read', 'Allowed', 'Returned owned Journey day');

  const crossPrivateRead = await graphQl(
    userB.token,
    `query($id: ID!) { getDailyEntry(id: $id) { ${dailyFields} } }`,
    { id: dailyId },
  );
  assert.equal(crossPrivateRead.data?.getDailyEntry ?? null, null);
  assert.doesNotMatch(JSON.stringify(crossPrivateRead), /Synthetic private/);
  record('Cross-user private-text read', 'No private fields', 'Returned null without text');

  const crossDayUpdate = await graphQl(
    userB.token,
    `mutation($input: UpdateDailyEntryInput!) { updateDailyEntry(input: $input) { id } }`,
    { input: { id: dailyId, prayerComplete: true } },
  );
  assertDenied(crossDayUpdate);
  record('Cross-user DailyEntry update', 'Denied', 'Owner resolver denied update');

  for (const protectedInput of [
    { owner: userB.sub },
    { journeyId: journeys[1].id },
    { day: 2 },
    { optionalPracticeAId: 'generosity' },
    { optionalPracticeBId: 'worship' },
    { practiceCatalogVersion: 'attack' },
  ]) {
    const attack = await graphQl(
      userA.token,
      `mutation($input: UpdateDailyEntryInput!) { updateDailyEntry(input: $input) { id } }`,
      { input: { id: dailyId, ...protectedInput } },
    );
    assertDenied(attack);
  }
  record(
    'Protected DailyEntry history update',
    'All immutable fields denied/unavailable',
    'Owner/Journey/day/practice/catalog attacks rejected',
  );

  for (const operation of [
    `mutation { createDailyEntry(input: { id: "attack", journeyId: "${journeys[0].id}", day: 1 }) { id } }`,
    `mutation { deleteDailyEntry(input: { id: "${dailyId}" }) { id } }`,
  ]) {
    assertDenied(await graphQl(userA.token, operation));
  }
  record('Generated DailyEntry create/delete bypass', 'Unavailable', 'GraphQL operations absent');

  const listedDays = await pageThrough(
    userA.token,
    `query($journeyId: ID!, $nextToken: String) { listDailyEntriesByJourney(journeyId: $journeyId, limit: 1, nextToken: $nextToken, sortDirection: ASC) { items { id day reflectionText } nextToken } }`,
    { journeyId: journeys[0].id },
  );
  assert.deepEqual(
    listedDays.map(({ id }) => id),
    [dailyId],
  );
  const crossListedDays = await pageThrough(
    userB.token,
    `query($journeyId: ID!, $nextToken: String) { listDailyEntriesByJourney(journeyId: $journeyId, limit: 1, nextToken: $nextToken, sortDirection: ASC) { items { id reflectionText } nextToken } }`,
    { journeyId: journeys[0].id },
  );
  assert.deepEqual(crossListedDays, []);
  record('DailyEntry indexed-list leakage', 'Only owner records', 'User B received zero items');

  console.table(evidence);
  console.log('Deployed authorization and invariant checks passed against the isolated sandbox.');
} finally {
  for (const remove of cleanup.reverse()) {
    try {
      await remove();
    } catch {
      // Continue best-effort cleanup without printing synthetic identifiers or credentials.
    }
  }
  if (restoreTestCatalog) await restoreTestCatalog();
}
