# 00. Current codebase audit

## Summary

The uploaded mobile codebase already has a workable foundation:

- Reusable UI exists under `src/components/ui`.
- Form components exist under `src/components/form`.
- Layout components exist under `src/components/layout`.
- `Screen` already handles safe area, keyboard behavior, static/scroll/list
  modes, loading/error/empty branches, and FlashList list mode.
- The bottom navigation exists and is animation-heavy. Treat it as fragile.
- Theme files exist for colors, spacing, typography, radius, shadows, and
  layout.
- Several feature files are empty placeholders and should not be treated as
  complete reusable components.

## Existing reusable component audit

| Area                            | Path                                                                  |            Status | Reason                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------- | ----------------: | --------------------------------------------------------------------------------------------------------------- |
| Button                          | `src/components/ui/button`                                            |            Extend | `TurndownButton` exists and matches the design direction. Add loading/accessibility/icon behavior deliberately. |
| Card                            | `src/components/ui/card`                                              |            Extend | Current card is useful but too minimal for repeated card variants.                                              |
| Divider                         | `src/components/ui/divider`                                           |            Extend | Good primitive; add orientation/inset only if needed.                                                           |
| Icon                            | `src/components/ui/icon`                                              |          Refactor | Icon registry is useful. Move interactive behavior to `IconButton`.                                             |
| Spacer                          | `src/components/ui/spacer`                                            |              Keep | Useful for simple spacing. Prefer `Stack`/`Inline` for structured layouts.                                      |
| Typography                      | `src/components/ui/typography`                                        |            Extend | Good primitive. Add pass-through props such as `numberOfLines` only when needed.                                |
| Checkbox                        | `src/components/form/checkbox`                                        |            Extend | Convert to controlled `value` for real forms.                                                                   |
| Dropdown                        | `src/components/form/dropdown`                                        |            Extend | Keep the viewport-aware menu behavior. Split utils only when maintenance becomes difficult.                     |
| Input                           | `src/components/form/input`                                           |            Extend | Add error/helper/disabled and move label ownership to `FieldContainer`.                                         |
| Navigation                      | `src/components/layout/navigation`                                    | Keep with caution | Existing custom nav should remain isolated. Avoid animation or route changes unless scoped.                     |
| Screen                          | `src/components/layout/screen`                                        |     Keep / Extend | This should remain the core screen primitive. Add wrappers only for readability.                                |
| Tabs                            | `src/components/layout/tabs`                                          |     Keep / Extend | Compound pattern is acceptable. Add controlled mode only if needed.                                             |
| Auth screens                    | `src/features/auth/screens`                                           |          Refactor | Extract `AuthShell`; remove inline static layout styles; move forms out of screen files.                        |
| Auth forms/components           | `src/features/auth/forms`, `src/features/auth/components`             |           Replace | Several files are empty. Build real forms when auth is implemented.                                             |
| Property components/forms/hooks | `src/features/properties/**`                                          |           Replace | Mostly empty placeholders. Build from the component docs.                                                       |
| Dashboard/jobs/team screens     | `src/features/dashboard`, `src/features/jobs`, `src/features/company` |  Replace / Extend | Dashboard has minimal content. Jobs/team are placeholders.                                                      |
| Settings screen                 | `src/features/settings/screens/settings.screen.tsx`                   |            Extend | Uses `Screen` and button. Replace future settings rows with `ActionRow`.                                        |
| Theme                           | `src/theme/*`                                                         |            Extend | Add `icon-sizes.ts` and `z-index.ts` only when needed. Expand layout constants gradually.                       |
| Providers                       | `src/providers/auth`                                                  |     Keep / Extend | Keep provider state narrow and memoized.                                                                        |
| Services                        | `src/services/api`, `src/services/auth`                               |              Keep | Correct boundary for API/auth concerns.                                                                         |
| Utilities                       | `src/utils/**`                                                        |     Keep / Extend | Keep `withFilteredProps` and pure utility tests.                                                                |

## Current issues to address during implementation

1. `AppIcon` currently accepts press behavior. Use `IconButton` for interactive
   icons.
2. `Checkbox` should become controlled.
3. `Input` should compose `FieldContainer`.
4. Inline row styles in auth/register should move to `Inline` or screen styles.
5. Existing empty feature files should be replaced or removed when implementing
   real screens.
6. Do not add more barrel exports.
7. `Layout` needs more constants only when actual components use them.

## Screenshot pattern map

| Screen group         | Reusable patterns                                                | Classification                          |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| Onboarding/auth      | Brand header, rounded body panel, segmented tabs, social buttons | Layout + form + UI primitives           |
| Sign in/sign up      | Text fields, password toggle, checkbox, divider row              | Form + UI primitives                    |
| Property list        | Header, search, stats, property cards, bottom nav                | Layout + data display + property domain |
| Property create/edit | Hero image, grouped fields, sticky save, member modal            | Forms + layout + feedback               |
| Property details     | Hero, stats, action cards, room/job summaries                    | Domain + data display + media           |
| Add room             | Room form, inventory, checklist assignment                       | Room + inventory + checklist domain     |
| Checklist standards  | Search/filter, checklist rows, customize prompt                  | Checklist + feedback                    |
| Jobs list            | Date strip, segments, filters, job cards                         | Job + navigation + data display         |
| Job creation         | Date/time/property/room/member/severity fields                   | Job form + form system                  |
| Assign job modal     | Internal/external radio, assignee list                           | Feedback + company/team domain          |
| Track job status     | Job header, execution table, pending, damage, shortage           | Job + checklist + inventory/damage      |
| Team list            | Stats, search/filter, table/list rows, invite CTA                | Company/team + data display             |
| Inventory            | Room-specific item rows and shortage indicators                  | Inventory domain                        |
| Damage reports       | Cards, forms, proof viewer, status                               | Damage + media                          |
| Bottom navigation    | Animated custom tab bar                                          | Existing navigation system              |
| Modal/overlay states | Dimmed overlay, centered modal, bottom sheets                    | Feedback system                         |

## Strict decisions

- Do not create a generic mega-card.
- Do not turn every repeated visual into a domain component if `ListItem`,
  `KeyValueRow`, or `DataTable` is enough.
- Domain components should not expose every `Card`, `Typography`, or `Image`
  prop.
- `MultiSelectDropdown` is future-only because `Dropdown` already supports
  `multiSelect`.
- Inventory is room-specific by default.
- Provider company workers must not be flattened into the owner company team.

## Self-Review Results

1. Every screenshot pattern is mapped to a component, screen-local pattern, or
   documented non-component.
2. Existing components are reused where practical.
3. Overengineering was avoided by marking wrappers future-only when the existing
   component is enough.
4. Every proposed component has clear ownership in the component docs.
5. Suggested props avoid `any`.
6. File/folder naming follows the project conventions.
7. Component boundaries are explicit.
8. Template vs room checklist behavior is documented.
9. Job assignment company boundaries are documented.
10. Inventory ownership is documented as room-specific.
