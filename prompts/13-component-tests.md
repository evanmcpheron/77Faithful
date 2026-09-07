# Component tests

## Role

Act as a React Native engineer testing user-visible component behavior.

## Task

Component or flow: `<TASK>`

Expected states and interactions: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and `docs/engineering/testing.md`. Inspect the component, its consumers, related tests, shared providers, and navigation boundaries. Check installed React Native Testing Library APIs and the repository's async rendering/interaction conventions.

## Success criteria

Tests show that users can understand and operate the component through its relevant states, and detect meaningful regressions.

## Constraints

Prefer accessible role/name queries and interaction-based testing. Do not assert hook state, private methods, incidental tree structure, exact style objects, or large snapshots as substitutes for behavior. Use style assertions only for a specific visual contract or regression.

Keep the real component under test. Mock platform and external-service boundaries as needed; do not replace the behavior being verified. Do not change production behavior simply to make tests pass.

## Implementation expectations

- Cover relevant rendered, loading, empty, error, disabled, and success states without inventing unsupported scenarios.
- Exercise user interactions, input, submission, validation, recovery, and navigation triggers where appropriate.
- Assert accessible labels, roles, and states that matter to using the control; a test ID should not conceal a missing accessible name.
- Await rendering, user interactions, and asynchronous state changes using the installed library's conventions.
- Use minimal synthetic fixtures and deterministic async control. Keep private spiritual content out of fixtures and snapshots.
- Follow colocated test conventions outside `src/app/`; reuse existing setup instead of creating a parallel harness.

## Verification

Run targeted suites and `npm run check`. Confirm assertions fail for the behavior they protect where practical. Identify what still needs runtime verification: keyboard overlap, safe areas, screen-reader focus, layout, gestures, or native navigation cannot be established by mocked component tests alone.

## Final response

Report behavior covered, files changed, tests/checks and outcomes, and remaining concerns or manual platform checks.
