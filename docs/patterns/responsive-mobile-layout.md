# Responsive mobile layout

The screenshots are phone-first. Build for small screens first, then allow safe
scaling for larger devices.

## Screen padding

Use a small set of layout tokens.

```ts
export const Layout = {
	ScreenHorizontalPadding: 16,
	ScreenVerticalPadding: 16,
	BottomNavigationHeight: 76,
	HeaderHeight: 265,
} as const;
```

Use existing `Spacing` and `Radius` tokens instead of hard-coded values.

## Visual hierarchy

A typical screen should read in this order:

1. Header/title/context
2. Primary summary card or stats
3. Search/filter controls
4. Main list/form content
5. Primary action

Avoid putting too many cards above the main task. The property and job
screenshots are already dense.

## Card density

| Density     | Use case                    | Guidance                                                                          |
| ----------- | --------------------------- | --------------------------------------------------------------------------------- |
| Comfortable | forms, auth cards, settings | larger padding, more vertical spacing                                             |
| Standard    | property/job cards          | balanced padding, clear groups                                                    |
| Compact     | tables, metric rows, chips  | tight but readable; do not go below accessible touch targets for interactive rows |

Do not solve density by shrinking text below readable sizes.

## Touch targets

Interactive controls should generally be at least 44px high. Icon-only buttons
need a tappable container even when the icon is small.

## Header patterns

Use specific header components instead of one overloaded header:

- `AuthShell` for sign in/sign up
- `DashboardHeader` for owner/provider dashboards
- `ScreenHeader` for standard form/detail screens
- `HeroHeader` for property details with large imagery

## Button placement

- Main screen creation actions can be a bottom primary button or floating action
  button.
- Form save actions should sit at the bottom and be full-width where
  appropriate.
- Secondary actions should be outline/ghost and visually below the primary
  action.
- Destructive actions should be separated and confirmed.

## Grid behavior

Use `MetricGrid` for 2-column stat cards on phones. Avoid 3-column grids unless
each item is very compact and readable.

```tsx
<MetricGrid columns={2}>
	<StatCard
		label='Total Jobs'
		value='20'
	/>
	<StatCard
		label='Pending'
		value='08'
	/>
</MetricGrid>
```

## Modals on small screens

- Centered cards should remain short.
- Bottom sheets should handle longer content.
- Full-screen forms are better for complex creation flows.
- Avoid nested scrolling inside small modal cards.

## Typography

- Titles should be distinct but not oversized.
- Secondary text should remain readable.
- Use muted color and weight before reducing size too aggressively.
- Avoid long all-caps labels.

## Shadows

Use shadows sparingly:

- cards over white backgrounds: subtle shadow or border, not both heavily
- bottom navigation: controlled shadow because it floats over content
- modals: stronger elevation is acceptable
- dense lists: prefer borders/dividers over heavy shadows

Do not put strong shadows on every small chip or row.

## Review checklist

- [ ] The pattern follows existing project naming and folder conventions.
- [ ] No new `StyleSheet.create` was introduced.
- [ ] Styling-only props are filtered before reaching React Native primitives.
- [ ] Static visual values come from theme tokens.
- [ ] No `any` was added.
- [ ] Accessibility role, label, and state are covered where relevant.
- [ ] The implementation avoids nested scroll containers.
- [ ] The solution is practical and not more abstract than the current screens
      need.
