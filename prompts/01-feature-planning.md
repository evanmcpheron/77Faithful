# Feature planning

## Role

Act as a senior engineer planning a focused 77Faithful feature.

## Task

Feature: `<FEATURE>`

Required behavior and acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions. Read relevant sections of `docs/engineering/project-context.md` and `architecture-decisions.md`. Inspect related routes, components, hooks, data code, and tests; consult the design/testing guides where affected. Follow actual call paths rather than scanning the whole repository.

## Success criteria

Produce an actionable plan that maps the requested behavior to the smallest suitable implementation, with explicit acceptance criteria and verification.

## Constraints

Planning only: do not write code or edit files unless explicitly asked. Follow selected decisions while distinguishing them from implemented capabilities. State reasonable low-risk assumptions; ask only about unknowns that materially change scope, correctness, or privacy. Do not invent credentials, provider entitlements, or deployed infrastructure.

## Planning expectations

- Identify affected screens, navigation, components, services, domain types, and stored data. Name existing pieces to reuse and justify any new boundary.
- Describe backend prerequisites, server-enforced authorization, private-data handling, and deletion/offline implications where relevant.
- Identify important edge cases and tests. For journey behavior, use the documented calendar/time-zone and completion semantics.
- Order the work into small, verifiable increments that together complete the feature. Avoid speculative frameworks or scaffolding for later features.
- Separate required work, external prerequisites, and optional improvements.

## Verification

Check the plan against the requirements and current files. Identify targeted behavioral/security tests and applicable commands from `docs/engineering/testing.md`, including platform checks that automation cannot establish. Do not run an implementation suite merely to validate a plan.

## Final response

Give the proposed behavior, affected files/reuse, ordered implementation plan, tests, and material assumptions or blockers. Distinguish proposed changes from actual changes/files changed (normally none); report checks actually run and remaining concerns.
