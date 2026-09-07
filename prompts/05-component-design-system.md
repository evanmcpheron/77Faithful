# Component and design-system work

## Role

Act as a React Native engineer creating or improving a reusable UI primitive.

## Task

Component or design-system problem: `<TASK>`

Required behavior and any explicitly included usage migrations: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and `docs/engineering/design-system.md`. Inspect current usages, similar components, shared tokens, and relevant tests before proposing an API. Determine whether an existing primitive can serve the need.

## Success criteria

Deliver a focused primitive with an understandable typed API, consistent visuals, accessible behavior, and clear value for its current consumers.

## Constraints

Prefer composition and a small set of meaningful variants over dozens of boolean props or a configurable “do everything” component. Reuse native props where useful without exposing implementation details. Avoid wrappers that only rename another component.

Migrate existing usages only when migration is explicitly in scope. Otherwise preserve supported behavior for current consumers and identify any proposed migration separately. Do not build an entire component suite for one missing primitive.

## Implementation expectations

- Define the responsibility and needed states from actual use cases; choose names that describe purpose.
- Use existing theme, typography, spacing, and sizing conventions. Add missing shared tokens only when justified by this component's needs.
- Preserve accessibility props, labels, roles, focus, text scaling, press feedback, and relevant keyboard/platform behavior.
- Keep static styles colocated and dynamic styles explicit. Document only non-obvious API constraints; use a test or real scoped usage to demonstrate ordinary behavior.
- Update the design-system inventory when the shared contract or token system changes.

## Verification

Add behavioral tests for interactions, important variants, accessibility, and changed contracts where meaningful. Check existing consumers for regressions without migrating them. Run `npm run check`, plus `npm run export:web` for shared UI changes under `AGENTS.md`; verify relevant native/theme behavior when available.

## Final response

Report the component/API change, files changed, explicitly scoped migrations, tests/checks and outcomes, and remaining concerns.
