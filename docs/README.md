# Turndown component library implementation guide

This directory is the implementation guide for the Turndown Expo React Native
component library.

## Use this guide in this order

1. Read `00-current-codebase-audit.md`.
2. Stabilize design tokens from `01-design-system-foundation.md`.
3. Build layout and form foundations before domain components.
4. Use the relevant docs under `components/` when implementing each component.
5. Use `patterns/` docs while composing screens.
6. Track implementation using `implementation/suggested-build-order.md` and
   `14-component-acceptance-checklists.md`.

## Rules this guide assumes

- React Native + Expo + Expo Router.
- Strict TypeScript.
- Named exports.
- `*.component.tsx`, `*.types.ts`, `*.styles.ts`, `*.hook.ts`, `*.utils.ts`.
- `styled-components/native`.
- No new `StyleSheet.create`.
- Theme tokens for colors, spacing, typography, radius, shadows, and layout
  constants.
- Styling-only props filtered with `withFilteredProps`.
- No `any`.
- Interfaces use `I` prefix.
- Type aliases use `T` prefix.
- Const object unions instead of TypeScript enums.
- No new barrel exports.
- Route files stay thin.
- Shared UI lives in `src/components`.
- Domain UI lives in feature folders unless cross-feature reuse is proven.
- Avoid nested scroll views.
- Prefer FlashList for large lists.
- Treat the custom bottom navigation as fragile.

## Status language

| Status                                  | Meaning                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Existing                                | Keep and use as-is unless a scoped bug is found.                              |
| Existing but should be extended         | Keep, then add missing behavior deliberately.                                 |
| Existing placeholder should be replaced | A file exists but is empty/placeholder and should be implemented when needed. |
| New                                     | Build when a real screen needs it.                                            |
| Future / not needed yet                 | Do not build until a repeated need appears.                                   |

## Directory map

```txt
docs/component-library/
  README.md
  00-current-codebase-audit.md
  01-design-system-foundation.md
  02-component-taxonomy.md
  03-layout-system.md
  04-form-system.md
  05-feedback-and-overlays.md
  06-navigation-system.md
  07-data-display-system.md
  08-media-system.md
  09-domain-components.md
  10-screen-composition-patterns.md
  11-accessibility-guidelines.md
  12-testing-guidelines.md
  13-implementation-roadmap.md
  14-component-acceptance-checklists.md
  components/
  patterns/
  implementation/
```

## Recommended implementation folders

```txt
src/components/ui
src/components/form
src/components/layout
src/components/feedback
src/components/media
src/components/data-display
src/components/navigation
src/features/<feature>/components
src/features/<feature>/forms
src/features/<feature>/screens
```
