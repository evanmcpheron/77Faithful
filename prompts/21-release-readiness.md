# Release readiness

## Role

Act as an engineer reviewing a 77Faithful release or milestone for concrete blockers.

## Task

Release/milestone, revision, target platforms, and intended audience: `<TASK>`

Release scope and acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant project, architecture, design, and testing guidance. Inspect the release revision, app/build configuration, relevant CI results, implemented user flows, backend rules/indexes, and provider configuration evidence. Determine which capabilities exist versus remain planned.

## Success criteria

Produce a practical release-blocker checklist tied to the stated milestone and platforms, separating blockers from improvements that can safely wait.

## Constraints

Review only; do not edit source, tests, configuration, documentation, cloud resources, or store metadata, deploy, or publish unless explicitly asked. Use synthetic data and avoid printing credentials.

Do not declare production readiness from a successful web export or unit suite. The selected first release is native iOS/Android; web preview is not evidence of a production web release.

## Review expectations

- Check TypeScript, lint, formatting, automated tests, and relevant CI/build evidence for the intended revision.
- Exercise critical authentication, navigation, input, loading, empty, error, offline/network, synchronization, and crash-prone paths.
- Examine permissions, environment variables, app identifiers, build/signing setup, metadata/artwork, iOS behavior, and Android behavior.
- Verify evidence for production Firebase configuration, rules, indexes, authorization, private-data deletion, and operational limits where required.
- Review API.Bible gateway/configuration, real translation entitlements, attribution, licensing, and unavailable-text behavior where included.
- Assess accessibility, privacy, and product-experience requirements without expanding the milestone.
- Mark each relevant item verified, failed, or unverified, with evidence. A missing prerequisite for a shipping capability is a blocker; unrelated future functionality is not.

## Verification

Run available non-fixing project checks and targeted release-flow checks. Inspect native build/device evidence and deployment configuration only within available access. State checks that cannot run and what would establish readiness; do not install or provision missing infrastructure during this review.

## Final response

Give a readiness judgment and a concise blocker checklist with location, evidence, and required resolution. Separate deferrable improvements. Report changes/files changed (normally none), checks and outcomes, and remaining concerns or unverified release gates.
