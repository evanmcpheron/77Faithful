const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const filename = 'src/features/navigation/route-access.ts';
const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const routeModule = { exports: {} };
vm.runInNewContext(source, routeModule, { filename });
const { getRouteRedirect } = routeModule.exports;
const guestRoutes = ['index', 'sign-in', 'register', 'recover-access'];

for (const routeName of guestRoutes) {
  test(`${routeName} redirects signed-in accounts according to journey setup`, () => {
    assert.equal(getRouteRedirect({ routeName, isSignedIn: false }), null);
    assert.equal(
      getRouteRedirect({ routeName, isSignedIn: true, isEmailVerified: false }),
      '/confirm-email',
    );
    assert.equal(
      getRouteRedirect({ routeName, isSignedIn: true, isEmailVerified: true, hasJourney: false }),
      '/onboarding',
    );
    assert.equal(
      getRouteRedirect({ routeName, isSignedIn: true, isEmailVerified: true, hasJourney: true }),
      '/today',
    );
  });
}

test('protected deep links require authentication, confirmation, and a committed journey', () => {
  assert.equal(getRouteRedirect({ routeName: '(app)', isSignedIn: false }), '/');
  assert.equal(
    getRouteRedirect({ routeName: '(app)', isSignedIn: true, isEmailVerified: false }),
    '/confirm-email',
  );
  assert.equal(
    getRouteRedirect({
      routeName: '(app)',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: false,
    }),
    '/onboarding',
  );
  assert.equal(
    getRouteRedirect({
      routeName: '(app)',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: true,
    }),
    null,
  );
});

test('onboarding and confirmation redirect only when their prerequisites change', () => {
  assert.equal(getRouteRedirect({ routeName: 'onboarding', isSignedIn: false }), '/');
  assert.equal(
    getRouteRedirect({
      routeName: 'onboarding',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: false,
    }),
    null,
  );
  assert.equal(
    getRouteRedirect({
      routeName: 'onboarding',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: true,
    }),
    '/today',
  );
  assert.equal(
    getRouteRedirect({ routeName: 'confirm-email', isSignedIn: true, isEmailVerified: false }),
    null,
  );
  assert.equal(
    getRouteRedirect({
      routeName: 'confirm-email',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: false,
    }),
    '/onboarding',
  );
  assert.equal(
    getRouteRedirect({
      routeName: 'confirm-email',
      isSignedIn: true,
      isEmailVerified: true,
      hasJourney: true,
    }),
    '/today',
  );
});

for (const routeName of ['privacy', 'terms', 'about', 'themes', 'scripture-acknowledgments']) {
  test(`${routeName} remains public for every account state`, () => {
    for (const isSignedIn of [false, true]) {
      for (const isEmailVerified of [false, true]) {
        for (const hasJourney of [false, true]) {
          assert.equal(
            getRouteRedirect({ routeName, isSignedIn, isEmailVerified, hasJourney }),
            null,
          );
        }
      }
    }
  });
}
