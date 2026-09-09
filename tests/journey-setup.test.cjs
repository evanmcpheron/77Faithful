const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

const createSetupService = () => {
  const documents = new Map();
  let nextId = 0;
  let shouldFailCommit = false;
  const timestamp = { seconds: 100, nanoseconds: 0 };
  const firestore = {
    collection: (parent, ...segments) => ({
      path: [parent.path, ...segments].filter(Boolean).join('/'),
    }),
    doc: (parent, ...segments) => {
      const documentPath = [parent.path, ...segments].filter(Boolean).join('/') || '';
      const resolvedPath = segments.length
        ? documentPath
        : `${documentPath}/${String(++nextId).padStart(20, '0')}`;
      return { path: resolvedPath, id: resolvedPath.split('/').at(-1) };
    },
    serverTimestamp: () => timestamp,
    Timestamp: { now: () => timestamp },
    runTransaction: async (_database, callback) => {
      const writes = [];
      const result = await callback({
        get: async (reference) => ({
          exists: () => documents.has(reference.path),
          data: () => documents.get(reference.path),
        }),
        set: (reference, document) => writes.push([reference.path, document]),
      });
      if (shouldFailCommit) throw new Error('Connection unavailable');
      for (const [documentPath, document] of writes) documents.set(documentPath, document);
      return result;
    },
  };
  const modules = new Map();
  const loadModule = (filename) => {
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const importModule = (specifier) => {
      if (specifier === 'firebase/firestore') return firestore;
      if (specifier === '@77/lib/firebase') return { db: {} };
      if (specifier.startsWith('@77/'))
        return loadModule(path.join(root, 'src', `${specifier.slice(4)}.ts`));
      throw new Error(`Unexpected import: ${specifier}`);
    };
    vm.runInThisContext(`(function(require, exports) { ${source}\n })`, { filename })(
      importModule,
      exports,
    );
    return exports;
  };
  return {
    service: loadModule(path.join(root, 'src/features/journey-setup/journey-setup.service.ts')),
    validation: loadModule(
      path.join(root, 'src/features/journey-setup/journey-setup-validation.ts'),
    ),
    documents,
    failCommit: () => {
      shouldFailCommit = true;
    },
  };
};

const initialInput = {
  userId: 'owner',
  deviceId: '12345678901234567890',
  expectedDraftRevision: null,
  expectedDeviceRevision: null,
  currentStep: 'Review',
  choices: {
    readiness: 'ReadyForReview',
    optionalPracticeIds: ['Movement', 'Gratitude'],
    bibleVersionId: 'Web',
  },
  motivation: 'Spend time with Jesus.',
  morningReminder: { isEnabled: true, localTime: '07:00' },
  eveningReflectionReminder: { isEnabled: false, localTime: '20:00' },
};

const draftPath = 'users/owner/journeySetupDrafts/current';

test('saves and restores all choices, motivation and per-device reminder preferences', async () => {
  const { service } = createSetupService();
  await service.saveJourneySetup(initialInput);
  const snapshot = await service.loadJourneySetup(initialInput.userId, initialInput.deviceId);
  assert.deepEqual(snapshot.draft.choices, initialInput.choices);
  assert.equal(snapshot.draft.currentStep, 'Review');
  assert.equal(snapshot.draft.startingMotivation.text, initialInput.motivation);
  assert.deepEqual(snapshot.devicePreferences.morningReminder, initialInput.morningReminder);
  assert.deepEqual(
    snapshot.devicePreferences.eveningReflectionReminder,
    initialInput.eveningReflectionReminder,
  );
  const otherDevice = await service.loadJourneySetup(initialInput.userId, 'anotherdevice');
  assert.equal(otherDevice.devicePreferences, null);
  assert.deepEqual(otherDevice.draft, snapshot.draft);
  const otherAccount = await service.loadJourneySetup('another-owner', initialInput.deviceId);
  assert.equal(otherAccount.draft, null);
});

test('saving another choice preserves the motivation head and does not add a writing revision', async () => {
  const { service, documents } = createSetupService();
  await service.saveJourneySetup(initialInput);
  const firstDraft = documents.get(draftPath);
  await service.saveJourneySetup({
    ...initialInput,
    expectedDraftRevision: 0,
    expectedDeviceRevision: 0,
    currentStep: 'Practices',
  });
  const nextDraft = documents.get(draftPath);
  assert.deepEqual(nextDraft.startingMotivation, firstDraft.startingMotivation);
  assert.deepEqual(nextDraft.createdAt, firstDraft.createdAt);
  assert.equal(nextDraft.revision, 1);
  assert.equal(documents.size, 3);
});

