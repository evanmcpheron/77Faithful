const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const functionsRequire = createRequire(require.resolve('../functions/package.json'));
const { Timestamp } = functionsRequire('firebase-admin/firestore');
const {
  startJourneyForAccount,
  parseStartJourneyRequest,
} = require('../functions/lib/src/journey/start-journey');
const {
  getJourneyCalendarDate,
  addJourneyCalendarDays,
  getJourneyDayNumber,
  getJourneyEndTime,
} = require('../functions/lib/generated/features/journey/journey-calendar');
const {
  FormationThemeOrder,
} = require('../functions/lib/generated/types/formation/formation-course.types');

const createDatabase = () => {
  const documents = new Map();
  let nextId = 0;
  let transactionAttempts = 0;
  let shouldFail = false;
  class Reference {
    constructor(path, filter = null) {
      this.path = path;
      this.filter = filter;
      this.id = path.split('/').at(-1);
    }
    collection(name) {
      return new Reference(`${this.path}/${name}`);
    }
    doc(id = `generated-${++nextId}`) {
      return new Reference(`${this.path}/${id}`);
    }
    where(field, operator, value) {
      assert.equal(operator, '==');
      return new Reference(this.path, { field, value });
    }
    limit() {
      return this;
    }
  }
  const snapshot = (reference) => ({
    id: reference.id,
    ref: reference,
    exists: documents.has(reference.path),
    data: () => documents.get(reference.path),
  });
  const database = {
    doc: (path) => new Reference(path),
    runTransaction: async (callback) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        transactionAttempts++;
        const reads = new Map();
        const writes = [];
        const transaction = {
          get: async (reference) => {
            assert.equal(writes.length, 0, 'all reads must precede writes');
            if (reference.path.split('/').length % 2 === 0) {
              reads.set(reference.path, documents.get(reference.path));
              return snapshot(reference);
            }
            const docs = [...documents.keys()]
              .filter(
                (path) =>
                  path.startsWith(`${reference.path}/`) &&
                  path.split('/').length === reference.path.split('/').length + 1,
              )
              .filter(
                (path) =>
                  !reference.filter ||
                  reference.filter.field
                    .split('.')
                    .reduce((value, key) => value?.[key], documents.get(path)) ===
                    reference.filter.value,
              )
              .map((path) => snapshot(new Reference(path)));
            return { docs, empty: docs.length === 0, size: docs.length };
          },
          set: (reference, document) => writes.push(() => documents.set(reference.path, document)),
          create: (reference, document) => {
            assert.equal(documents.has(reference.path), false);
            writes.push(() => documents.set(reference.path, document));
          },
          update: (reference, changes) =>
            writes.push(() =>
              documents.set(reference.path, { ...documents.get(reference.path), ...changes }),
            ),
        };
        const result = await callback(transaction);
        if ([...reads].some(([path, document]) => documents.get(path) !== document)) continue;
        if (shouldFail) throw new Error('Connection lost');
        writes.forEach((write) => write());
        return result;
      }
      throw new Error('Transaction contention');
    },
  };
  const now = Timestamp.now();
  documents.set('users/owner', { schemaVersion: 1 });
  documents.set('users/owner/journeySetupDrafts/current', {
    schemaVersion: 1,
    userId: 'owner',
    revision: 4,
    currentStep: 'Review',
    choices: {
      readiness: 'ReadyForReview',
      optionalPracticeIds: ['Movement', 'Gratitude'],
      bibleVersionId: 'Web',
    },
    startingMotivation: null,
    createdAt: now,
    updatedAt: now,
  });
  documents.set('formationConfiguration/current', {
    courseId: 'course',
    courseVersionId: 'v1',
    bibleTextEditionIds: { Web: 'web-edition' },
  });
  documents.set('formationCourses/course/versions/v1', {
    courseId: 'course',
    dayCount: 77,
    weekCount: 11,
    publicationState: { status: 'Published' },
  });
  documents.set('bibleTextEditions/web-edition', {
    bibleVersionId: 'Web',
    editionName: 'Test edition',
    sourceRevision: 'test',
    acknowledgments: ['Test fixture only'],
    releaseState: { status: 'Released' },
  });
  for (let dayNumber = 1; dayNumber <= 77; dayNumber++) {
    const weekNumber = Math.ceil(dayNumber / 7);
    documents.set(`formationCourses/course/versions/v1/days/${dayNumber}`, {
      courseId: 'course',
      courseVersionId: 'v1',
      dayNumber,
      weekNumber,
      themeId: FormationThemeOrder[weekNumber - 1],
      title: 'Test fixture',
      devotional: 'Test fixture',
      prayerPrompt: 'Test fixture',
      writtenPrayer: 'Test fixture',
      reflectionQuestion: 'Test fixture',
      scriptureAssignmentId: `reading-${dayNumber}`,
    });
    documents.set(`scriptureAssignments/reading-${dayNumber}`, {
      displayReference: 'Test reference',
      primaryPassage: { passageId: 'passage' },
      supportingPassage: null,
    });
    documents.set(`bibleTextEditions/web-edition/assignmentTexts/reading-${dayNumber}`, {
      scriptureAssignmentId: `reading-${dayNumber}`,
      bibleVersionId: 'Web',
      bibleTextEditionId: 'web-edition',
      primaryPassage: {
        passageId: 'passage',
        displayReference: 'Test reference',
        paragraphs: [{ runs: [{ text: 'Test fixture, not Scripture' }] }],
      },
      supportingPassage: null,
    });
  }
  for (let weekNumber = 1; weekNumber <= 11; weekNumber++)
    documents.set(`formationCourses/course/versions/v1/weekIntroductions/${weekNumber}`, {
      courseId: 'course',
      courseVersionId: 'v1',
      weekNumber,
      themeId: FormationThemeOrder[weekNumber - 1],
      introduction: 'Test fixture',
    });
  return {
    database,
    documents,
    getTransactionAttempts: () => transactionAttempts,
    failCommit: () => {
      shouldFail = true;
    },
  };
};

