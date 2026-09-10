# Screen and Route Implementation Patterns

> **Audience:** AI coding agents working in this React Native / Expo Router codebase.
>
> **Purpose:** Define the canonical structure for adding or changing application screens and routes. This document is intentionally product- and brand-neutral. It describes implementation structure, navigation behavior, screen composition, and file responsibilities.
>
> Some existing code identifiers contain project-specific prefixes. Treat those names only as code APIs that already exist; do not infer visual, product, or brand requirements from them.

---

## 1. Core Principle

A **route is not a screen implementation**.

The codebase separates navigation from feature UI:

- Files under the root `app/` directory define Expo Router addresses, route groups, layouts, redirects, stack configuration, tab configuration, and navigation guards.
- Files under `src/features/**/screens/` implement the actual screen UI and screen-level behavior.
- Feature-specific reusable UI belongs under `src/features/<feature>/components/`.
- Forms belong under `src/features/<feature>/forms/`.
- Reusable application-wide components belong under `src/components/`.
- Data access belongs in services, hooks, providers, or other existing data-layer modules rather than inside route files.
- Screen-specific styled components belong in a sibling `*.styles.ts` or `*.styles.tsx` file when styling is substantial enough to justify extraction.

The normal dependency direction is:

```text
Expo Router route
    -> feature screen
        -> feature forms/components
        -> shared component library
        -> hooks/providers/services
```

Do not reverse this relationship. Feature screens should not be imported into shared primitives, and route files should not become general-purpose application modules.

---

## 2. Canonical Directory Structure

Use the existing root-level `app/` directory for routes. Do not create a parallel `src/app/` route tree unless the entire project is intentionally migrated to that structure.

A typical feature should resemble:

```text
app/
  (app)/
    (<navigation-scope>)/
      _layout.tsx
      <feature>/
        _layout.tsx
        index.tsx
        create.tsx
        [entityId].tsx
        [entityId]/
          edit.tsx

src/
  features/
    <feature>/
      screens/
        <feature>.screen.tsx
        <feature>.styles.ts
        create-<entity>.screen.tsx
        create-<entity>.styles.ts
        <entity>-details.screen.tsx
        <entity>-details.styles.ts
        edit-<entity>.screen.tsx
        edit-<entity>.styles.ts
      components/
        ...
      forms/
        ...
      <feature>.types.ts
      <feature>.constants.ts
```

Not every feature needs every directory. Add only what the feature requires.

### Naming conventions

Use kebab-case filenames and explicit suffixes:

```text
<name>.screen.tsx
<name>.styles.ts
<name>.component.tsx
<name>.types.ts
<name>.form.tsx
<name>.hook.ts
<name>.service.ts
```

Feature screens use **named exports**. Expo Router route files use a **default export**.

---

## 3. Route Files Must Stay Thin

For a normal route, the file under `app/` should do little more than import and render the corresponding feature screen.

Canonical pattern:

```tsx
import { ExampleScreen } from '@td/features/example/screens/example.screen';

const ExampleRoute = () => {
	return <ExampleScreen />;
};

export default ExampleRoute;
```

Dynamic routes use the same pattern:

```tsx
import { ExampleDetailsScreen } from '@td/features/example/screens/example-details.screen';

const ExampleDetailsRoute = () => {
	return <ExampleDetailsScreen />;
};

export default ExampleDetailsRoute;
```

The route file does **not** need to read `[entityId]` merely because the filename contains a dynamic segment. The feature screen can read the parameter when it owns the data-loading behavior.

### Route files should not contain

- Feature UI markup.
- API or database calls.
- Form state.
- Business rules.
- Screen-specific `useEffect` logic.
- Large event handlers.
- Styled components.
- Theme decisions.
- Reimplementations of the shared screen shell.

### Legitimate route-level exceptions

There are a few valid exceptions:

1. Root entry routes may perform session/bootstrap routing and show a short-lived splash/loading surface while application state initializes.
2. Redirect-only index routes may return `<Redirect />` to select a default child route.
3. Route `_layout.tsx` files intentionally contain navigation structure, guards, providers required by navigation chrome, and screen options.
4. Highly specialized route-level shells such as authentication layouts may render `<Slot />` inside a shared shell when every child route uses that same structure.

Do not use these exceptions as justification for putting normal screen implementations in `app/`.

---

## 4. Expo Router Route Semantics

The route tree follows standard Expo Router file-based routing.

