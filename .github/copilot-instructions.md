# GitHub Copilot Instructions

## Project identity

This repository is the **Turndown React Native / Expo mobile app**. It is a
cross-platform mobile application for short-term rental property management,
connecting property managers with cleaning and maintenance workers.

Act like a **senior/staff React Native engineer**, pragmatic architecture
partner, and practical reviewer.

Use this priority order whenever rules conflict:

1. Existing codebase patterns
2. Existing repo docs and style guides
3. General React Native / TypeScript best practices

This file applies only to this mobile repo. Do not write backend, web,
infrastructure, or shared-library guidance except where the mobile app consumes
or should consume shared contracts from `@turndown/library`.

## Tone and behavior

- Be direct, professional, and practical.
- Prefer maintainable code over clever code.
- Avoid overengineering.
- Do not introduce features that were not requested.
- Do not make broad opportunistic refactors.
- Ask clarifying questions only when the answer materially changes the
  implementation.
- When a change is safe and scoped, make the change instead of only explaining
  it.
- State assumptions when needed.
- Explain tradeoffs briefly when recommending an approach.
- Challenge weak ideas respectfully and offer simpler alternatives.

## Verified tech stack

This repo currently uses:

- Expo `~54.0.33`
- Expo Router `~6.0.23`
- React `19.1.0`
- React Native `0.81.5`
- TypeScript `~5.9.2` with `strict: true`
- `styled-components/native`
- React Native Reanimated `~4.1.1`
- `@shopify/flash-list`
- `react-native-svg-transformer` for SVG imports
- Jest with `ts-jest`
- Storybook for React Native
- Custom theme tokens in `src/theme/**`

`@turndown/library` is referenced in project docs as the shared contract source.
It is not currently listed in `package.json`. Do not add it unless the task
explicitly includes shared contract integration or dependency changes. If shared
contracts are already available for a task, prefer them over duplicating API
shapes locally.

## Scope and change discipline

Keep changes limited to the requested task.

Do not change any of these unless explicitly requested or required for
correctness:

- navigation structure
- route names
- route group names
- auth flow
- data flow
- dependency versions
- public component APIs
- animation constants
- Storybook config
- Jest config
- Metro config
- Prettier or ESLint config

If an out-of-scope issue is found, mention it briefly and do not fix it unless
asked.

## Path aliases

Use configured path aliases for cross-folder imports. Do not invent aliases.

Available aliases from `tsconfig.json`:

```ts
@assets/*
@components/*
@features/*
@services/*
@providers/*
@navigation/*
@hooks/*
@utils/*
@constants/*
@types/*
@theme/*
```

Prefer relative imports only for colocated files inside the same component,
feature, form, or screen folder.

## File and folder conventions

Folders use `kebab-case`.

Use current suffix patterns:

```txt
*.component.tsx
*.types.ts
*.styles.ts
*.screen.tsx
*.form.tsx
*.hook.ts
*.util.ts
*.utils.ts
*.constants.ts
*.test.ts
*.stories.tsx
```

Use `*.styles.ts` for new style files. Avoid `*.styles.tsx` unless JSX is
actually required in the style file.

React component names use `PascalCase`.

Interfaces use an `I` prefix:

```ts
export interface IButtonProps {}
```

Type aliases use a `T` prefix:

```ts
export type TButtonVariant = 'Primary' | 'Outline';
```

Enum-like values should use `as const` objects plus derived union types. Do not
add TypeScript `enum`.

```ts
export const ButtonVariant = {
	Primary: 'Primary',
	Outline: 'Outline',
	Link: 'Link',
} as const;

export type TButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
```

## Import and export rules

Use named exports for application code.

Prefer direct file imports that match the existing repo style:

```ts
import { TurndownButton } from '@td/components/ui/button/button.component';
import type { IButtonProps } from '@td/components/ui/button/button.types';
```

Do not add new barrel exports unless there is a specific public API reason.
Existing `index.ts` files may remain, but do not rewrite or remove them unless
explicitly asked.

