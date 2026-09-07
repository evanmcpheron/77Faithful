# Unit tests

Add tests for the specified behavior. Read `AGENTS.md` and `docs/engineering/testing.md`, then inspect the implementation, callers, requirements, and related tests. Check the installed test APIs and setup.

Code or behavior to test: `<TASK>`

Expected rules and important cases: `<REQUIREMENTS>`

## Test

- Derive cases from requirements and caller expectations, not from copying the current implementation. Prioritize domain rules, transformations, validation, services, important hooks, and realistic failures where applicable.
- Exercise the actual unit; mock native/external boundaries only as needed. Assert observable results and necessary side effects, not private helpers or incidental call sequences.
- Use small synthetic fixtures and descriptive names. Control clocks, time zones, randomness, and async work when they affect behavior; cover documented calendar boundaries when testing journey logic.
- Follow the repository's colocated test and async hook conventions. Use coverage to locate meaningful gaps, not as a target or reason for trivial tests.
- Keep production changes outside this test-only task. If tests expose a contract defect or a meaningful testability problem, report the needed correction separately unless a fix is also authorized; do not bless the defect or hide it by weakening assertions.

## Verify and finish

Run the targeted suites and required `AGENTS.md` checks. For regressions, confirm the test detects the original failure when practical without disturbing unrelated work. Report useful behaviors protected, results including any exposed failures, and cases requiring emulator/native evidence. Stop when the specified behavior is meaningfully protected, not at an arbitrary coverage percentage.
