const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const createLatestJourney = () => {
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
    orderBy: (...order) => order,
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
  const filename = 'src/features/journey/use-latest-journey.hook.ts';
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const hookModule = {
    exports: {},
    console: { warn: () => {} },
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'firebase/firestore') return firestore;
      if (name === '@77/lib/firebase') return { db: {} };
      throw new Error(`Unexpected module: ${name}`);
    },
  };
  vm.runInNewContext(source, hookModule, { filename });
  return {
    subscriptions,
    render: (userId) => {
      stateIndex = 0;
      return hookModule.exports.useLatestJourney(userId);
    },
  };
};

const snapshot = (journey, fromCache = false) => ({
  empty: journey === null,
  metadata: { fromCache },
  docs: journey === null ? [] : [{ data: () => journey }],
});

test('latest journey waits for authoritative absence and receives live saved writing', () => {
  const { render, subscriptions } = createLatestJourney();
  assert.equal(render('owner').isLoading, true);
  const subscription = subscriptions[0];
  assert.equal(subscription.query[0], 'users/owner/journeys');
  assert.deepEqual(subscription.query[1], ['createdAt', 'desc']);
  assert.equal(subscription.query[2], 1);
  subscription.onNext(snapshot(null, true));
  assert.equal(render('owner').isLoading, true);
  subscription.onNext(snapshot(null));
  assert.equal(render('owner').isLoading, false);
  assert.equal(render('owner').journey, null);
  const journey = { startingMotivation: { text: 'Return to prayer' } };
  subscription.onNext(snapshot(journey));
  assert.equal(render('owner').journey, journey);
  subscription.onNext(snapshot({ startingMotivation: { text: null } }));
  assert.equal(render('owner').journey.startingMotivation.text, null);
});

test('switching accounts and signing out never displays previous private writing', () => {
  const { render, subscriptions } = createLatestJourney();
  render('owner');
  subscriptions[0].onNext(snapshot({ startingMotivation: { text: 'Private writing' } }));
  assert.equal(render('other').journey, null);
  assert.equal(render('other').isLoading, true);
  assert.equal(subscriptions[0].isClosed, true);
  assert.equal(render(null).journey, null);
  assert.equal(subscriptions[1].isClosed, true);
  assert.equal(render('owner').isLoading, true);
});

test('a failed latest journey lookup can be retried', () => {
  const { render, subscriptions } = createLatestJourney();
  render('owner');
  subscriptions[0].onError({ code: 'unavailable' });
  assert.equal(render('owner').hasError, true);
  assert.equal(render('owner').isLoading, false);
  render('owner').retry();
  assert.equal(render('owner').isLoading, true);
  assert.equal(render('owner').hasError, false);
  assert.equal(subscriptions[0].isClosed, true);
  subscriptions[1].onNext(snapshot({ startDate: '2026-09-09' }));
  assert.equal(render('owner').journey.startDate, '2026-09-09');
});