const request = (operationId = 'attempt-1') => ({
  operationId,
  setupDraftId: 'current',
  expectedSetupRevision: 4,
  review: {
    observedPhoneTimeZoneId: 'America/New_York',
    reviewedStartDate: getJourneyCalendarDate(new Date(), 'America/New_York'),
  },
});
const journeys = (documents) =>
  [...documents.keys()].filter((path) => /^users\/owner\/journeys\/[^/]+$/.test(path));

test('start creates an active journey and account preference, keeps draft, and returns explicit timestamp JSON', async () => {
  const { database, documents } = createDatabase();
  const result = await startJourneyForAccount('owner', request(), database);
  assert.equal(result.outcome, 'Started');
  assert.equal(result.details.journey.state.status, 'Active');
  assert.equal(result.details.journey.startDate, request().review.reviewedStartDate);
  assert.equal(result.details.journey.timeZoneId, 'America/New_York');
  assert.deepEqual(result.details.journey.initialOptionalPracticeIds, ['Movement', 'Gratitude']);
  assert.equal(
    result.details.day77Date,
    addJourneyCalendarDays(result.details.journey.startDate, 76),
  );
  assert.deepEqual(Object.keys(result.details.journey.createdAt), ['seconds', 'nanoseconds']);
  assert.equal(documents.get('users/owner/preferences/current').bibleVersionId, 'Web');
  assert.equal(documents.has('users/owner/journeySetupDrafts/current'), true);
});

test('same operation recovers its original result even after journey ended and draft changed', async () => {
  const { database, documents } = createDatabase();
  const first = await startJourneyForAccount('owner', request(), database);
  documents.get(journeys(documents)[0]).state = { status: 'EndedEarly' };
  documents.delete('users/owner/journeySetupDrafts/current');
  assert.deepEqual(await startJourneyForAccount('owner', request(), database), first);
  assert.equal(journeys(documents).length, 1);
});

test('competing operation IDs retry a conflicting transaction and return the established journey', async () => {
  const { database, documents, getTransactionAttempts } = createDatabase();
  const [first, second] = await Promise.all([
    startJourneyForAccount('owner', request('one'), database),
    startJourneyForAccount('owner', request('two'), database),
  ]);
  assert.equal(first.outcome, 'Started');
  assert.equal(second.outcome, 'ExistingActiveJourney');
  assert.ok(getTransactionAttempts() > 2);
  assert.equal(first.details.journeyId, second.details.journeyId);
  assert.equal(journeys(documents).length, 1);
});

