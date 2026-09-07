# Feature completion review

Review only under `AGENTS.md`. Read relevant engineering/product decisions and inspect the implementation, affected routes/callers, tests, and available runtime evidence.

Feature and implementation scope: `<FEATURE>`

Original acceptance criteria: `<REQUIREMENTS>`

## Check completeness

- Use the original requirements as the baseline; do not infer them solely from what was built. Identify material missing criteria before making a completion claim.
- Map each criterion to implementation and test/runtime evidence. Distinguish actual integrations from fixtures, plans, and fake success paths.
- Follow the included user flow through navigation, loading/empty/error recovery, forms, accessibility, and affected platforms. Check pending/offline, cancellation, or repeated actions where supported.
- Inspect important behavior tests and consistency with existing UI/architecture. Trace authorization and privacy for affected data.
- Identify missing pieces that block the stated outcome and the smallest correction/verification, without adding hypothetical future requirements.

## Verify and conclude

Run available existing non-fixing project checks and targeted flow tests. Mark unavailable native/provider evidence unverified; neither mocks nor static export establishes it.

Return a compact criterion/status/evidence table, blocking gaps, and deferrable concerns. Conclude **Complete**, **Incomplete**, or **Needs verification**, tied to those criteria. Stop at the assessment; do not fill gaps by editing code during the review.