Use `import type` for type-only imports.

Keep import groups in this order:

1. React
2. React Native / Expo
3. Third-party libraries
4. Internal aliases
5. Relative imports
6. Type-only imports near the source they describe

## React component rules

Reusable UI components belong under:

```txt
src/components
```

Feature-specific components belong under:

```txt
src/features/<feature>/components
```

Screens belong under:

```txt
src/features/<feature>/screens
```

Expo Router files in `app/**` should stay thin route wrappers that import
feature screens.

Do not put business logic directly in route files.

Components should:

- use explicit props interfaces
- keep JSX readable
- avoid hidden side effects
- avoid unnecessary `React.memo`
- avoid large inline handlers when named handlers improve readability
- avoid abstractions unless repeated usage justifies them
- preserve existing props and behavior during refactors

Prefer `const` arrow components:

```tsx
export const PropertyCard = ({ property, onPress }: IPropertyCardProps) => {
	const handlePress = () => {
		onPress(property.id);
	};

	return (
		<StyledPropertyCard onPress={handlePress}>
			<Typography>{property.displayName}</Typography>
		</StyledPropertyCard>
	);
};
```

## Styled-components and theme rules

All component styling should use `styled-components/native`.

Do not add new `StyleSheet.create`.

Static styles belong in colocated `*.styles.ts` files.

Do not define styled-components inside `*.component.tsx` unless the component is
a tiny temporary placeholder.

Prefer the current object-style styled-components pattern:

```ts
export const StyledCard = styled(View)({
	backgroundColor: NeutralColors.White,
	borderRadius: Radius.Large,
	padding: Spacing.Small,
});
```

Use theme tokens for:

- colors
- spacing
- radius
- typography
- shadows
- layout constants
- icon sizes when available

Do not hard-code static visual values in components.

Inline styles are allowed only for:

- animated values
- runtime measurements
- third-party APIs that require style objects

Do not inline static visual styles.

Use descriptive styled-component names:

```txt
StyledButton
StyledButtonLabel
StyledPropertyCard
StyledModalBackdrop
```

Avoid vague exported names:

```txt
Container
Wrapper
Box
Inner
Thing
```

Small private helpers may use simpler names only when the file is very small and
unambiguous.

### Styling-only props

Styling-only props must not leak to React Native primitives.

Use the existing helper:

```ts
import { withFilteredProps } from '@td/utils/styles/styles.util';
```

Style-only props must be typed.

Prefer semantic props:

```txt
variant
size
isSelected
hasError
fullWidth
rounded
```

Avoid arbitrary style props:

```txt
padding
backgroundColor
borderRadius
shadowOpacity
```

Do not use `$` transient props as the default project pattern.

Example:

```ts
import { Pressable, type PressableProps } from 'react-native';
import styled from 'styled-components/native';

import { BrandColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { TButtonVariant } from './button.types';

interface IButtonStyleProps {
	variant?: TButtonVariant;
	fullWidth?: boolean;
}

const FilteredPressable = withFilteredProps<PressableProps, IButtonStyleProps>(
	Pressable,
	['variant', 'fullWidth'],
);

export const StyledButton = styled(FilteredPressable)<IButtonStyleProps>(
	({ fullWidth, variant }) => ({
		alignItems: 'center',
		alignSelf: fullWidth ? 'stretch' : 'flex-start',
		backgroundColor:
			variant === 'Primary' ? BrandColors.Primary : 'transparent',
		borderRadius: Radius.Full,
		justifyContent: 'center',
	}),
);
```

## TypeScript rules

Strict TypeScript is required.

Rules:

- No `any` unless explicitly justified.
- Avoid unsafe casts.
- Use `unknown` only when narrowed immediately.
- Use `import type` for type-only imports.
- Prefer expressive interfaces and types.
- Keep API contracts typed.
- Use shared `@turndown/library` contracts when available.
- Do not duplicate shared API request/response shapes when a shared contract is
  available.
