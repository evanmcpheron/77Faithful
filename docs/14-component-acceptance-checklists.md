# 14. Component acceptance checklists

## General

- [ ] Named export.
- [ ] Correct file suffixes.
- [ ] Props interface uses `I<ComponentName>Props`.
- [ ] Type aliases use `T` prefix.
- [ ] Variants use const object unions.
- [ ] No `any`.
- [ ] No new barrel export.
- [ ] No new `StyleSheet.create`.
- [ ] Static styles in `*.styles.ts`.
- [ ] Theme tokens used.
- [ ] Styling-only props filtered.
- [ ] No static inline styles.
- [ ] Accessibility role/label/state handled.
- [ ] Touch target at least 44x44 where interactive.
- [ ] Parent owns navigation.
- [ ] Component does not fetch data unless explicitly a feature boundary.

## Forms

- [ ] Controlled value.
- [ ] Error/helper text.
- [ ] Disabled state.
- [ ] Correct keyboard type.
- [ ] No hidden API submit.
- [ ] Double submit prevented.

## Layout

- [ ] One scroll owner.
- [ ] Safe area respected.
- [ ] Keyboard behavior works.
- [ ] Bottom nav spacing centralized.
- [ ] Sticky footer reachable.

## Overlays

- [ ] Controlled `visible`.
- [ ] Explicit close behavior.
- [ ] Close button label.
- [ ] Safe-area bottom.
- [ ] Sticky actions if content scrolls.

## Domain

- [ ] Receives data and callbacks.
- [ ] Does not expose every child prop.
- [ ] Uses shared primitives.
- [ ] Uses `@turndown/library` types where available.
- [ ] Preserves business boundaries.

## Checklist-specific

- [ ] Room customization does not mutate template by default.
- [ ] Prompt explains scope.
- [ ] Template edit is separate from room edit.

## Job-specific

- [ ] Internal member and external provider assignment are distinct.
- [ ] Provider workers are not owner team members.
- [ ] External provider can assign internally later.

## Inventory-specific

- [ ] Inventory belongs to room by default.
- [ ] Property views aggregate room inventory.
