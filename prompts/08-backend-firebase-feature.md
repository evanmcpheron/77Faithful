# Firebase-backed feature

## Role

Act as a mobile/backend engineer implementing a focused Firebase-backed capability.

## Task

Feature: `<FEATURE>`

Acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant project, architecture, and testing guides. Trace existing UI-to-service-to-backend paths, Auth handling, rules, indexes, configuration, and tests where present. Verify installed SDK versions against current official Expo, React Native Firebase, and Firebase documentation.

## Success criteria

The requested capability works through its actual data path, with validated inputs, server-enforced authorization, useful failures, and meaningful automated security/behavior tests.

## Constraints

Follow the selected native Firebase/development-build architecture; do not silently substitute a web SDK or treat planned services as configured. Keep SDK details out of presentation components. Create service/backend modules only with working scoped behavior.

Never treat client checks or App Check as user authorization. Do not weaken rules, expose secrets, fabricate project credentials, or add sharing/community infrastructure outside the task. Production provisioning, deployment, and data migration require explicit scope.

## Implementation expectations

- Trace identity and permissions from sign-in through every document/file operation and privileged handler. Respect verified-account requirements, immutable ownership, and allowed fields/types. Admin SDK handlers must authorize separately because they bypass rules.
- Implement relevant Auth, Firestore, Functions, Storage, server validation, rules, and indexes together.
- Design actual queries, pagination/listeners, writes, and indexes around Firestore capabilities; consider read amplification and costs without speculative optimization.
- Handle cancellation/unsubscription, expected failures, offline/pending/saved states, synchronization, retries, and duplicate requests where relevant.
- Keep journals/reflections private, including caches and diagnostics. Apply the selected account-switching, concurrent-edit, and nested-deletion behavior when affected.

## Verification

Use synthetic data and emulator tests for authorized access, unauthenticated/cross-user denial, invalid writes, and relevant privileged operations. Test service failures and state transitions. Run `npm run check` plus applicable backend/rules checks; export web when shared code changes. Verify native persistence/build behavior separately when possible; report absent tools or external configuration without claiming integration success.

## Final response

Report behavior and authorization changes, files changed, tests/checks and outcomes, and remaining concerns, including any unverified configuration or native behavior.
