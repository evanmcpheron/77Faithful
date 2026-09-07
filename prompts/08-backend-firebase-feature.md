# Firebase-backed feature

Implement the specified data capability. Read `AGENTS.md` and relevant architecture/testing guidance. Trace existing identity, service calls, document paths, rules, indexes, and tests. Verify the installed SDK's behavior against current official Firebase, React Native Firebase, and relevant Expo documentation.

Feature: `<FEATURE>`

Acceptance criteria and required reads/writes: `<REQUIREMENTS>`

## Implement

- Follow the selected native Firebase/development-build architecture. Introduce only the Firebase products and focused service/backend modules needed for this feature; planned integrations are not configured infrastructure.
- Map each operation to its owner, allowed actors, fields, query, and authorization boundary. Apply the Firebase rules in `AGENTS.md`, including the selected verified-account requirement for cloud personal-data writes.
- Deliver the necessary rules, validation, indexes, and tests with each data path. Keep private records separate from shared data; include membership enforcement only when community behavior is in scope.
- Bound queries/listeners and clean up subscriptions. Consider actual read/write costs, document growth, and required atomic operations without building a generic repository framework.
- Handle realistic service failures and applicable offline, pending/saved/failed, concurrent-edit, retry, and duplicate-request behavior. Follow selected account-switching and nested-deletion semantics when personal records are affected.

## Verify and finish

Use synthetic emulator tests for allowed access, unauthenticated/unverified/cross-user denial, invalid fields, ownership or privilege changes, and scoped membership cases. Test privileged handlers independently of rules and exercise service failure/state transitions.

Complete `AGENTS.md` checks plus backend/rules checks. When introducing the separate backend or emulator setup, provide runnable scripts, document them, and include applicable checks in CI; root Jest currently only discovers `src/` tests. Verify native build/persistence behavior where available. Report missing external configuration and unverified boundaries without claiming the integration works. Stop at the requested capability; cloud provisioning, deployment, and data migration are separate unless included in the user's scope.