| File or directory | Meaning |
| --- | --- |
| `index.tsx` | The route for its containing directory. |
| `[entityId].tsx` | A dynamic route segment. |
| `[entityId]/index.tsx` | A dynamic route with nested child files available beneath it. |
| `_layout.tsx` | Navigation/layout boundary for sibling and child routes. |
| `(group)` | Organizational/navigation group that does not add the group name to the public route path. |

Use route groups to organize navigation scopes, authentication state, roles, or other layout boundaries. Do not create route groups only for visual organization if they do not provide a useful navigation boundary.

---

## 5. What Belongs in `_layout.tsx`

A layout owns behavior shared by multiple routes in that navigation subtree.

Typical responsibilities are:

- Authentication or access guards.
- Bottom-tab composition.
- Stack composition.
- Shared native/header chrome.
- Header actions that are part of navigation chrome.
- Navigation-level providers such as `HeaderScrollProvider`.
- Shared `screenOptions`.
- Route-specific header configuration through `<Stack.Screen />`.

A layout should not own the feature's data-fetching or form behavior merely because several routes belong to the same feature.

---

## 6. Top-Level Application Layout Pattern

The root `app/_layout.tsx` is for application-wide infrastructure only.

Examples of appropriate responsibilities include:

- Global providers.
- Safe-area provider.
- Root gesture container.
- Global notification host.
- Root Expo Router stack.
- Font/bootstrap handling.
- Global splash-screen lifecycle.

Avoid feature-specific providers or feature-specific navigation decisions here unless they genuinely affect the entire application.

The root stack normally hides the default header because individual navigation subtrees provide their own chrome:

```tsx
<Stack
	screenOptions={{
		headerShown: false,
		headerBackVisible: false,
		animation: 'none',
	}}
/>
```

Use existing root options rather than creating competing global navigation styles.

---

## 7. Authentication and Access Guards

Guard access at the highest layout that cleanly covers the protected subtree.

Canonical pattern:

```tsx
import { Redirect, type Href } from 'expo-router';

import { TabsLayout } from '@td/components/layout/navigation/navigation.component';
import { useAuth } from '@td/providers/auth/auth.hook';

const ProtectedLayout = () => {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Redirect href={'/(auth)' as Href} />;
	}

	return <TabsLayout tabs={APP_TABS} />;
};

export default ProtectedLayout;
```

Do not repeat the same authentication redirect in every child screen. A screen may still enforce feature-specific authorization when that decision depends on resource data, but general signed-in/signed-out routing belongs at the layout boundary.

Use `<Redirect />` for declarative route selection and guards. Use `router.push`, `router.replace`, or `router.back` for user-driven navigation from an already rendered screen.

---

## 8. Bottom Tab Pattern

Bottom navigation is configured through the existing `TabsLayout` abstraction and a tab configuration array. Do not recreate the tab bar inside individual screens.

Generic layout:

```tsx
import { TabsLayout } from '@td/components/layout/navigation/navigation.component';
import { APP_TABS } from '@td/components/layout/navigation/navigation.utils';

const AppLayout = () => {
	return <TabsLayout tabs={APP_TABS} />;
};

export default AppLayout;
```

A tab configuration identifies the route name, visible label, and icon. When adding a real top-level tab, update the appropriate existing configuration instead of hard-coding a new button elsewhere.

### Important nested-route behavior

The custom tab bar determines whether the active tab is displaying its root route or a nested route. When a tab navigates from its `index` route into a nested detail/create/edit route, the bottom navigation is designed to hide.

Therefore:

- Put drill-down routes under the same tab stack when they conceptually belong to that tab.
- Do not add a detail route as a new tab merely to keep navigation working.
- Expect the bottom bar to remain on root tab screens and hide on nested screens.
- Do not manually hide or animate the tab bar from feature screens unless the navigation implementation is intentionally changed.

---

## 9. Section Stack + Shared Header Pattern

A tab section commonly owns its own stack layout. That layout wraps the stack with `HeaderScrollProvider` so the persistent top-row header and the scrollable screen content can react to the same scroll offset.

Canonical structure:

