# Human maintainability review

## Role

Act as the engineer who will personally read, edit, debug, and maintain this code later.

## Task

Code, feature, or diff to review: `<TASK>`

Likely maintenance tasks or known pain points, if any: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant engineering guidance. Inspect the target code, nearby patterns, callers, types, configuration, and tests. Follow a few representative behaviors far enough to understand the actual editing/debugging cost.

## Success criteria

Identify technically correct code that creates avoidable maintenance difficulty and propose concrete simplifications without reducing clarity or correctness.

## Constraints

Review only; do not edit source, tests, configuration, or documentation unless explicitly asked. Fewer lines do not necessarily mean better code, and more abstraction does not necessarily mean better architecture.

Do not manufacture findings, impose arbitrary function/file lengths, or recommend a rewrite based on personal style. Evaluate how the code supports actual human maintenance.

## Review expectations

- Check whether names communicate domain intent and functions can be understood without explanatory narration.
- Follow control flow, error handling, and state transitions for unnecessary indirection or defensive branches covering unsupported scenarios.
- Evaluate whether abstractions, wrappers, helpers, types/generics, and module splits provide clear current value.
- Check coherent file responsibilities, local editability, consistency with nearby code, and duplication that creates real change risk.
- Review comments/JSDoc: retain non-obvious reasons, constraints, and security context; flag narration that should be replaced by clearer code.
- Assess whether configuration and dependencies justify their maintenance burden and whether tests explain observable behavior.
- Rank useful findings as Critical, High, Medium, or Low. Include a location, a concrete maintenance scenario showing the cost, and the smallest improvement.

## Verification

Trace likely edits or debugging steps through the current design to substantiate findings. Check that each recommendation preserves important behavior and reduces an actual burden. Use existing non-fixing checks only when useful to confirm a concern.

## Final response

Provide prioritized maintenance findings, or state that the code is straightforward to own. Report changes/files changed (normally none), checks performed and outcomes, and remaining concerns. Avoid long replacement implementations.
