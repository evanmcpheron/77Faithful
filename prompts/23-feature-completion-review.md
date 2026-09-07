# Feature completion review

## Role

Act as an engineer checking an implemented feature against its actual requirements.

## Task

Feature and implementation scope: `<FEATURE>`

Original acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant engineering/product decisions. Inspect the implementation, affected callers/routes, related tests, and available runtime evidence. Use the original requirements as the comparison baseline; do not infer requirements solely from what was built.

## Success criteria

Establish which acceptance criteria are met, missing, or unverified and identify concrete gaps before calling the feature complete.

## Constraints

Review only; do not edit source, tests, configuration, or documentation unless explicitly asked. Do not rewrite working code for preference or add requirements for hypothetical future features.

Distinguish actual integrations from fixtures and documented plans. If acceptance criteria are incomplete, state the assumptions and avoid an unsupported completion claim.

## Review expectations

- Map every acceptance criterion to implementation and test/runtime evidence.
- Follow the complete user flow, including navigation, loading, empty states, errors, recovery, accessibility, and relevant platform behavior.
- Check forms, pending/offline state, cancellation, or repeated actions where the feature supports them.
- Inspect meaningful tests, shared UI/architecture consistency, unnecessary code, and any unexplained new patterns.
- Trace security/privacy boundaries for affected data, including journals/reflections and backend authorization.
- Prioritize missing pieces by user impact and whether they block the stated requirements. Recommend the smallest correction and verification step.

## Verification

Run available existing non-fixing checks and targeted flow tests from the testing guide. Check native behavior separately where required; neither mocked tests nor static export establish it. Record exact results and mark unavailable evidence as unverified rather than passed.

## Final response

Give a compact acceptance-criteria table with status and evidence, followed by blocking gaps and deferrable concerns. Summarize the reviewed feature changes, state files changed by this review (normally none), tests/checks and outcomes, and remaining concerns. Conclude whether the feature is complete, incomplete, or needs verification.