```tsx
import { Stack } from 'expo-router';

import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import type { IHeaderTopRowProps } from '@td/components/ui/main-header/components/header-top-row/header-top-row.types';
import { useHeaderScroll } from '@td/providers/header-scroll/header-scroll.hook';
import { HeaderScrollProvider } from '@td/providers/header-scroll/header-scroll.provider';
import { SurfaceColors } from '@td/theme/colors';

const ConnectedHeaderTopRow = (props: IHeaderTopRowProps) => {
	const { scrollOffset } = useHeaderScroll();

	return <HeaderTopRow {...props} scrollOffset={scrollOffset} />;
};

const ExampleLayout = () => {
	return (
		<HeaderScrollProvider>
			<Stack
				screenOptions={{
					headerBackVisible: false,
					headerShown: true,
					headerTransparent: true,
					headerShadowVisible: false,
					headerStyle: { backgroundColor: 'transparent' },
					contentStyle: { backgroundColor: SurfaceColors.Screen },
				}}
			>
				<Stack.Screen
					name='index'
					options={{
						header: () => (
							<ConnectedHeaderTopRow title='Example' />
						),
					}}
				/>
				<Stack.Screen
					name='[entityId]'
					options={{
						header: () => (
							<ConnectedHeaderTopRow
								title='Details'
								canGoBack
							/>
						),
					}}
				/>
			</Stack>
		</HeaderScrollProvider>
	);
};

export default ExampleLayout;
```

Keep the `ConnectedHeaderTopRow` adapter local to the layout unless the codebase later introduces a shared abstraction for it. Do not create a new abstraction solely to remove a small amount of repetition.

---

## 10. Header Architecture: Navigation Chrome vs. Scrollable Header

The application uses two related header layers with different responsibilities.

### `HeaderTopRow`

This is persistent navigation chrome configured by the stack layout. It may contain:

- Back navigation.
- Section title or icon.
- Logo/identity slot.
- Add or edit actions.
- Notification action.
- Search input when supported by the header API.

It receives the shared `scrollOffset` so its glass/blur/background behavior can react to screen scrolling.

### `MainHeader`

This is part of the screen's scrollable visual content. It is passed to the screen shell's `header` prop when the screen needs a hero/header surface.

Example:

```tsx
<TurndownScrollScreen
	scrollOffset={scrollOffset}
	header={() => (
		<MainHeader
			title='Example'
			description='Supporting description'
			scrollOffset={scrollOffset}
		/>
	)}
>
	{/* screen content */}
</TurndownScrollScreen>
```

The two layers are not interchangeable. Configure navigation actions and real back buttons in the stack header. Use the screen header for scrollable visual/hero content and layout behavior.

When `canGoBack` or gradient-related props are passed to `MainHeader`, they affect that component's visual/layout mode. The actual back interaction is provided by `HeaderTopRow` when `canGoBack` is enabled there.

---

## 11. Screen Shell Selection

All normal feature screens should start from one of the existing screen primitives rather than manually assembling safe areas, scrolling, keyboard handling, loading states, or list infrastructure.

| Screen type | Use | Typical cases |
| --- | --- | --- |
| `TurndownScrollScreen` | Default for vertically scrollable content | Detail screens, forms, dashboards, settings, mixed content |
| `TurndownListScreen` | Primary content is a repeated data collection | Searchable lists, feeds, resource indexes |
| `TurndownStaticScreen` | Content is intentionally fixed and guaranteed to fit | Small fixed layouts; use sparingly |

The current feature code predominantly uses `TurndownScrollScreen` and uses `TurndownListScreen` for data-heavy list screens. Prefer those established patterns.

### Do not manually add redundant infrastructure

When using a screen shell, do not wrap it with another `SafeAreaView`, `ScrollView`, `KeyboardAvoidingView`, or full-screen container unless a specific requirement cannot be satisfied by the screen API.

The screen component already handles:

- Safe-area edges.
- Keyboard avoidance.
- Scroll behavior.
- Scroll offset propagation.
- Default content padding/gap.
- Loading state.
- Error state.
- Empty state.
- List virtualization through the existing list implementation.

Avoid nested vertical scroll views.

---

## 12. Scroll Offset Pattern

Screens inside a header-aware stack should use the scroll value supplied by `HeaderScrollProvider`.

For screens that may lose and regain focus inside a stack, use `useScreenScrollOffset()`:

```tsx
const { scrollOffset, handleScrollPositionChange } =
	useScreenScrollOffset();

return (
	<TurndownScrollScreen
		scrollOffset={scrollOffset}
		onScrollPositionChange={handleScrollPositionChange}
	>
		{/* content */}
	</TurndownScrollScreen>
);
```

