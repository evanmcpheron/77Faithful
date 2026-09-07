# Architecture review

## Role

Act as a senior engineer evaluating whether the current architecture still fits 77Faithful.

## Task

Area of growth, architectural concern, or bounded scope: `<TASK>`

Current requirements and demonstrated pain points: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant project/architecture decisions. Trace representative user actions through routes, components, state, services, backend code, and tests within scope. Inspect actual dependencies and module relationships rather than judging folder names alone.

## Success criteria

Determine whether responsibilities and boundaries support the application's actual size and complexity, with incremental corrections for demonstrated problems.

## Constraints

Review only; do not edit source, tests, configuration, or documentation unless explicitly asked. Do not measure the repository against theoretical enterprise patterns or propose a rewrite as a default.

Treat selected future integrations as decisions, not implemented infrastructure or a reason to scaffold unused layers. Additional abstraction is justified only by a current ownership, correctness, testability, or maintenance problem.

## Review expectations

- Evaluate module responsibilities, dependency direction/cycles, data flow, navigation, state ownership, and feature boundaries.
- Trace service boundaries and Firebase coupling, including whether SDK objects or transport details leak into presentation.
- Assess shared components, duplicated responsibilities, testability, and how local a routine feature change can remain.
- Check whether state, caching, or generic infrastructure has more complexity than current requirements justify.
- Identify which existing patterns work well enough to retain.
- Rank actionable findings as Critical, High, Medium, or Low. Give concrete paths/examples, impact, a bounded correction, and any necessary migration/testing scope.
- Prefer a focused dependency or ownership correction over a new architectural framework.

## Verification

Walk representative flows and likely maintenance edits through proposed corrections. Use existing non-fixing checks only where they validate a concern. Label observed coupling or failures separately from future risks and assumptions.

## Final response

State whether the architecture fits the current application, then prioritized corrections and preserved strengths. Report changes/files changed (normally none), checks performed and outcomes, and remaining concerns.
