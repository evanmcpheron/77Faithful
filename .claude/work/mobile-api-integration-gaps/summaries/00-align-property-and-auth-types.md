## Summary

`node_modules/@turndown/library` is corrected to the `0.1.70` version already pinned in
`package-lock.json` (the working tree had drifted to `0.1.52`), and every local type that referenced
a name removed or renamed in that version is realigned. `src/providers/auth/auth.types.ts`,
`src/services/auth/auth.types.ts`, and `src/services/auth/auth-api.service.ts` now type the
authenticated user as `IUser` instead of the no-longer-exported `IUserSafe`, with no change to any
`useAuth()` call site. `src/features/properties/property.types.ts` now defines eight
previously-broken re-exports as local interfaces instead of re-exporting them from
`@turndown/library`, preserving the field shape every current consumer already expects.

## Changes

- `src/providers/auth/auth.types.ts` — `IAuthProviderValue.user` is `IUser | null`, imported from
  `@turndown/library`, replacing `IUserSafe`.
- `src/services/auth/auth.types.ts` — `IAuthApiService.getAuthenticatedUser` returns
  `Promise<IUser>`, replacing `Promise<IUserSafe>`.
- `src/services/auth/auth-api.service.ts` — `getAuthenticatedUser`'s implementation and return type
  use `IUser`; the method body is unchanged (it already returned `response.data.user`, which
  `IGetCurrentUserResponse` already typed as `IUser | null` upstream).
- `src/features/properties/property.types.ts` — no longer re-exports `IPropertyAccessFormValues`,
  `IPropertyAccessItem`, `IPropertyFilterValues`, `IPropertyFormValues`, `IPropertyJobSummaryItem`,
  `IPropertyMetric`, or `IPropertyRoomSummaryItem` from `@turndown/library` (none of the eight
  currently exist there under those names). Defines all seven locally, field-for-field matching what
  every current consumer (`property-room-summary`, `property-access.form`, `property-access-card`,
  `property-filter-panel`, `property.form`, `property-job-summary`, `property-card`,
  `property-summary`, `property-stats-grid`, and their fixtures/stories) already destructures.
  `IPropertyBase` is dropped entirely — it had no consumer anywhere in `src/` or `app/`.
  `IPropertyAccessItem.iconName` and `IPropertyMetric.iconName` are typed `TIconName` (from
  `@td/components/ui/icon/icon.types`, the same module `ActionRow`/`KeyValueRow` already use for
  their own icon props) rather than a bare `string`, and `IPropertyJobSummaryItem.status` is typed
  `TStatus` (from `@turndown/library`) rather than a bare `string` — both needed so the components
  that pass these fields straight into `KeyValueRow.iconName`, `ActionRow.trailingIconName`, and
  `StatusBadge.status` still type-check against those components' real prop types once the fields
  stop resolving as `any` (see Verification).
- `src/features/properties/components/property-component-story.fixtures.ts` — `propertyStoryJobs`'
  `status` values are corrected from `'InProgress'` / `'Pending'` / `'Overdue'` to the real `TStatus`
  enum members `'IN_PROGRESS'` / `'PENDING'` / `'OVERDUE'`. The old values were never valid `TStatus`
  members under any library version; they type-checked before only because the field resolved to
  `any`.

No other file changed. `package.json` and `package-lock.json` are untouched — both already pinned
`@turndown/library@^0.1.70`; only the local `node_modules` install was stale.

## Tests

Unit Test Gate did not fire. No new logic is introduced — this is a type realignment plus one
fixture data correction (status string casing), not a new or changed function, hook, reducer, or
transform. Per the ticket's own Testing Guidance, `npx tsc --noEmit` is the verification method for
the type change (see Verification); the fixture correction has no logic to unit test.

## Manual Verification

| Case | Request / interaction | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| Launch app / Storybook, confirm no runtime import errors on properties and settings/auth screens | N/A | No import errors | NOT RUN — no simulator, device, or browser available in this environment | NOT RUN |
| `PropertyJobSummary` Storybook story renders `StatusBadge` for each corrected status value | N/A | Badge renders for `IN_PROGRESS`/`PENDING`/`OVERDUE` as it did for the old literal values | NOT RUN — same environment limitation | NOT RUN |

This gate fires because the fixture status-literal correction is a real, runtime-observable change
(it changes what `propertyStoryJobs` feeds into `PropertyJobSummary`'s Storybook story, which is
live in Storybook even though the Jobs domain has no server route and no live in-app consumer). It
could not be run: this environment has no way to launch `npx expo start`, a simulator, or a
Storybook web build for visual confirmation. `npm run ios`/`npm run android`/`npx expo start` are
the repo's documented launch commands per `package.json`; running one of them and opening the
`Properties` story group's `PropertyJobSummary` story is the remaining check.

## Verification

**Status: Implemented, verification blocked** — the manual verification step above could not run in
this environment.

Every acceptance criterion was checked against a real `npx tsc --noEmit` run, not against the code
as written:

- **AC1** (zero errors containing `@turndown/library`) — confirmed. Baseline (`node_modules`
  corrected to `0.1.70`, before any source edit): 104 total errors, 11 containing
  `@turndown/library`. After: 95 total errors, 0 containing `@turndown/library`.

  The ticket's parenthetical — "the ~100 pre-existing `exactOptionalPropertyTypes` errors elsewhere
  in the repo... must still be present in equal number after this change" — does not hold exactly:
  93 non-`@turndown/library` baseline errors became 95. Every one of the 93 original errors is still
  present unchanged (confirmed by diffing `(file,line,column)` locations, not error text, since
  restoring real types also improved some pre-existing error messages from `any`-based text to
  concrete type names at the same locations). The +2 are genuinely new locations:
  `property-access-card.component.tsx(29,9)` and `property-stats-grid.component.tsx(34,7)`, both
  `TS2375` `exactOptionalPropertyTypes` violations passing an `iconName: TIconName | undefined` into
  a prop typed without `| undefined`. Both files had **zero** errors at baseline — the broken
  `@turndown/library` import degraded `IPropertyAccessItem`/`IPropertyMetric` to `any` throughout
  those files, which silently suppressed this same pre-existing `exactOptionalPropertyTypes` category
  of error that the ticket already documents as present elsewhere in the repo. Restoring real types
  (the entire point of this ticket) makes them visible for the first time; fixing them would mean
  editing `property-access-card.component.tsx`'s and `property-stats-grid.component.tsx`'s prop
  construction, which is out of scope both by the ticket's explicit exclusion of
  `exactOptionalPropertyTypes` errors and by its instruction that the five dead-code types get a
  "narrowly mechanical" fix only. Flagged here rather than silently absorbed into the count.
- **AC2** (`useAuth()` consumers still type-check as `IUser | null`, no call-site changes) —
  confirmed. `src/providers/auth/auth.provider.tsx`, `src/components/ui/avatar/avatar.component.tsx`,
  `src/features/settings/screens/settings.screen.tsx`, `src/features/properties/screens/admin-properties.screen.tsx`,
  and every other `grep -rn "useAuth()"` result produce zero `tsc` errors after the change, and none
  were edited.
- **AC3** (`property-room-summary.types.ts` compiles against the specified `IPropertyRoomSummaryItem`
  shape) — confirmed. Zero `tsc` errors in that file; the local interface matches the ticket's
  specified shape verbatim.
- **AC4** (`property-access.form.types.ts`/`property-access-card.types.ts` compile against the
  specified replacements, same field lists) — confirmed. Zero `tsc` errors in either file; both
  local interfaces preserve their current field lists exactly (verified against
  `property-access.form.tsx`'s and `property-access-card.component.tsx`'s actual field usage before
  editing).

Test & Lint Gate:

- `npx tsc --noEmit`: 0 errors containing `@turndown/library` (down from 11); 95 total (up from 104,
  net effect of removing 11 and unmasking 2, see AC1 above).
- `npm run lint`: 71 problems (51 errors, 20 warnings), down from a 75-problem (55 errors, 20
  warnings) baseline confirmed via `git stash` before/after comparison. All 5 changed files are
  lint-clean; the 3 pre-existing `prettier/prettier` errors on lines this ticket touched in
  `src/providers/auth/auth.types.ts` (import/export ordering) are fixed. Every other lint error in
  the full-repo run (`auth.provider.tsx`, `api-client.instance.ts`, `api-client.service.ts`,
  `api.types.ts`, `billing-api.service.ts`, `company-api.service.ts`, `property-api.service.ts`,
  `room-api.service.ts`, `room.types.ts`, `user-api.service.ts`, `property-status-card.styles.ts`,
  `create-property.form.tsx`/`.types.ts`, `edit-property.form.tsx`/`.types.ts`) is pre-existing and
  untouched by this ticket, confirmed present in the unmodified tree via the same stash comparison.
- `npm test`: 1 suite passes (28 tests), 2 suites fail to run — both pre-existing, confirmed via the
  same stash comparison: `src/utils/object/object.util.test.ts` and
  `src/utils/string/string.util.test.ts` fail on `TS2532`/`TS2322`/`TS2345`/`TS18048` type errors in
  `src/utils/string/string.util.ts` and the object test file itself, entirely unrelated to
  `@turndown/library`, auth types, or property types. Neither file was touched by this ticket.

Manual Verification Gate fires (see above) because of the fixture status-literal correction, and
could not run in this environment.

## Risks / Follow-ups

- `property-access-card.component.tsx(29,9)` and `property-stats-grid.component.tsx(34,7)` now show
  real `exactOptionalPropertyTypes` errors that were previously masked by `any` (see Verification,
  AC1). Both components are confirmed dead code per the ticket's own classification (no live screen
  renders either outside their own Storybook story). Not fixed here — same category the ticket
  explicitly rules out of scope. Worth a follow-up ticket if these components are ever wired into a
  live screen, since they will not compile clean until then.
- Manual/Storybook verification of the `PropertyJobSummary` and `PropertyAccessCard`/`PropertyStatsGrid`
  stories, and a general check for runtime import errors on the properties and settings/auth screens,
  is outstanding — see Manual Verification. The repo's own launch commands
  (`npm run ios` / `npm run android` / `npx expo start`) should be run in an environment with a
  simulator, device, or Storybook web build available.
- `src/features/properties/forms/create-property/create-property.form.tsx`'s pre-existing
  `companyId`-missing `exactOptionalPropertyTypes` error (flagged in the ticket's Out of Scope) is
  still present and unrelated to this change — carried forward as a known, separate issue per the
  ticket, not addressed here.