This pattern preserves the screen's last known scroll position for header state when the route regains focus.

For a simple root screen where focus restoration is not needed, existing code may read `scrollOffset` directly from `useHeaderScroll()`.

Do not create a separate `useSharedValue` for header scrolling inside each feature screen when the route already lives under `HeaderScrollProvider`.

---

## 13. Standard Scroll Screen Pattern

Use a feature screen for UI composition, data orchestration, and user interactions:

```tsx
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { MainHeader } from '@td/components/ui/main-header/main-header.component';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';

export const ExampleDetailsScreen = () => {
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();

	return (
		<TurndownScrollScreen
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			header={() => (
				<MainHeader
					scrollOffset={scrollOffset}
					hasGradientHeader
					canGoBack
				/>
			)}
		>
			{/* Compose existing reusable components here. */}
		</TurndownScrollScreen>
	);
};
```

Do not introduce a custom screen wrapper when the existing screen component already satisfies the requirement.

---

## 14. Standard List Screen Pattern

If the main body is a collection, use `TurndownListScreen` rather than rendering a large array inside a scroll screen.

```tsx
import { useEffect, useState } from 'react';

import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { EmptyState } from '@td/components/ui/empty-state/empty-state.component';
import { MainHeader } from '@td/components/ui/main-header/main-header.component';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';

interface IExampleItem {
	id: string;
	name: string;
}

export const ExampleListScreen = () => {
	const [items, setItems] = useState<IExampleItem[]>();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();

	useEffect(() => {
		const loadItems = async () => {
			const response = await exampleService.getItems();
			setItems(response);
		};

		void loadItems();
	}, []);

	const isLoaded = items !== undefined;
	const isEmpty = isLoaded && items.length === 0;

	return (
		<TurndownListScreen
			data={items}
			isLoading={!isLoaded}
			isEmpty={isEmpty}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			header={() => (
				<MainHeader
					title='Examples'
					scrollOffset={scrollOffset}
				/>
			)}
			emptyComponent={
				<EmptyState
					title='No items'
					description='Items will appear here when available.'
				/>
			}
			renderItem={({ item }) => <ExampleCard item={item} />}
		/>
	);
};
```

Use `ListHeaderComponent` for content that logically precedes the collection, such as search, filters, summary metrics, or section labels. Do not put those elements in a separate parent scroll view.

---

## 15. Loading, Empty, and Error States

Prefer the state API built into the shared screen shell.

### Loading

Represent "not loaded yet" distinctly from "loaded with no data."

For collections, a useful convention is:

```tsx
const [items, setItems] = useState<IItem[]>();

const isLoaded = items !== undefined;
const isEmpty = isLoaded && items.length === 0;
```

Then:

```tsx
<TurndownListScreen
	isLoading={!isLoaded}
	isEmpty={isEmpty}
	data={items}
	{...otherProps}
/>
```

### Empty

Use `isEmpty` only after the request has completed. Provide a domain-specific `emptyComponent` when the generic empty-state copy is not sufficient.

### Error

Use `errorMessage`, `errorComponent`, and `onRetry` from the screen API rather than building an unrelated full-screen error shell.

Do not make a failed request look like an empty successful response.

---

## 16. Dynamic Route Parameters

The screen that owns resource loading may read its own route parameters:

```tsx
import { useLocalSearchParams } from 'expo-router';

export const ExampleDetailsScreen = () => {
	const { entityId } = useLocalSearchParams<{ entityId: string }>();

	// Load and render the entity.
};
```

Prefer typed parameters when the expected shape is known.

A layout may also read a dynamic parameter when navigation chrome needs it. For example, an edit button in the header may need the current `entityId` to build the edit path. That is a valid layout concern because the ID is required specifically for the header action.

Do not move resource fetching into the layout simply because the layout reads the parameter.

---

## 17. Navigation Action Semantics

Use navigation methods according to the history behavior the user should experience.

| Action | Use when |
| --- | --- |
| `router.push(...)` | The user is drilling into another screen and should normally be able to go back. |
| `router.replace(...)` | The current screen should not remain in history, commonly after successful authentication, onboarding, creation, or edit flows. |
| `router.back()` | Return to the previous route from an explicit back action. |
| `<Redirect href={...} />` | Declarative routing before the destination screen should render, such as guards or index selection. |

Examples:

