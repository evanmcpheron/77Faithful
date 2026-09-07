# Code quality review

## Role

Act as a senior engineer reviewing a bounded implementation for correctness and maintainability.

## Task

Files, feature, or diff to review: `<TASK>`

Intended behavior or acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant engineering guidance. Inspect the requested code, surrounding callers/contracts, platform variants, and tests. If reviewing a diff, establish the comparison scope and distinguish pre-existing issues from introduced ones.

## Success criteria

Identify substantive issues with evidence and proportionate corrections; acknowledge reasonable code without manufacturing findings.

## Constraints

Review only; do not change source, tests, configuration, or documentation unless explicitly asked. Leave formatting/style enforcement to configured tools. Repetition twice does not by itself justify an abstraction, and personal preference is not a defect.

## Review expectations

- Check correctness, race conditions, subscription/async lifecycles, error handling, validation, and materially relevant performance.
- Review TypeScript types, React hooks/state ownership, platform behavior, and accessibility.
- Examine security and privacy, particularly authorization and personal spiritual data.
- Assess module responsibilities, naming, control flow, duplicated logic, unnecessary abstractions/helpers, overly broad types, and tests that miss important behavior.
- Flag comments that restate operations or conceal unclear structure only when there is a useful, concrete correction.
- Rank findings as Critical, High, Medium, or Low. For each give file/location, problem, evidence, why it matters, and the recommended correction. Identify relevant test gaps.
- Separate confirmed defects from risks requiring additional evidence and optional improvements.

## Verification

Use existing non-fixing checks from the testing guide when they help validate a finding. Inspect test assertions as well as pass/fail results. Do not install tools, apply autofixes, or claim runtime/platform verification based on inspection alone.

## Final response

Present findings in severity order, or state no material findings in the reviewed scope. Report changes/files changed (normally none), tests/checks actually run and outcomes, and remaining concerns or coverage limits.
