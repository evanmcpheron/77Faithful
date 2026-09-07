# Release readiness

Review only under `AGENTS.md`. Read relevant engineering decisions and inspect the release revision, app/build configuration, CI/build evidence, implemented flows, and scoped service configuration.

Release/milestone, revision, platforms, and audience: `<TASK>`

Shipping capabilities and acceptance criteria: `<REQUIREMENTS>`

## Assess release evidence

- Check formatting, lint, TypeScript, tests, and build results for the intended revision. Identify implemented capabilities separately from plans and fixtures.
- Exercise critical included flows: authentication, navigation, forms, loading/empty/error recovery, offline/network behavior, synchronization, and crash-prone transitions.
- Inspect app identifiers, permissions, environment setup, signing/build evidence, store metadata/artwork, and iOS/Android behavior for the target audience.
- For shipping Firebase features, check production rules/indexes, authorization, private-data deletion, and operational limits. For Scripture integration, check gateway setup, real translation entitlements, attribution/licensing, and unavailable-text behavior.
- Evaluate applicable accessibility, privacy, and product requirements. Missing prerequisites for shipping capabilities are blockers; unrelated future features are not.

## Verify and conclude

Run available non-fixing project and targeted flow checks. Inspect native build/device and deployment evidence within available access; do not install, provision, deploy, or publish during the review. A web export or unit suite does not establish native release readiness.

Mark relevant gates verified, failed, or unverified with evidence. Return a readiness judgment and concrete blockers with required resolution, separating deferrable improvements. Stop at the stated milestone assessment and identify exactly which missing evidence prevents readiness.