```tsx
router.push('/(app)/(<scope>)/examples/create');
```

```tsx
router.push(`/(app)/(<scope>)/examples/${entityId}`);
```

```tsx
router.replace(`/(app)/(<scope>)/examples/${entityId}` as Href);
```

Use `type Href` casts only where required by the project's current Expo Router typing. Do not cast arbitrary invalid paths merely to silence TypeScript.

---

## 18. Create and Edit Flow Pattern

Create/edit screens normally compose a feature form and keep navigation outside the form.

The existing form architecture often exposes a `submitData` method through a ref. When using a form that follows this API, the screen owns the primary submit button and post-submit navigation.

```tsx
export const CreateExampleScreen = () => {
	const router = useRouter();
	const formRef = useRef<ICreateExampleFormRef>(null);
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();

	const handleSave = () => {
		formRef.current?.submitData((success, entityId) => {
			if (!success || !entityId) {
				return;
			}

			router.replace(`/(app)/(<scope>)/examples/${entityId}` as Href);
		});
	};

	return (
		<TurndownScrollScreen
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
		>
			<CreateExampleForm ref={formRef} />
			<TurndownButton onPress={handleSave}>Save</TurndownButton>
		</TurndownScrollScreen>
	);
};
```

Do not duplicate form validation in the screen if the form already owns it. The screen should coordinate the form, user feedback, and navigation outcome.

If a new form does not need an imperative ref API, do not introduce one solely because another feature uses it. Follow the existing form abstraction that is closest to the feature being implemented.

---

## 19. Screen Styling Pattern

Screens should primarily compose existing reusable components and theme tokens.

When screen-specific layout styling becomes non-trivial, create a sibling style file:

```text
example.screen.tsx
example.styles.ts
```

Example:

```tsx
// example.styles.ts
import styled from 'styled-components/native';

import { NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

export const StyledExampleCard = styled.View({
	backgroundColor: NeutralColors.White,
	borderRadius: Radius.Medium,
	gap: Spacing.Small,
	padding: Spacing.Small,
});
```

Prefer existing spacing, radius, color, typography, shadow, icon-size, and layout tokens. Avoid scattering raw visual values through a screen when the design system already provides a token.

Small one-off structural styles may remain inline when extraction would reduce readability, but recurring or meaningful styling should be named and moved to a style file.

Do not modify a shared component implementation merely to make one screen easier to build. Compose the existing API first. If a required behavior truly cannot be expressed, treat that as a separate component-library decision rather than silently changing the primitive while implementing the screen.

---

## 20. Component Composition Rules

Screen files are orchestration layers, not replacements for the component library.

A screen should:

- Choose the correct screen shell.
- Compose existing shared and feature-specific components.
- Own screen-local state.
- Call feature services or hooks when appropriate.
- Coordinate loading/empty/error states.
- Handle screen-level navigation.
- Coordinate forms and post-submit behavior.

A screen should not:

- Recreate buttons, cards, inputs, typography, modals, headers, rows, icons, or list infrastructure with raw React Native primitives when an existing component already serves the need.
- Copy component styling into the screen.
- Modify shared component source as a side effect of screen implementation.
- Create a feature component for markup used only once unless the extraction materially improves readability or isolates meaningful behavior.
- Add abstractions only to make generated code look more architectural.

Use the smallest maintainable composition that matches existing patterns.

---

## 21. Feature Components vs. Screen Code

Keep screen files readable. Extract a feature-level component when at least one of these is true:

1. The UI is reused by multiple screens.
2. The UI has meaningful internal interaction/state that is independent of the screen.
3. The UI is a coherent domain concept such as a summary card, hero card, filter panel, status card, or row.
4. Keeping it inline would make the screen difficult to understand.

Do not extract wrappers that merely rename a `View` or forward props without adding domain meaning.

Place these components under:

```text
src/features/<feature>/components/<component-name>/
```

Follow the existing component file split when applicable:

```text
<name>.component.tsx
<name>.styles.ts
<name>.types.ts
<name>.stories.tsx
```

---

## 22. Screen-Level Data Loading

Existing feature screens may call a service from `useEffect` and store the result in local state. When following this pattern:

- Keep the service call out of the route file.
- Use a clear state value for "not loaded yet."
- Derive `isLoading` and `isEmpty` rather than conflating them.
- Pass loading/error/empty state into the screen shell.
- Do not render resource-dependent components with fabricated data solely to avoid handling loading.
- Keep the dependency array aligned with the values that determine the request.

