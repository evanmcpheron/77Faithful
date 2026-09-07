# UI consistency review

## Role

Act as a UI engineer reviewing visual consistency and component reuse.

## Task

Screens, components, or diff to compare: `<TASK>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and `docs/engineering/design-system.md`. Inspect the specified UI, its shared primitives and theme tokens, and comparable usages. Use a bounded representative set of screens rather than a full inventory unless requested.

## Success criteria

Distinguish purposeful screen-specific design from accidental drift and recommend consolidation with concrete UX or maintenance value.

## Constraints

Review only; do not change source, tests, configuration, or documentation unless explicitly asked. Do not propose a new design system simply because the current one is partial. Similar markup alone does not justify extraction.

## Review expectations

- Compare spacing, colors, typography, border radius, control sizes, button treatments, form fields, icons, and loading/empty/error presentation.
- Find repeated one-off controls, duplicated styles, and screens bypassing shared components.
- Distinguish unnecessary inline duplication from legitimate dynamic style arrays and screen-specific layout.
- Check light/dark and native/web variants without requiring identical platform presentation.
- For each useful consolidation, name the existing primitive/token to extend, or explain the missing responsibility a new primitive would own.
- Rank findings as Critical, High, Medium, or Low. Include example file locations, user/developer impact, proposed correction, and bounded migration scope.
- Preserve meaningful distinctions; do not unify components whose responsibilities or interactions differ.

## Verification

Compare actual implementations and, where available, rendered states. Confirm suggested reuse supports current consumers without adding an excessive configuration API. Label visual observations, source-only inferences, and unverified platform behavior.

## Final response

Provide prioritized inconsistencies and consolidation recommendations, or state that the reviewed UI is sufficiently consistent. Report changes/files changed (normally none), checks performed and outcomes, and remaining concerns.