test('midnight review change returns dates without creating a journey', async () => {
  const { database, documents } = createDatabase();
  const input = request();
  input.review.reviewedStartDate = addJourneyCalendarDays(input.review.reviewedStartDate, -1);
  const result = await startJourneyForAccount('owner', input, database);
  assert.equal(result.outcome, 'ReviewChanged');
  assert.equal(result.review.reviewedStartDate, request().review.reviewedStartDate);
  assert.equal(journeys(documents).length, 0);
});

for (const [name, mutate, reason] of [
  [
    'stale setup',
    (documents) => {
      documents.get('users/owner/journeySetupDrafts/current').revision++;
    },
    'SetupChanged',
  ],
  [
    'missing content',
    (documents) => documents.delete('formationCourses/course/versions/v1/days/77'),
    'ContentUnavailable',
  ],
  [
    'withdrawn translation',
    (documents) => {
      documents.get('bibleTextEditions/web-edition').releaseState.status = 'Withdrawn';
    },
    'ContentUnavailable',
  ],
  [
    'missing reading',
    (documents) => documents.delete('bibleTextEditions/web-edition/assignmentTexts/reading-77'),
    'ContentUnavailable',
  ],
  [
    'duplicate practices',
    (documents) => {
      documents.get('users/owner/journeySetupDrafts/current').choices.optionalPracticeIds = [
        'Movement',
        'Movement',
      ];
    },
    undefined,
  ],
]) {
  test(`${name} preserves setup and creates no journey`, async () => {
    const { database, documents } = createDatabase();
    mutate(documents);
    const before = [...documents];
    await assert.rejects(
      startJourneyForAccount('owner', request(), database),
      (error) => error.code === 'failed-precondition' && error.details?.reason === reason,
    );
    assert.deepEqual([...documents], before);
    assert.equal(journeys(documents).length, 0);
  });
}

test('failed commit writes no journey or operation receipt', async () => {
  const { database, documents, failCommit } = createDatabase();
  const before = [...documents];
  failCommit();
  await assert.rejects(startJourneyForAccount('owner', request(), database), /Connection lost/);
  assert.deepEqual([...documents], before);
});

test('request validation rejects caller-owned identity, malformed paths, dates and zones', () => {
  assert.deepEqual(parseStartJourneyRequest(request()), request());
  for (const input of [
    null,
    { ...request(), userId: 'victim' },
    { ...request(), operationId: '../victim' },
    { ...request(), expectedSetupRevision: -1 },
    {
      ...request(),
      review: { observedPhoneTimeZoneId: 'Invalid/Zone', reviewedStartDate: '2026-09-09' },
    },
    { ...request(), review: { observedPhoneTimeZoneId: 'UTC', reviewedStartDate: '2026-02-30' } },
  ])
    assert.throws(
      () => parseStartJourneyRequest(input),
      (error) => error.code === 'invalid-argument',
    );
});

test('a fixed UTC offset cannot replace the journey’s IANA time zone', () => {
  const input = request();
  input.review.observedPhoneTimeZoneId = '+05:00';
  assert.throws(
    () => parseStartJourneyRequest(input),
    (error) => error.code === 'invalid-argument',
  );
});

test('calendar follows the supplied current zone across midnight, DST and Day 77', () => {
  assert.equal(
    getJourneyCalendarDate(new Date('2026-09-10T02:00:00Z'), 'America/New_York'),
    '2026-09-09',
  );
  assert.equal(getJourneyDayNumber('2026-03-07', '2026-03-09'), 3);
  assert.equal(getJourneyDayNumber('2026-01-01', '2026-03-18'), 77);
  assert.equal(getJourneyDayNumber('2026-01-01', '2026-03-19'), 78);
  assert.equal(
    new Date(getJourneyEndTime('2026-01-01', 'America/New_York')).toISOString(),
    '2026-03-19T04:00:00.000Z',
  );
});