Example:

```tsx
const [entity, setEntity] = useState<IEntity | null>(null);
const { entityId } = useLocalSearchParams<{ entityId: string }>();

useEffect(() => {
	const loadEntity = async () => {
		if (!entityId) {
			setEntity(null);
			return;
		}

		const response = await entityService.getById(entityId);
		setEntity(response);
	};

	void loadEntity();
}, [entityId]);
```

If the feature already has a dedicated query/data hook, use that hook instead of introducing a second data-loading pattern.

---

## 23. Special Layouts

Not every screen belongs inside the standard tab/stack shell.

Authentication is the main example in the current architecture. Its route layout owns a specialized shared surface and renders child routes through `<Slot />`.

Use this pattern only when the entire route group shares a structural shell that is materially different from normal application screens.

A specialized layout may own:

- Shared background/hero treatment.
- Shared keyboard handling that applies to the entire route group.
- Shared back-button behavior.
- Shared `<Slot />` placement.

Do not create a custom layout for a single screen when a feature screen and the standard screen shell are sufficient.

---

## 24. Root and Index Redirect Pattern

Index files may select a default route without rendering a feature screen.

Example:

```tsx
import { Redirect, type Href } from 'expo-router';

const AppIndexRoute = () => {
	return <Redirect href={'/(app)/(<scope>)/home' as Href} />;
};

export default AppIndexRoute;
```

Root `app/index.tsx` may also choose among authenticated, onboarding, and signed-out destinations after bootstrap state is known.

Keep this logic narrowly focused on route selection. Do not turn the root index into a general dashboard or feature screen.

---

## 25. Recommended Resource Route Shape

For a standard resource with list, details, create, and edit flows, use a shape like:

```text
app/(app)/(<scope>)/examples/
  _layout.tsx
  index.tsx
  create.tsx
  [exampleId]/
    index.tsx
    edit.tsx
```

And feature implementations like:

```text
src/features/examples/screens/
  examples.screen.tsx
  example-details.screen.tsx
  create-example.screen.tsx
  edit-example.screen.tsx
```

Expected navigation behavior:

```text
List
  -> push Create
  -> push Details

Create success
  -> replace Details

Details
  -> push Edit

Edit success
  -> replace Details

Nested Create / Details / Edit
  -> back button available
  -> bottom tab bar hidden by the existing navigation behavior
```

This provides predictable history behavior without making each operation a top-level tab.

---

## 26. Common Mistakes AI Agents Must Avoid

### Mistake: implementing the screen directly in `app/**`

Wrong:

```tsx
// app/(app)/examples/index.tsx
export default function ExampleRoute() {
	return (
		<TurndownScrollScreen>
			{/* entire feature implementation */}
		</TurndownScrollScreen>
	);
}
```

Correct: move the implementation into `src/features/examples/screens/examples.screen.tsx` and keep the route as an adapter.

### Mistake: wrapping the screen in another `ScrollView`

The screen shell already owns scrolling. Nested vertical scrolling causes gesture, layout, keyboard, and header-offset problems.

### Mistake: using a scroll screen for a large collection

Use `TurndownListScreen` when the main content is a repeated list. It already integrates the project's list implementation and header behavior.

### Mistake: reading auth state in every child screen

Put general authentication gates in the protected layout.

### Mistake: putting navigation actions in arbitrary body components

If an action belongs to persistent navigation chrome, configure it in the route layout's `HeaderTopRow`. If it is a normal content action, keep it in the screen.

### Mistake: manually controlling bottom-tab visibility from a screen

The custom tab implementation already hides itself on nested routes.

### Mistake: adding raw colors and spacing throughout the screen

Use the existing theme tokens and existing reusable components.

### Mistake: changing shared components while adding a screen

Screen work should compose the existing design system. Shared component changes are separate work and should happen only when explicitly required.

### Mistake: copying a legacy inconsistency as a new convention

When existing files disagree, follow the dominant architecture described here: thin route, layout-owned navigation, feature-owned screen, existing screen shell, shared header-scroll provider, and reusable components.

---

## 27. AI Decision Sequence for a New Screen

When asked to create a screen, make decisions in this order:

