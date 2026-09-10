# 02. Component taxonomy

## Categories

| Category              | Folder                                                    | Owns                                                |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| UI primitives         | `src/components/ui`                                       | Basic visual building blocks                        |
| Form components       | `src/components/form`                                     | Field rendering and validation display              |
| Layout components     | `src/components/layout`                                   | Safe area, keyboard, scroll/list, section structure |
| Navigation components | `src/components/navigation` or existing layout navigation | Tabs, date strips, header navigation                |
| Feedback              | `src/components/feedback`                                 | Toasts, alerts, modals, sheets, state cards         |
| Data display          | `src/components/data-display`                             | Stats, tables, generic rows, summaries              |
| Media                 | `src/components/media`                                    | Image display, upload UI, viewers                   |
| Domain                | `src/features/<feature>/components`                       | Business-specific composition                       |
| Screen-local          | beside the screen                                         | One-off screen-only UI                              |

## Placement rules

Generic reusable primitives go in `src/components/ui`.

Generic form controls go in `src/components/form`.

Generic layout goes in `src/components/layout`.

Generic overlays go in `src/components/feedback`.

Generic image components go in `src/components/media`.

Domain components stay feature-local by default:

```txt
src/features/properties/components/property-card.component.tsx
src/features/jobs/components/job-card.component.tsx
src/features/company/components/team-member-row.component.tsx
```

Use `src/components/domain` only when cross-feature reuse is proven.

## Do not componentize

- one-off text lines
- one-off wrapper views
- one-off table columns
- every icon/color pair
- every card footer
- every `Spacer` sequence

Extract only when reuse or readability is clearly improved.
