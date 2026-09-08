# Navigation foundation

Implement or modify the navigation foundation for 77Faithful.

Read these files before editing:

- `AGENTS.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/FORMATION_CONTENT_SPEC.md` for content/fixture boundaries (no curriculum authoring in navigation work)
- `docs/APP_NAVIGATION_AND_UX.md`
- `docs/engineering/project-context.md`
- `docs/engineering/architecture-decisions.md`
- `docs/engineering/design-system.md`
- `docs/engineering/testing.md`
- the applicable existing prompts in `prompts/`
- the current route files, layouts, tab implementations, navigation helpers, and navigation-related tests

Before relying on Expo Router behavior or APIs, verify them against the documentation for the exact installed Expo SDK and Expo Router versions. Do not rely on remembered APIs from another release.

Navigation scope:

`<SCOPE>`

Acceptance criteria and constraints:

`<REQUIREMENTS>`

## Authority and scope

`docs/APP_NAVIGATION_AND_UX.md` is authoritative for:

- route names,
- screen responsibilities,
- screen relationships,
- navigation types,
- tab structure,
- authentication/onboarding gates,
- journey/day routing,
- CTA destinations,
- back behavior,
- route-level V1/Future exposure within product scope,
- settings flows,
- loading/error/empty navigation behavior,
- deep-link behavior,
- settled V1 navigation decisions and explicitly deferred Future questions.

Do not create an alternate navigation specification in source code or this prompt.

If source code and the navigation contract differ, determine whether the difference is:

1. expected because a Planned — V1 route has not been implemented yet,
2. an implementation defect,
3. an intentional product change that requires a same-change contract update, or
4. a newly discovered product conflict or explicitly deferred Future question that must not be silently decided.

Do not treat Existing, Planned — V1, V1.x / post-launch, Future, and external setup prerequisites as interchangeable. Product requirements owns feature scope; the content specification owns approval/version/fixture policy.

## Navigation preflight

Before editing:

1. Generate the actual current route tree from `src/app/`.
2. Inspect every `_layout.tsx` involved in the requested scope.
3. Inspect both native and web tab implementations.
4. Trace the current root launch behavior.
5. Identify existing `Link`, `Redirect`, `router.push`, `router.replace`, and related navigation calls.
6. Map the requested routes to the Route Registry and Screen Relationship Matrix in `docs/APP_NAVIGATION_AND_UX.md`.
7. Identify which navigation behavior can be implemented truthfully with current application state and which behavior depends on integrations that do not exist yet.
8. Check the navigation contract's Settled V1 Decisions and Deferred Future Decisions before implementing anything affected by them.

## Router architecture

Preserve Expo Router and its file-based routing model.

Use ordinary Expo Router route groups, stacks, tabs, pushes, pops, and replacements. Do not introduce a second router, a custom navigation framework, or direct `@react-navigation/*` application imports.

Prefer:

- a root stack for application-level route groups,
- route-group layouts for auth, onboarding, authenticated application routes, tabs, settings, and focused day flows where appropriate,
- native stack behavior for pushed screens,
- the existing platform-specific native/web tab strategy,
- typed Expo Router destinations,
- route parameters only for non-private routing state.

V1 permanent tabs are exactly:

- Today
- Journey

Do not expose Community, disabled Community placeholders, Community badges, or Community routes in V1.

Settings is not a permanent tab. It is pushed from the appropriate authenticated tab header.

Scripture Reader, Reflection, Historical Day Detail, Settings subpages, and Delete Account are focused pushed routes as defined by the navigation contract. Do not convert them into tabs or arbitrary modals.

Prayer and optional-practice completion remain inline with the daily screen. Do not create Prayer or generic Practice routes just to simplify code organization.

Preserve normal Android system Back and iOS stack/back-gesture behavior. Do not simulate navigation with manually maintained screen state.

## Authentication and onboarding gates

Centralize authentication/onboarding protection when the required runtime state exists.

Use the Expo Router protected-route mechanism supported by the installed version when it can be backed by real application state.

Do not:

- create fake Firebase authentication,
- create a placeholder auth context merely to make guards appear implemented,
- create hard-coded signed-in users,
- fabricate onboarding completion,
- fabricate journey records,
- duplicate redirect effects across individual screens.

If authentication/onboarding state does not exist yet, make the route/layout structure ready for centralized protection and clearly identify the exact future integration boundary.

The current implementation may truthfully treat initial launch as signed out until authentication actually exists, but do not create fake authenticated states to demonstrate other routes.

V1 requires `/auth/verify-email` immediately after sign-up and before onboarding/cloud personal-data writes, including restored unverified sessions. Include its navigation scaffold in broad V1 foundation scope, but defer its state-backed redirects, refresh/resend, and verification success until real Firebase state exists. Missing integration-backed guards must be reported as deferred integration work rather than represented as production-complete authorization.

## Dynamic day routes

Support the contract's dynamic route structure without inventing journey data.

At minimum:

