const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const createJourneyAccess = () => {
  const states = [];
  const subscriptions = [];
  let stateIndex = 0;
  let dependencies;
  let cleanup;
  const react = {
    useState: (initialState) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initialState;
      return [
        states[index],
        (nextState) => {
          states[index] = typeof nextState === 'function' ? nextState(states[index]) : nextState;
        },
      ];
    },
    useEffect: (effect, nextDependencies) => {
      if (
        dependencies &&
        nextDependencies.every((dependency, index) => dependency === dependencies[index])
      )
        return;
      cleanup?.();
      dependencies = nextDependencies;
      cleanup = effect();
    },
  };
  const firestore = {
    collection: (_db, ...segments) => segments.join('/'),
    where: (...filter) => filter,
    limit: (count) => count,
    query: (...constraints) => constraints,
    onSnapshot: (query, options, onNext, onError) => {
      const subscription = { query, options, onNext, onError, isClosed: false };
      subscriptions.push(subscription);
      return () => {
        subscription.isClosed = true;
      };
    },
  };
  const filename = 'src/features/navigation/use-journey-access.hook.ts';
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const hookModule = {
    exports: {},
    console: { error: () => {} },
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'firebase/firestore') return firestore;
      if (name === '@77/lib/firebase') return { db: {} };
      if (name === '@77/types/journey/journey.types')
        return {
          JourneyStatus: { Active: 'Active', Completed: 'Completed', EndedEarly: 'EndedEarly' },
        };
      throw new Error(`Unexpected module: ${name}`);
    },
  };
  vm.runInNewContext(source, hookModule, { filename });
  return {
    subscriptions,
    render: (userId) => {
      stateIndex = 0;
      return hookModule.exports.useJourneyAccess(userId);
    },
  };
};

const snapshot = (empty, fromCache = false) => ({ empty, metadata: { fromCache } });

test('waits for authoritative absence and updates when a journey is committed', () => {
  const { render, subscriptions } = createJourneyAccess();
  assert.equal(render('owner').isLoading, true);
  const subscription = subscriptions[0];
  assert.equal(subscription.query[0], 'users/owner/journeys');
  assert.deepEqual(Array.from(subscription.query[1][2]), ['Active', 'Completed', 'EndedEarly']);
  subscription.onNext(snapshot(true, true));
  assert.equal(render('owner').isLoading, true);
  subscription.onNext(snapshot(true));
  assert.equal(render('owner').isLoading, false);
  assert.equal(render('owner').hasJourney, false);
  subscription.onNext(snapshot(false));
  assert.equal(render('owner').hasJourney, true);
});

test('isolates accounts and unsubscribes when signing out or switching accounts', () => {
  const { render, subscriptions } = createJourneyAccess();
  render('owner');
  subscriptions[0].onNext(snapshot(false));
  assert.equal(render('owner').hasJourney, true);
  assert.equal(render('other').isLoading, true);
  assert.equal(subscriptions[0].isClosed, true);
  assert.equal(render('other').hasJourney, false);
  subscriptions[1].onNext(snapshot(true));
  assert.equal(render(null).hasJourney, false);
  assert.equal(subscriptions[1].isClosed, true);
  assert.equal(render('owner').isLoading, true);
});

test('lookup errors are retryable and never establish missing setup', () => {
  const { render, subscriptions } = createJourneyAccess();
  render('owner');
  subscriptions[0].onError(new Error('Permission denied'));
  assert.equal(render('owner').hasError, true);
  render('owner').retry();
  assert.equal(render('owner').isLoading, true);
  assert.equal(render('owner').hasError, false);
  assert.equal(subscriptions[0].isClosed, true);
  subscriptions[1].onNext(snapshot(false));
  assert.equal(render('owner').hasJourney, true);
});