test('clearing motivation writes a tombstone linked to the previous revision', async () => {
  const { service, documents } = createSetupService();
  await service.saveJourneySetup(initialInput);
  const previousHead = documents.get(draftPath).startingMotivation;
  await service.saveJourneySetup({
    ...initialInput,
    expectedDraftRevision: 0,
    expectedDeviceRevision: 0,
    motivation: '',
  });
  const head = documents.get(draftPath).startingMotivation;
  const revision = documents.get(`${draftPath}/writingRevisions/${head.revisionId}`);
  assert.equal(head.text, null);
  assert.equal(revision.text, null);
  assert.equal(revision.baseRevisionId, previousHead.revisionId);
});

test('stale drafts and stale device preferences reject without overwriting saved decisions', async () => {
  const { service, documents } = createSetupService();
  await service.saveJourneySetup(initialInput);
  const savedDocuments = [...documents];
  await assert.rejects(
    service.saveJourneySetup({ ...initialInput, motivation: 'Stale writing' }),
    service.JourneySetupConflictError,
  );
  await assert.rejects(
    service.saveJourneySetup({ ...initialInput, expectedDraftRevision: 0 }),
    service.JourneySetupConflictError,
  );
  assert.deepEqual([...documents], savedDocuments);
});

test('a failed transaction does not save a partial setup', async () => {
  const { service, documents, failCommit } = createSetupService();
  failCommit();
  await assert.rejects(service.saveJourneySetup(initialInput), /Connection unavailable/);
  assert.equal(documents.size, 0);
});

test('partial setup choices remain incomplete and duplicate practice selections are rejected', () => {
  const { validation } = createSetupService();
  assert.equal(validation.getSetupChoices([], null).readiness, 'Incomplete');
  assert.equal(validation.getSetupChoices(['Movement'], 'Web').readiness, 'Incomplete');
  assert.equal(validation.getSetupChoices(['Movement', 'Gratitude'], null).readiness, 'Incomplete');
  assert.equal(
    validation.getSetupChoices(['Movement', 'Gratitude'], 'Web').readiness,
    'ReadyForReview',
  );
  assert.throws(() => validation.getSetupChoices(['Movement', 'Movement'], 'Web'));
});

test('reminder preferences reject invalid enabled times and retain disabled choices', () => {
  const { validation } = createSetupService();
  assert.throws(() => validation.getReminderPreference(true, '24:00'));
  assert.throws(() => validation.getReminderPreference(true, '07:60'));
  assert.deepEqual(validation.getReminderPreference(false, '20:00'), {
    isEnabled: false,
    localTime: '20:00',
  });
  assert.deepEqual(validation.getReminderPreference(true, '00:00'), {
    isEnabled: true,
    localTime: '00:00',
  });
});

test('a profile without setup documents loads an empty setup and can save its first choices', async () => {
  const { service } = createSetupService();
  assert.deepEqual(await service.loadJourneySetup('owner', initialInput.deviceId), {
    draft: null,
    devicePreferences: null,
  });
  await service.saveJourneySetup({
    ...initialInput,
    currentStep: 'Commitment',
    motivation: '',
    choices: { readiness: 'Incomplete', optionalPracticeIds: [], bibleVersionId: null },
  });
  const snapshot = await service.loadJourneySetup('owner', initialInput.deviceId);
  assert.equal(snapshot.draft.revision, 0);
  assert.equal(snapshot.draft.startingMotivation, null);
  assert.equal(snapshot.devicePreferences.revision, 0);
});

for (const practices of [
  ['Movement', 'Gratitude', 'Worship'],
  ['Movement', 'Gratitude', 'Worship', 'Generosity'],
]) {
  test(`persists and restores all ${practices.length} Chosen Practices`, async () => {
    const { service, validation } = createSetupService();
    const choices = validation.getSetupChoices(practices, 'Web');
    assert.equal(choices.readiness, 'ReadyForReview');
    await service.saveJourneySetup({ ...initialInput, currentStep: 'WeeklyThemes', choices });
    const snapshot = await service.loadJourneySetup('owner', initialInput.deviceId);
    assert.deepEqual(snapshot.draft.choices.optionalPracticeIds, practices);
    assert.equal(snapshot.draft.currentStep, 'WeeklyThemes');
  });
}

test('rejects a fifth Chosen Practice', () => {
  const { validation } = createSetupService();
  assert.throws(() =>
    validation.getSetupChoices(
      ['Movement', 'Gratitude', 'Worship', 'Generosity', 'ChristianReading'],
      'Web',
    ),
  );
});