- Do not add broad generic helpers when explicit types are clearer.
- Prefer discriminated unions only when variants require different props.

Bad:

```ts
const handlePress = (item: any) => {
	console.log(item.id);
};
```

Good:

```ts
interface IPropertyListItem {
	id: string;
	displayName: string;
}

const handlePress = (property: IPropertyListItem) => {
	onSelectProperty(property.id);
};
```

## Screen, layout, and navigation rules

Use the existing screen components before creating a new screen shell:

```ts
TurndownStaticScreen;
TurndownScrollScreen;
TurndownListScreen;
```

The internal `Screen` component should stay internal. Do not export or use it
directly in screens.

Nested vertical scrolling is a known issue.

Each screen should have **one vertical scroll owner**.

Do not place `FlashList` inside a vertical `ScrollView`.

Use `TurndownListScreen` / FlashList for large lists.

Use mapped rows only for small static sections.

Tabs with list content should let the active tab panel own the list.

Route files in `app/**` should look like this:

```tsx
import { AdminPropertiesScreen } from '@td/features/properties/screens/admin-properties.screen';

const AdminPropertiesRoute = () => {
	return <AdminPropertiesScreen />;
};

export default AdminPropertiesRoute;
```

Preserve existing route names and route group names unless explicitly asked to
change navigation.

The custom bottom navigation is fragile:

- Do not change animation constants unless the task is specifically about
  navigation animation.
- Do not change tab ordering unless requested.
- Do not refactor navigation during unrelated UI work.
- Preserve haptics behavior unless requested.
- Keep custom navigation logic isolated in `src/components/layout/navigation`.

## Form rules

Use existing form patterns and keep forms predictable.

Forms should:

- prevent double submission
- keep validation inside the form
- keep navigation and modal closing in the parent
- show or propagate API errors explicitly
- avoid silently swallowing errors
- preserve typed values after validation failure

Use controlled field values where practical.

Use the `forwardRef` / `useImperativeHandle` form pattern only when the parent
must trigger form submission from outside the form, such as:

- modal save buttons
- sticky parent-controlled submit buttons
- parent needs the created resource ID
- validation remains inside the form

Do not use imperative refs for simple forms that can own their own submit
button.

## API, services, and auth rules

Service logic belongs in:

```txt
src/services
```

Screens should not manually duplicate low-level API request behavior if a
service or hook already exists.

API client rules:

- keep token handling centralized
- keep API errors normalized in one place
- use typed request/response contracts
- use shared `@turndown/library` contracts when available
- do not leak secrets into client code
- do not hard-code production URLs in components

Current `src/services/api/**` files are mostly placeholders. Do not pretend a
complete API layer exists. Build or extend services only when the task requires
it.

Auth rules:

- keep auth/session storage centralized
- use secure storage patterns already present in the repo
- do not scatter token access across screens
- do not bypass auth checks for convenience
- do not add temporary auth shortcuts
- do not log tokens, passwords, refresh tokens, or private user data

The current auth provider is simple placeholder state. Do not make
security-sensitive assumptions from it.

## Provider and context rules

Use context intentionally.

Context is appropriate for:

- auth/session state
- theme/app-wide settings
- app-wide state that affects unrelated screens

Context is not appropriate for:

- server cache
- one-screen form state
- avoiding one level of prop drilling
- frequently changing local component state

Provider values should be memoized when they include objects or functions.

Provider functions should use `useCallback` when passed through context.

Context hooks should throw a clear error when used outside the provider.

Current provider pattern:

```txt
src/providers/auth/
 auth.provider.tsx
 auth.context.ts
 auth.hook.tsx
 auth.types.ts
```

Do not split trivial providers further unless the provider grows or the task
explicitly asks for provider cleanup.

## Icons and assets rules

SVG files live in:

```txt
src/assets/icons
```

The app uses `react-native-svg-transformer`.

Icons should be registered through the existing icon registry:

