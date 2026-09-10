# List and scroll handling

Nested scrolling is a known Turndown mobile pain point. Treat scroll ownership
as an architectural decision, not a styling detail.

## Primary rule

Each screen should have exactly one vertical scroll owner.

| Screen type                 | Scroll owner                                        |
| --------------------------- | --------------------------------------------------- |
| Short static content        | `StaticScreen` or `Screen` static mode              |
| Forms and detail pages      | `ScrollScreen` or `Screen` scroll mode              |
| Large lists                 | `ListScreen` or `Screen` list mode with `FlashList` |
| Tabs with independent lists | parent is static; active tab panel owns its list    |

## Existing foundation

The current `Screen` component already supports static, scroll, and list modes
with safe area, keyboard behavior, loading/error/empty states, and FlashList
support. Keep extending that component instead of creating duplicate screen
shells.

## Do not nest vertical scroll containers

Avoid:

```tsx
<ScrollScreen>
	<FlashList
		data={jobs}
		renderItem={renderJob}
	/>
</ScrollScreen>
```

Prefer:

```tsx
<ListScreen
	data={jobs}
	renderItem={renderJob}
	ListHeaderComponent={jobsHeader}
/>
```

Or use the existing `Screen` list mode.

## Tabs and lists

For screens with tabs and lists:

1. The outer screen should be static.
2. The tab header should not be inside a scrollable parent when the tab content
   is a list.
3. The active tab panel owns the list.
4. Use `ListHeaderComponent` for tab-local summaries and filters.

## FlashList rules

Use FlashList for property lists, job lists, checklist template lists, team
member lists, inventory tables when rows can grow, and activity feeds.

Use simple mapped rows only for small static sections under roughly 10 rows.

## List item sizing

- Use stable row/card heights when practical.
- Avoid measuring every item unless the layout truly varies.
- Keep card image dimensions consistent.
- Put large thumbnails behind `AppImage`/`ImageThumbnail` with explicit
  width/height.

## Search and filtering layout

Use this order:

1. Screen header / dashboard header
2. Summary stats
3. Search input
4. Filter row or filter button
5. List content
6. Primary action footer or floating action button

Filters should not push primary content too far down. Use compact chips or a
filter bottom sheet for complex filters.

## Pull to refresh

List screens should expose refresh state explicitly:

```ts
export interface IListScreenProps<TItem> {
	data: TItem[];
	isRefreshing?: boolean;
	onRefresh?: () => void;
	renderItem: ListRenderItem<TItem>;
}
```

Do not make cards refetch themselves.

## Empty list behavior

Use `EmptyStateCard` inside the list empty component.

Examples:

- Properties: “No properties yet” + “Add Property”
- Jobs: “No jobs scheduled” + “New Job”
- Team: “No team members yet” + “Invite Team Member”
- Checklists: “No checklist templates yet” + “New Checklist”

## Footer spacing with bottom navigation

List and scroll content must account for bottom navigation height. Prefer a
`contentContainerStyle` or internal `Screen` prop that adds bottom padding using
`Layout.BottomNavigationHeight` once available.

Do not hard-code random bottom padding in individual screens.

## Horizontal scrolling

Horizontal date strips and chip rows may scroll horizontally inside a vertical
screen because the axes differ.

Rules:

- Keep horizontal rows shallow.
- Do not put large vertical content inside horizontal scroll rows.
- Use accessible labels for date buttons and chips.

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
