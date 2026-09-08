# Release readiness

Review only under `AGENTS.md`. Read `docs/PRODUCT_REQUIREMENTS.md`, `docs/FORMATION_CONTENT_SPEC.md`, and relevant engineering decisions and inspect the release revision, app/build configuration, CI/build evidence, implemented flows, and scoped service configuration.

Release/milestone, revision, platforms, and audience: `<TASK>`

Shipping capabilities and acceptance criteria: `<REQUIREMENTS>`

## Assess release evidence

- Check formatting, lint, TypeScript, tests, and build results for the intended revision. Identify implemented capabilities separately from plans and fixtures.
- Compare included flows with `docs/APP_NAVIGATION_AND_UX.md` and select applicable user-flow checks from `docs/engineering/testing.md`: authentication/onboarding, daily/history/end states, settings/back, forms, recovery, offline/network behavior, synchronization, and crash-prone transitions. Check required contract updates and that Community/Future features have no V1 entry points; do not demand tests for features outside the milestone.
- Inspect app identifiers, permissions, environment setup, signing/build evidence, store metadata/artwork, and iOS/Android behavior for the target audience.
- For shipping Firebase features, check production rules/indexes, authorization, private-data deletion, and operational limits. For Scripture integration, run the Scripture release audit and check approved passage assignments, verified source text, enabled fallback coverage, attribution/licensing, and unavailable-text behavior.
- Evaluate applicable accessibility, privacy, and product requirements. Check human approval and versioned complete curriculum, required Verify Email/local reminder flows, the V1 telemetry/data limits, and the external legal/support/account prerequisites tracked in project context. Missing prerequisites for shipping capabilities are blockers; unrelated future features are not.

## Verify and conclude

Run available non-fixing project and targeted flow checks. Inspect native build/device and deployment evidence within available access; do not install, provision, deploy, or publish during the review. A web export or unit suite does not establish native release readiness.

Mark relevant gates verified, failed, or unverified with evidence. Return a readiness judgment and concrete blockers with required resolution, separating deferrable improvements. Stop at the stated milestone assessment and identify exactly which missing evidence prevents readiness.