1. **Identify the feature.** Determine the correct `src/features/<feature>/` location.
2. **Identify the navigation scope.** Determine which existing route group/tab owns the screen.
3. **Decide whether it is a tab root or nested route.** Root screens belong at the tab's `index`; detail/create/edit flows are normally nested.
4. **Choose the screen shell.** Use list, scroll, or static based on content behavior.
5. **Check the parent `_layout.tsx`.** Reuse or extend its stack/header configuration instead of adding navigation chrome inside the route file.
6. **Connect header scrolling.** Use the existing `HeaderScrollProvider` and screen scroll hook when the section uses shared header behavior.
7. **Compose existing components.** Search the shared and feature component libraries before writing raw replacements.
8. **Add screen-level state/data orchestration.** Keep it in the feature screen or existing hooks/services.
9. **Add route adapter.** Keep it minimal.
10. **Verify navigation history.** Use push/replace/back/redirect according to the intended flow.
11. **Verify loading, empty, and error behavior.** Use screen-shell state props.
12. **Verify safe area and keyboard behavior.** Do not add duplicate wrappers unless necessary.
13. **Verify nested-tab behavior.** Nested routes should use the existing automatic bottom-bar hiding behavior.
14. **Verify styling.** Use tokens and sibling style files; do not modify reusable components for screen-specific needs.

---

## 28. Implementation Checklist

Before considering a new screen/route complete, verify all of the following:

### File placement

- Route is under the existing root `app/` tree.
- Screen implementation is under `src/features/<feature>/screens/`.
- Feature-specific reusable pieces are under the feature, not `app/`.
- Route file is thin.

### Navigation

- Correct route group and parent stack are used.
- Tab root vs. nested route placement is intentional.
- `_layout.tsx` contains shared stack/header configuration.
- Authentication/access guard is placed at the appropriate layout boundary.
- `push`, `replace`, `back`, or `Redirect` matches intended history behavior.
- Dynamic route params are typed where practical.

### Screen shell

- `TurndownScrollScreen`, `TurndownListScreen`, or `TurndownStaticScreen` is used.
- No redundant vertical `ScrollView` exists.
- No redundant full-screen `SafeAreaView` exists.
- Keyboard behavior is delegated to the screen shell unless there is a specific exception.

### Headers

- Navigation chrome is configured in the stack layout.
- `HeaderScrollProvider` wraps header-aware stacks.
- The screen uses the provider's shared scroll offset.
- `HeaderTopRow` owns persistent back/add/edit/navigation actions.
- `MainHeader` is used only when scrollable visual header content is needed.

### Data and states

- Data access is outside the route file.
- Loading is distinguishable from empty.
- Empty state is shown only after loading completes.
- Error state is represented explicitly when applicable.
- Large collections use the list screen rather than `.map()` inside a scroll view.

### Components and styling

- Existing components were searched before adding new UI primitives.
- Existing component APIs are used without screen-specific modifications to shared implementations.
- Theme tokens are used instead of avoidable raw visual constants.
- Substantial screen styles are placed in a sibling style file.
- Feature components are extracted only when they have reuse, domain meaning, meaningful behavior, or a readability benefit.

### Code quality

- Feature screen has a named export.
- Expo Router file has a default export.
- Names are explicit and descriptive.
- No placeholder logs or temporary data remain unless the task explicitly requires them.
- No unnecessary abstractions were added.
- The implementation follows the closest existing screen pattern rather than inventing a parallel architecture.

---

## 29. Canonical Mental Model

When generating code, think of the layers this way:

```text
ROUTE
Address only.
Selects the screen.

LAYOUT
Navigation structure.
Guards.
Tabs/stacks.
Persistent header chrome.
Navigation-level providers.

SCREEN
Feature orchestration.
Screen shell.
Data/state coordination.
Navigation actions from content.
Form coordination.
Composition of reusable UI.

FEATURE COMPONENT / FORM
Domain-specific reusable UI or focused interaction.

SHARED COMPONENT
Reusable application-wide design-system primitive.
Do not rewrite it inside a screen.
```

If code does not fit the responsibility of its current layer, move it to the layer that owns that concern.

---

## 30. Default AI Rule

When there is no explicit reason to deviate, implement a new application page as:

```text
thin Expo Router route
    + existing parent layout/stack
    + feature-level named screen
    + TurndownScrollScreen or TurndownListScreen
    + shared header scroll state when the section uses it
    + existing reusable components
    + feature-local styles/forms/components only where needed
```

Do not invent a new screen architecture when the existing one already covers the requirement.
