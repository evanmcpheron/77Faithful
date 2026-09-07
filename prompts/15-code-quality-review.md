# Code quality and human maintainability review

Review only under `AGENTS.md`. Inspect the requested code, nearby patterns, callers/contracts, platform variants, and tests. Establish the comparison scope for a diff.

Files, feature, or diff: `<TASK>`

Intended behavior and known maintenance concerns: `<REQUIREMENTS>`

## Review

- Trace correctness, state transitions, async races, subscription/resource lifetimes, validation, and expected failures. Check affected TypeScript, React, platform, accessibility, and security/privacy contracts.
- Apply the naming, boundaries, reuse, comments, and dependency guidance in `AGENTS.md`. Evaluate whether a human can follow the behavior and locate the right place to change it.
- Substantiate maintainability findings with a concrete edit or debugging scenario: repeated changes to one domain rule, indirection obscuring an error, or unrelated responsibilities making a local change risky. Fewer lines or a preferred architecture is not sufficient evidence.
- Inspect test assertions and mocks, not only pass/fail results. Identify meaningful unprotected behavior and logic that tests replace instead of exercising.
- Distinguish introduced problems, pre-existing issues, and optional improvements. Leave routine formatting to configured tools.

## Verify and report

Use existing non-fixing checks when they help validate a concern. Trace proposed corrections through callers so they preserve required behavior and reduce the demonstrated burden. Return prioritized findings with bounded fixes and verification under `AGENTS.md`; avoid long replacement implementations. Stop at the requested scope, including an explicit no-material-findings result when warranted.