for (const [currentZone, expectedOutcome] of [
  ['America/Los_Angeles', 'ExistingActiveJourney'],
  ['Asia/Tokyo', 'Started'],
]) {
  test(`Day 77 uses the current phone zone in ${currentZone} after travel`, async (context) => {
    const instant = new Date('2026-03-19T06:00:00Z');
    context.mock.method(Date, 'now', () => instant.getTime());
    const { database, documents } = createDatabase();
    const initialRequest = request();
    initialRequest.review.reviewedStartDate = getJourneyCalendarDate(instant, 'America/New_York');
    await startJourneyForAccount('owner', initialRequest, database);
    const existingPath = journeys(documents)[0];
    documents.set(existingPath, {
      ...documents.get(existingPath),
      startDate: '2026-01-01',
      timeZoneId: 'America/New_York',
    });
    const input = request('after-travel');
    input.review = {
      observedPhoneTimeZoneId: currentZone,
      reviewedStartDate: getJourneyCalendarDate(instant, currentZone),
    };
    const result = await startJourneyForAccount('owner', input, database);
    assert.equal(result.outcome, expectedOutcome);
    if (expectedOutcome === 'ExistingActiveJourney') {
      assert.equal(documents.get(existingPath).state.status, 'Active');
      assert.equal(getJourneyDayNumber('2026-01-01', input.review.reviewedStartDate), 77);
    } else {
      assert.equal(documents.get(existingPath).state.status, 'Completed');
      assert.equal(
        documents.get(existingPath).state.completedAt.toMillis(),
        getJourneyEndTime('2026-01-01', currentZone),
      );
    }
    assert.equal(documents.get(existingPath).timeZoneId, 'America/New_York');
  });
}

test('callable requires authenticated, verified email', async () => {
  const { startJourney } = require('../functions/lib/src/index');
  await assert.rejects(
    startJourney.run({ data: request() }),
    (error) => error.code === 'unauthenticated',
  );
  await assert.rejects(
    startJourney.run({ data: request(), auth: { uid: 'owner', token: { email_verified: false } } }),
    (error) => error.code === 'permission-denied',
  );
});

test('starting after an elapsed period reconciles completion at the current phone zone boundary', async () => {
  const { database, documents } = createDatabase();
  const first = await startJourneyForAccount('owner', request(), database);
  const existingPath = journeys(documents)[0];
  const oldStartDate = addJourneyCalendarDays(request().review.reviewedStartDate, -80);
  documents.set(existingPath, { ...documents.get(existingPath), startDate: oldStartDate });
  const next = await startJourneyForAccount('owner', request('next'), database);
  assert.equal(next.outcome, 'Started');
  assert.notEqual(next.details.journeyId, first.details.journeyId);
  assert.equal(documents.get(existingPath).state.status, 'Completed');
  assert.equal(
    documents.get(existingPath).state.completedAt.toMillis(),
    getJourneyEndTime(oldStartDate, 'America/New_York'),
  );
  assert.equal(
    journeys(documents).filter((path) => documents.get(path).state.status === 'Active').length,
    1,
  );
});

test('starting motivation gets a journey revision and retains its source history', async () => {
  const { database, documents } = createDatabase();
  const timestamp = Timestamp.now();
  const revisionId = 'motivation-revision';
  const head = { revisionId, text: 'Spend time with Jesus.', updatedAt: timestamp };
  documents.get('users/owner/journeySetupDrafts/current').startingMotivation = head;
  const sourcePath = `users/owner/journeySetupDrafts/current/writingRevisions/${revisionId}`;
  documents.set(sourcePath, {
    userId: 'owner',
    target: { kind: 'SetupMotivation', setupDraftId: 'current' },
    baseRevisionId: null,
    text: head.text,
    origin: { operationId: revisionId, deviceId: 'device', recordedOnDeviceAt: timestamp },
    savedAt: timestamp,
  });
  const result = await startJourneyForAccount('owner', request(), database);
  const revision = documents.get(
    `users/owner/journeys/${result.details.journeyId}/writingRevisions/${revisionId}`,
  );
  assert.deepEqual(revision.target, {
    kind: 'StartingMotivation',
    journeyId: result.details.journeyId,
  });
  assert.equal(revision.text, head.text);
  assert.equal(documents.has(sourcePath), true);
  assert.equal(result.details.journey.startingMotivation.text, head.text);
});