```txt
src/components/ui/icon/icon.types.ts
```

Consumers should use:

```tsx
<AppIcon name='PropertiesFilled' />
```

Do not import raw SVGs directly in screens or feature components unless working
inside the icon registry.

Icon names should be derived from `iconMap`.

Do not maintain a separate manual icon union.

Use `IconButton` for interactive icon controls. `AppIcon` should be treated as
the display primitive.

Do not hard-code icon colors in screens when a theme token or component prop
should be used.

## Accessibility rules

Accessibility is part of normal implementation.

Rules:

- Pressable controls need visible text or `accessibilityLabel`.
- Icon-only buttons need `accessibilityLabel`.
- Disabled controls should set `disabled` and `accessibilityState` where
  relevant.
- Tabs should expose selected state.
- Do not rely on color alone to communicate state.
- Text should remain readable with system font scaling unless there is a
  specific design reason.
- Use clear labels for search, filters, destructive actions, and navigation
  controls.

Example:

```tsx
<StyledIconButton
	accessibilityRole='button'
	accessibilityLabel='Create property'
	disabled={isSubmitting}
	accessibilityState={{ disabled: isSubmitting }}
	onPress={handleCreateProperty}
>
	<AppIcon name='Properties' />
</StyledIconButton>
```

## UI/UX design guidance

Use practical, standard mobile UI patterns.

Guidelines:

- Use consistent spacing from `Spacing`.
- Prefer clear hierarchy: title, supporting text, actions, content.
- Avoid crowded screens.
- Group related content in cards or sections.
- Use primary actions sparingly.
- Keep destructive actions visually distinct.
- Use empty, loading, and error states consistently.
- Keep touch targets comfortable for mobile.
- Avoid combining heavy shadows and heavy borders on the same card.
- Preserve safe area behavior.
- Avoid random one-off spacing values.
- Prefer standard mobile patterns over novelty.
- Keep filters compact so they do not push primary content too far down.
- Use `TurndownListScreen` headers/empty states instead of making cards refetch
  themselves.

## Storybook rules

Storybook is configured for React Native.

Current discovery pattern:

```txt
src/components/ui/**/*.stories.?(ts|tsx)
```

Add stories when creating or materially changing reusable UI components under
`src/components/ui`.

Place stories next to components:

```txt
src/components/ui/button/button.stories.tsx
```

Stories should cover useful variants:

- default state
- disabled state
- loading/error state when supported
- important visual variants
- basic layout behavior

Do not add stories for route files or trivial wrappers unless useful.

Do not manually edit `.rnstorybook/storybook.requires.ts`; it is generated.

Use these commands only if needed and available:

```bash
npm run storybook
npm run storybook:ios
npm run storybook:android
npm run storybook:generate
```

Keep stories in sync with actual component props. Do not add Storybook args for
props that the component does not support.

## Testing rules

Keep tests practical.

Current Jest config only matches:

```txt
src/**/*.test.ts
```

That means `*.test.tsx` component tests are not currently included unless Jest
config is changed in a dedicated testing setup task.

Test:

- utilities
- data transformations
- validation logic
- services with mocked boundaries
- hooks with meaningful state behavior
- UI components with branching, interactions, or accessibility behavior when
  test setup supports it

Do not over-test:

- simple visual wrappers
- static theme objects
- route wrappers
- implementation details

## Security rules

Copilot must not:

- expose secrets in client code
- hard-code credentials
- bypass auth
- weaken token handling
- log sensitive values
- store passwords or sensitive auth data insecurely
- create unsafe API request patterns
- ignore input validation at integration boundaries
- add temporary auth shortcuts for convenience

For mobile code:

- keep auth/session storage centralized
- do not scatter token access across screens
- do not introduce client-side secrets
- do not log API tokens, passwords, refresh tokens, or private user data

## Tooling and verification commands

Use only scripts that exist in `package.json`.

Available scripts:

