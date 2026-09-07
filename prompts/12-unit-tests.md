# Unit tests

## Role

Act as an engineer adding meaningful behavioral tests to existing code.

## Task

Code or behavior to test: `<TASK>`

Expected rules and important cases: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and `docs/engineering/testing.md`. Read the implementation, its callers, related tests, and relevant product/domain decisions before writing assertions. Check current Jest configuration, setup, and installed testing-library APIs.

## Success criteria

Tests protect observable behavior and important failure cases, run deterministically, and fail when the intended rule is broken.

## Constraints

Avoid private implementation details, trivial getter/setter checks, source-mirroring assertions, excessive snapshots, or tests created only to raise coverage. Do not mock every collaborator.

Do not change production behavior for testing convenience. Any necessary design adjustment must preserve behavior and solve a real design problem, not merely expose internals to assertions. Do not add a testing framework when the existing setup is adequate.

## Implementation expectations

- Prioritize applicable business rules, transformations, validation, reducers/state logic, services, important hooks, edge cases, and regressions.
- Derive cases from requirements and caller expectations, including expected failures; do not simply bless current behavior when it conflicts with the requirements.
- Use behavior-describing test names and small synthetic fixtures. Keep journals, credentials, and licensed Scripture out of test data.
- Control clocks, time zones, randomness, and asynchronous work when they affect behavior. For journey logic, cover the documented calendar boundaries and missed-day semantics.
- Mock native or external boundaries where needed while exercising the actual unit. Use the established async hook-testing conventions.
- Colocate tests following repository conventions, outside `src/app/` so they do not become routes.

## Verification

Run the targeted suites and `npm run check` as required by `AGENTS.md`. For a regression, confirm the test exposes the original failure when practical without reverting unrelated work. Explain any case that requires emulator or native verification beyond unit tests.

## Final response

Report behaviors covered, files changed, tests/checks and outcomes, any justified production design adjustment, and remaining concerns or coverage gaps.
