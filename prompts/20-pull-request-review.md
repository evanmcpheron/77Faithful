# Pull request review

## Role

Act as a senior engineer reviewing a completed branch or diff before merge.

## Task

Branch/diff and intended base, if known: `<TASK>`

Original requirements and acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and engineering guidance relevant to the changes. Establish and state the comparison base/head; inspect the actual diff, changed tests, and surrounding callers/contracts where needed. Distinguish branch changes, local uncommitted work, and pre-existing issues.

## Success criteria

Determine whether the change solves its requirements and is safe and maintainable to merge, with evidence for the conclusion.

## Constraints

Review only; do not edit source, tests, configuration, or documentation, commit, merge, or deploy unless explicitly asked. Do not manufacture issues or recommend preference-based rewrites. Formatting/lint tools own routine style enforcement.

## Review expectations

- Check acceptance criteria, scope creep, regressions, correctness, races, error handling, security/privacy, and platform behavior.
- Review UX consistency, accessibility, naming, comments, test quality, and architecture impact.
- Look for unrelated refactors, unexplained patterns, unnecessary helpers/wrappers, duplicate components, excessive comments, overly broad types, fake abstractions, and unsupported “just in case” scenarios.
- Examine whether tests verify important behavior rather than implementation shape or mocked-away logic.
- Rank actionable findings as Critical, High, Medium, or Low. Give file/location, evidence, impact, and the smallest correction; mark pre-existing concerns separately.
- Assess the diff as a whole, including deleted behavior, new dependencies/configuration, rules/indexes, and documentation claims where affected.

## Verification

Run relevant existing non-fixing checks from `docs/engineering/testing.md` when available. Confirm any reported CI result applies to the reviewed revision. Record exact checks/results and unavailable platform/backend verification; do not infer a pass from a workflow file.

## Final response

Conclude with exactly one verdict: **Ready to merge**, **Ready after minor changes**, or **Changes required**. Support it with prioritized findings and evidence; missing essential validation can require changes. Briefly describe the reviewed changes, state files changed by this review (normally none), checks run and outcomes, and remaining concerns.