- parse `dayNumber` safely,
- reject non-integers,
- reject values outside `1...77`,
- never place private content in route parameters.

Current-day, future-day, historical-day, and ended-journey access rules require actual journey state. Implement those guards only when the required state exists.

Keep parameter parsing and route-access decisions out of presentation JSX when doing so materially improves correctness or reuse.

Because the repository currently uses static web output, verify the Expo Router requirements for exporting dynamic routes. Preserve `npm run export:web` without changing the application to server rendering merely to support the navigation scaffold. If static parameters are required for `[dayNumber]`, generate the bounded Day 1–77 route set using the supported Expo Router mechanism.

## Tabs

Preserve the existing platform-specific tab strategy unless repository evidence demonstrates a concrete problem.

Native iOS/Android navigation should continue using the installed Expo Router native-tab capability if supported by the installed version.

Web may continue using the existing custom Expo Router UI tab implementation.

Preserve the existing Today/Journey scaffold; if applying this prompt to an older checkout, replace starter Home/Explore concepts within the requested scope.

Use system/platform icons supported by the installed navigation API where practical. Do not add an icon dependency or generate custom navigation artwork solely for basic Today/Journey tab icons.

Keep tab names, destinations, accessibility labels, selected state, and platform behavior consistent across native and web implementations.

Do not manually reserve a fixed tab inset on screens when the active navigator/platform can supply the real layout behavior.

## Screen scaffolding

For a broad navigation-foundation task, it is acceptable to create the complete requested Planned — V1 route structure even when the final feature content is not implemented.

Navigation placeholder screens must be intentionally minimal.

They may establish:

- route existence,
- screen title,
- basic hierarchy,
- deterministic navigation actions,
- back relationships,
- route parameter handling,
- Settings child relationships,
- onboarding step relationships,
- auth-screen relationships.

They must not fabricate:

- successful authentication,
- successful account creation,
- Firebase persistence,
- API.Bible content,
- journey progress,
- practice completion,
- reflections,
- notification permissions,
- account deletion,
- synchronization,
- offline support.

Use reusable scaffolding only where it meaningfully removes repeated temporary UI. Do not build a large placeholder component framework.

Navigation scaffolding is not final screen design.

## Required V1 additions and Future exclusions

A broad V1 foundation task includes `/auth/verify-email` and `/settings/notifications` plus the Notifications Settings row. Both are **Planned — V1**, even though their features are currently absent. Preserve existing focused day and Settings routes; do not duplicate or rename them.

Scaffold these routes and deterministic entry/back relationships without pretending verification or local reminder scheduling works. Notification permission is outside onboarding, and a placeholder must not simulate enablement, a chosen time, or successful scheduling. The navigation contract owns the feature flow; this prompt does not authorize integrating notifications or Firebase.

Do not create Future Community or invitation routes during V1 navigation work. No disabled Community tab, teaser, badge, or placeholder card.

## Documentation

If routes move from Planned — V1 to actually implemented navigation scaffolding, update the applicable implementation-status portions of:

- `docs/APP_NAVIGATION_AND_UX.md`
- `docs/engineering/project-context.md`

Keep the contract authoritative.

Do not rewrite product behavior simply because implementation now exists.

Update the Screen Inventory, Route Registry, source reconciliation, or related status sections only where the actual code has changed.

If implementation materially changes a documented route, screen responsibility, CTA destination, gate, or back behavior, update the relevant behavioral specification in the same change.

## Tests

Add meaningful tests for navigation-specific logic introduced by the task.

Prefer pure tests for:

- route parameter parsing,
- launch-destination decisions when such state logic genuinely exists,
- route-access decisions when backed by implemented domain state.

Use component tests for meaningful navigation triggers and accessible controls where useful.

A mocked router call proves only that a trigger was issued. Do not claim it proves native stack behavior, protected-route behavior, hardware Back behavior, gestures, or end-to-end navigation.

Do not create speculative tests for authentication, journey state, Firebase, API.Bible, Community, or notification behavior that is not implemented; route/link checks may cover their truthful scaffolds.

## Verification

For source/navigation changes:

1. Run targeted tests while implementing.
2. Run `npm run check`.
3. Run `npm run export:web`.
4. Inspect generated/typed routes where useful.
5. Verify the resulting route tree against the contract.
6. Exercise the navigation on available native runtimes where practical.
7. Check Android Back and iOS pushed-screen behavior where runtime access exists.
8. Check Today/Journey tab selection and Settings return behavior.
9. Check invalid dynamic day parameters.
10. Check required Verify Email/Notifications route relationships, no Community exposure, and no fake submissions or scheduling.

Report:

- routes/layouts added, removed, or changed,
- navigation relationships implemented,
- behavior intentionally deferred because its state/integration does not exist,
- documentation updated,
- tests added,
- commands actually run and their outcomes,
- native/runtime checks not performed.

Finish with the smallest coherent navigation foundation required by the task. Do not implement unrelated product screens, backend services, or speculative architecture.
