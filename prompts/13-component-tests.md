# Component tests

Add tests for user-visible behavior. Read `AGENTS.md` and `docs/engineering/testing.md`; inspect the component, consumers, providers, navigation boundaries, and related tests. Use the installed React Native Testing Library's async conventions.

Component or flow: `<TASK>`

Expected states and interactions: `<REQUIREMENTS>`

## Test

- Exercise relevant rendered, loading, empty, error/recovery, disabled, submitting, and success states that the component actually supports.
- Use user interactions for input, validation, submission, toggling, recovery, and navigation triggers where applicable. Prefer accessible role/name queries and assert meaningful labels, roles, and states.
- Keep the real component and behavior under test; isolate platform/external boundaries as needed. Await rendering, interactions, and async transitions.
- Avoid incidental tree structure, internal hook state, and broad snapshots. Style assertions are useful for a specific visual contract or regression; a test ID must not conceal a missing accessible name.
- Reuse the existing harness and synthetic fixtures, with tests outside `src/app/`. Keep production changes separate unless explicitly included; report exposed defects without rewriting expected behavior to make tests pass.

## Verify and finish

Run targeted suites and required `AGENTS.md` checks. Check that assertions would fail if the protected interaction broke. Report behaviors covered and results, including failures. Identify runtime limits such as keyboard overlap, safe areas, screen-reader focus, gestures, and native navigation. Stop at meaningful protection of the specified interactions; mocked tests do not establish overall usability.
