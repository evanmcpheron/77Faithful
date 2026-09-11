# 03. Layout system

## Core rule

Each screen should have one scroll owner:

- `StaticScreen`
- `ScrollScreen`
- `ListScreen`

Do not nest vertical `ScrollView` inside vertical `ScrollView`.

## Existing base

Keep `Screen` as the base. It already handles:

- safe area
- keyboard avoiding behavior
- static/scroll/list modes
- FlashList list mode
- loading/error/empty branches
- bottom navigation spacing

## Recommended screen anatomy

```txt
Screen
  ScreenHeader or DashboardHeader
  Search/filter/status controls
  Content sections or list
  StickyFooter/FloatingActionButton when needed
```

## List screens

Use `ListHeaderComponent` for headers/search/stats.

```tsx
<ListScreen
	data={properties}
	renderItem={renderProperty}
	keyExtractor={getPropertyKey}
	estimatedItemSize={220}
	ListHeaderComponent={propertyListHeader}
/>
```

## Forms

Use `ScrollScreen` and keep footer actions reachable.

```txt
ScrollScreen
  ScreenHeader
  FormSection
  FormSection
  StickyFooter
```

## Nested scroll examples

Bad:

```tsx
<ScrollScreen>
	<FlashList
		data={jobs}
		renderItem={renderJob}
	/>
</ScrollScreen>
```

Better:

```tsx
<ListScreen
	data={jobs}
	renderItem={renderJob}
/>
```

## Layout build priority

1. `Stack`
2. `Inline`
3. `Section`
4. `SectionHeader`
5. `ScrollScreen`
6. `ListScreen`
7. `StickyFooter`
8. `SplitActionFooter`
9. `AuthShell`
10. `DashboardHeader`