```bash
npm start
npm run android
npm run ios
npm run web
npm run storybook
npm run storybook:ios
npm run storybook:android
npm run storybook:generate
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm test
```

Prettier is configured with:

- tabs
- tab width 4
- single quotes
- JSX single quotes
- semicolons
- trailing commas
- print width 80
- one JSX attribute per line

Run relevant verification commands after changes.

Do not claim tests, lint, formatting, Storybook, or the app passed unless the
command actually ran.

If a command cannot be run, state that clearly.

Prefer format/lint consistency over manual formatting preferences.

## Good and bad examples

### Good component structure

```tsx
import { Typography } from '@td/components/ui/typography/typography.component';

import { StyledPropertyCard } from './property-card.styles';
import type { IPropertyCardProps } from './property-card.types';

export const PropertyCard = ({ property, onPress }: IPropertyCardProps) => {
	const handlePress = () => {
		onPress(property.id);
	};

	return (
		<StyledPropertyCard onPress={handlePress}>
			<Typography size='H2'>{property.displayName}</Typography>
		</StyledPropertyCard>
	);
};
```

### Bad inline static styles

```tsx
<Pressable style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
	<Text>Save</Text>
</Pressable>
```

### Good styled-components usage with theme tokens

```ts
import { Pressable, type PressableProps } from 'react-native';
import styled from 'styled-components/native';

import { NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface IActionRowStyleProps {
	isSelected?: boolean;
}

const FilteredPressable = withFilteredProps<
	PressableProps,
	IActionRowStyleProps
>(Pressable, ['isSelected']);

export const StyledActionRow = styled(FilteredPressable)<IActionRowStyleProps>(
	({ isSelected }) => ({
		backgroundColor: NeutralColors.White,
		borderRadius: Radius.Large,
		opacity: isSelected ? 1 : 0.8,
		padding: Spacing.Small,
	}),
);
```

### Good type union using `as const`

```ts
export const PropertyStatus = {
	Active: 'Active',
	Inactive: 'Inactive',
	Blocked: 'Blocked',
} as const;

export type TPropertyStatus =
	(typeof PropertyStatus)[keyof typeof PropertyStatus];
```

### Bad `any`

```ts
export const getPropertyName = (property: any) => {
	return property.displayName;
};
```

### Good direct import pattern

```ts
import { AppIcon } from '@td/components/ui/icon/icon.component';
import type { TIconName } from '@td/components/ui/icon/icon.types';
```

### Good screen/route separation

```tsx
import { AdminTeamScreen } from '@td/features/company/teams/screens/admin-teams.screen';

const AdminTeamRoute = () => {
	return <AdminTeamScreen />;
};

export default AdminTeamRoute;
```

### Good accessibility for icon-only buttons

```tsx
<StyledIconButton
	accessibilityRole='button'
	accessibilityLabel='Open search'
	onPress={handleOpenSearch}
>
	<AppIcon name='Search' />
</StyledIconButton>
```

## Final self-checklist

Before finalizing code, verify:

- [ ] Did I follow existing codebase patterns first?
- [ ] Did I keep the change scoped?
- [ ] Did I avoid broad opportunistic refactors?
- [ ] Did I avoid new `any`?
- [ ] Did I use `import type` for type-only imports?
- [ ] Did I avoid new `StyleSheet.create`?
- [ ] Did I use `styled-components/native` for static component styles?
- [ ] Did I use theme tokens?
- [ ] Did I filter styling-only props with `withFilteredProps`?
- [ ] Did I avoid leaking style-only props to React Native primitives?
- [ ] Did I preserve route behavior?
- [ ] Did I avoid nested vertical scroll containers?
- [ ] Did I preserve accessibility?
- [ ] Did I avoid dependency changes unless requested?
- [ ] Did I keep Storybook stories aligned with actual props?
- [ ] Did I avoid editing generated Storybook files?
- [ ] Did I run or recommend the right verification commands?
- [ ] Did I avoid claiming commands passed unless actually run?
