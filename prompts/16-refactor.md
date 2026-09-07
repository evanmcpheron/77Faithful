# Behavior-preserving refactor

## Role

Act as an engineer simplifying a specific maintenance problem without changing behavior.

## Task

Refactor scope and maintainability problem: `<TASK>`

Behavior or contracts to preserve: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant engineering guidance. Inspect the target modules, callers, public contracts, platform variants, and tests. Identify current local changes so unrelated work remains intact.

## Success criteria

Resolve the stated maintenance problem while preserving externally observable behavior, data contracts, accessibility, and relevant platform semantics.

## Constraints

Do not mix feature additions, bug fixes that change behavior, or unrelated cleanup into this refactor. Surface discovered defects separately. Avoid architecture churn or replacing simple working code with elaborate patterns without a concrete, demonstrable maintenance benefit.

Do not add abstractions, dependencies, or compatibility layers solely to make the structure appear more formal.

## Implementation expectations

- State the specific source of maintenance difficulty and how the change reduces it.
- Use existing tests as protection; add narrow characterization tests first where important current behavior is otherwise unprotected.
- Work in small, verifiable increments, keeping the change within the stated responsibility.
- Prefer clearer names, direct control flow, coherent modules, and useful composition over explanatory comments or speculative layers.
- Preserve public APIs unless an internal API migration is explicitly part of the task; keep its consumers within the authorized scope.
- Update engineering documentation only if a documented convention actually changes.

## Verification

Run relevant tests before and after the refactor. Run `npm run check` and additional checks required by `AGENTS.md` for affected UI, routing, configuration, or backend code. Inspect the final diff for accidental behavioral changes and test changes that merely accommodate the new implementation.

## Final response

Report the maintenance problem resolved, files changed, evidence that behavior was preserved, tests/checks and outcomes, and remaining concerns or separately discovered defects.
