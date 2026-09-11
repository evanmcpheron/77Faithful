# Prop standardization and theme style system

Target path: `docs/prop-standardization.md`

## 1. Purpose

This document defines the source-of-truth rules for the Turndown mobile
`prop-standardization` refactor.

The goal is to make component props, theme tokens, colors, sizes, and styling
patterns consistent enough that future component-by-component refactors do not
need to re-decide the design system.

This guide is intentionally practical. It is not a full enterprise design
system, and it should not introduce broad abstractions that slow down solo
development.

## 2. Scope

This guide applies to the Turndown React Native / Expo mobile repo.

In scope:

- Theme files under `src/theme/**`.
- Reusable components under `src/components/**`.
- Feature/domain components under `src/features/**/components/**`.
- Public component props such as `variant`, `tone`, `size`, `status`,
  `selected`, `disabled`, `fullWidth`, `align`, and related style props.
- Style-only prop filtering with `withFilteredProps`.
- Replacing raw visual values with theme tokens.
- Removing `HeaderGradient` from theme usage.
- Defining the rules that the later implementation refactor must follow.

Out of scope:

- Refactoring every component in this task.
- Redesigning component layouts.
- Changing route behavior.
- Changing data/API/auth behavior.
- Changing SVG files.
- Adding dependencies.
- Adding a `ThemeProvider`.
- Creating a broad design-system framework.

## 3. Non-goals

Do not use this work to:

- Rebuild components from scratch.
- Create component-level redesigns.
- Rename files or folders outside the touched refactor scope.
- Add new visual variants without a current use case.
- Add one-off tokens for every current hard-coded value.
- Introduce TypeScript `enum`.
- Add barrel exports.
- Normalize SVG assets.
- Convert all media placeholder components.
- Change Storybook organization unless explicitly scoped.

## 4. Current findings from the actual repo

### 4.1 Theme files already exist

The repo already has these target theme files:

```txt
src/theme/colors.ts
src/theme/spacing.ts
src/theme/typography.ts
src/theme/radius.ts
src/theme/shadows.ts
src/theme/layout.ts
src/theme/z-index.ts
```

`src/theme/icon-sizes.ts` does not exist yet. Icon sizes and stroke widths
currently live inside `src/theme/typography.ts`, which is the wrong ownership.

### 4.2 Colors are mixed between palette and semantic roles

`src/theme/colors.ts` currently exports:

- `BrandColors`
- `StateColors`
- `NeutralColors`
- `Colors`

Current issues:

- `BrandColors.Primary` is the gold value `#EDC764`.
- `BrandColors.Secondary` and `BrandColors.Icon` both point to `#014940`.
- `BrandColors.White` duplicates `NeutralColors.White`.
- `BrandColors.TextPrimary` is a text semantic token inside the brand bucket.
- `BrandColors.SurfaceBorder` and `BrandColors.Line` are border semantic tokens
  inside the brand bucket.
- `BrandColors.HeaderGradient` exists but is only using very similar green
  values and should be removed.
- `StateColors` has `Success`, `Warning`, and `Info`, but no `Error`.
- `StateColors.Active` is being used as the current error/destructive red-orange
  color in places such as typography and badges.
- `Inverse` exists at the typography layer and should remain, but it needs to
  become a consistent semantic color role instead of a component-specific
  special case.

### 4.3 Typography owns icon tokens

`src/theme/typography.ts` currently defines typography sizes, typography color
variants, typography weights, `IconStrokeWidth`, and `IconSize`.

This should be split:

- Typography roles stay in `typography.ts`.
- Icon size and stroke tokens move to `icon-sizes.ts`.

### 4.4 Spacing and radius are usable but should stay limited

`src/theme/spacing.ts` has a broad scale:

```ts
XSmall: 8;
Small: 16;
Medium: 24;
Large: 32;
XLarge: 40;
XXLarge: 56;
XXXLarge: 72;
Huge: 80;
XHuge: 96;
XXHuge: 120;
```

`src/theme/radius.ts` has:

```ts
Small: 8;
Medium: 16;
Large: 20;
XLarge: 30;
XXLarge: 45;
Full: 60;
```

These are acceptable for now. Do not expand the scales unless repeated usage
proves the need.

### 4.5 Most styling is already styled-components

The reusable component layer is already using `styled-components/native` and
colocated `*.styles.ts` files.

Current good patterns:

- Most reusable components have `*.component.tsx`, `*.types.ts`, and
  `*.styles.ts`.
- Many style-only props are filtered with `withFilteredProps`.
- `src/utils/styles/styles.util.ts` already owns `withFilteredProps`.
- Theme tokens are broadly used instead of raw hex values.

Current issues:

- A few style files are placeholders with `export {};`.
- `Typography` uses `StyleSheet.flatten` because it accepts a public `style`
  override.
- Several components still use component-local numeric maps that should move to
  theme tokens or strongly typed style maps.
- A small number of inline styles remain; keep dynamic runtime styles, but move
  static visual values into style files.

### 4.6 Const-object unions are partially adopted

The repo already uses the preferred pattern in many places:

```ts
export const ButtonVariant = {
	Primary: 'Primary',
	Outline: 'Outline',
	Inverse: 'Inverse',
	Link: 'Link',
} as const;

export type TButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
```

Current good examples:

- `ButtonVariant`
- `ButtonSize`
- `AvatarVariant`
- `AvatarSize`
- `BadgeVariant`
- `ChipVariant`
- `ActionRowVariant`
- `IconButtonVariant`
- `SurfaceVariant`
- `SurfacePadding`
- `StatusBadgeStatus`
- `PropertyStatus`

Current inconsistencies:

- Some prop value sets are still raw string unions, such as `TInputType`,
  `TScreenContentMode`, typography sizes, typography variants, and typography
  weights.
- Several components use `variant` for semantic color intent. That should become
  `tone` when the value means `Brand`, `Success`, `Warning`, `Error`, `Info`,
  `Neutral`, or `Inverse`.
- `ButtonSize` includes `Normal`, but the current button styles do not actually
  map `size`.
- `IconButton` accepts raw numeric `iconSize` and raw numeric `size`.
- `Screen` accepts raw color and padding props. That is acceptable only as a
  layout-level escape hatch, not a reusable component default.

### 4.7 `HeaderGradient` runtime usage exists

`HeaderGradient` is currently referenced in:

- `src/theme/colors.ts`
- `src/features/auth/screens/auth.styles.ts`
- `src/features/properties/screens/admin-properties.screen.tsx`
- `src/features/properties/screens/admin-properties.styles.tsx`
- `src/components/ui/main-header/main-header.styles.ts`
- `src/features/properties/components/property-hero-card/property-hero-card.styles.ts`
- existing docs

The later implementation should replace these usages with semantic tokens and
then remove `HeaderGradient`.

### 4.8 Current component categories are enough

Current reusable component folders include:

```txt
src/components/ui
src/components/form
src/components/layout
src/components/media
```

Current UI components include button, typography, icon, icon-button, card,
badge, chip, action-row, row, screen, tabs, main-header, surface, thumbnail,
loading-state, empty-state, error-state, skeleton, and progress-bar.

Do not reorganize these folders for this refactor. Standardize props and theme
usage in place.

## 5. Target theme file structure

Use this target structure:

```txt
src/theme/
	colors.ts
	spacing.ts
	typography.ts
	radius.ts
	shadows.ts
	icon-sizes.ts
	layout.ts
	z-index.ts
```

Rules:

- Keep files that already exist.
- Add `icon-sizes.ts` when moving icon tokens out of `typography.ts`.
- Do not add additional theme files unless repeated usage proves the need.
- Keep `src/theme/index.ts` empty or remove it in a separate cleanup ticket. Do
  not add new barrel exports as part of this refactor.
- Prefer direct imports:

```ts
import { TextColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
```

Do not prefer:

```ts
import { TextColors, Spacing } from '@td/theme';
```

## 6. Color system rules

### 6.1 Separate palette values from semantic usage

`colors.ts` should separate raw-ish palette buckets from semantic buckets.

Target structure:

```ts
export const BrandColors = {
	Primary: '#EDC764',
	Secondary: '#014940',
	SecondaryStrong: '#004C43',
	SecondaryDarker: '#00463E',
} as const;

export const NeutralColors = {
	White: '#FFFFFF',
	Grey100: '#F5F5F5',
	Grey200: '#E5E5E5',
	Grey300: '#D4D4D4',
	Grey400: '#A3A3A3',
	Grey500: '#737373',
	Grey600: '#525252',
	Grey700: '#404040',
	Grey800: '#262626',
	Grey900: '#1F1F1F',
	Black: '#000000',
} as const;

export const FeedbackColors = {
	Success: '#06C270',
	SuccessMuted: '#CDF3E2',
	Warning: '#FFCC00',
	WarningMuted: '#FFF5CC',
	Error: '#FF5943',
	ErrorMuted: '#FFDED9',
	Info: '#0063F7',
	InfoMuted: '#CCE0FD',
} as const;

export const SurfaceColors = {
	Screen: NeutralColors.White,
	Card: NeutralColors.White,
	Muted: '#EFF6F6',
	Inverse: BrandColors.Secondary,
	Header: BrandColors.SecondaryStrong,
} as const;

export const TextColors = {
	Primary: '#092C4C',
	Secondary: BrandColors.Secondary,
	Muted: NeutralColors.Grey600,
	Disabled: NeutralColors.Grey400,
	Inverse: NeutralColors.White,
	Brand: BrandColors.Primary,
	Info: FeedbackColors.Info,
	Warning: FeedbackColors.Warning,
	Error: FeedbackColors.Error,
	Success: FeedbackColors.Success,
} as const;

export const BorderColors = {
	Default: '#D6E2E1',
	Subtle: '#E7F3F1',
	Muted: NeutralColors.Grey200,
	Focus: BrandColors.Primary,
	Inverse: '#0F685D',
	Error: FeedbackColors.Error,
} as const;

export const ActionColors = {
	PrimaryBackground: BrandColors.Primary,
	PrimaryContent: TextColors.Inverse,
	SecondaryBackground: BrandColors.Secondary,
	SecondaryContent: TextColors.Inverse,
	Link: FeedbackColors.Error,
	DisabledOpacity: 0.5,
} as const;
```

### 6.2 Preserve `Grey` spelling for now

The repo already uses `NeutralColors.Grey100` through `NeutralColors.Grey900`.

Do not create a spelling-only churn refactor from `Grey` to `Gray`. New neutral
tokens should continue using `Grey` unless a separate whole-repo naming cleanup
is explicitly approved.

### 6.3 Remove `HeaderGradient`

`HeaderGradient` should be removed.

Replacement rule:

- Use `SurfaceColors.Header` for the current dark green header background.
- Use `SurfaceColors.Inverse` for generic dark/high-contrast surfaces.
- Use `TextColors.Inverse` for text on dark/high-contrast surfaces.
- Do not create `HeaderGradient.Start` and `HeaderGradient.End` replacements
  unless an actual gradient is reintroduced.

### 6.4 Keep `Inverse` as a semantic role

`Inverse` is intentional.

`Inverse` must always mean:

> A color role meant for dark or high-contrast surfaces.

Valid examples:

```ts
SurfaceColors.Inverse;
TextColors.Inverse;
BorderColors.Inverse;
```

Invalid examples:

```ts
ButtonVariant.Inverse; // if it only means a random alternate button
BadgeVariant.Inverse; // if it does not map to inverse surface semantics
```

For components, prefer:

```tsx
<TurndownButton
	variant={ButtonVariant.Solid}
	tone={ComponentTone.Inverse}
>
	Save
</TurndownButton>
```

### 6.5 Feedback colors are semantic

Keep these semantic concepts:

- `Success`
- `Warning`
- `Error`
- `Info`

Do not use `Active` as a replacement for `Error`. If the existing red-orange
must be preserved visually, assign that value to `FeedbackColors.Error`.

### 6.6 Consolidate duplicate or misplaced colors

During migration:

- Remove `BrandColors.White`; use `NeutralColors.White`.
- Replace `BrandColors.Icon`; use `IconColors.Default` if introduced or
  `TextColors.Secondary`.
- Replace `BrandColors.TextPrimary`; use `TextColors.Primary`.
- Replace `BrandColors.SurfaceBorder`; use `BorderColors.Subtle`.
- Replace `BrandColors.Line`; use `BorderColors.Default`.
- Keep `BrandColors.Secondary` for the core dark green brand value.
- Keep the current green/gold visual identity unless a component already uses a
  token incorrectly.

## 7. Spacing, radius, icon, and typography system rules

### 7.1 Theme object rules

All theme objects must:

- Use `PascalCase` keys.
- Be exported `as const`.
- Export a derived value type when components need to reference the value type.
- Avoid duplicate values with different names unless the semantic role is
  useful.
- Avoid one-off component tokens unless the value is reused or meaningful across
  a component family.

Good:

```ts
export const Spacing = {
	XSmall: 8,
	Small: 16,
	Medium: 24,
	Large: 32,
	XLarge: 40,
} as const;

export type TSpacing = (typeof Spacing)[keyof typeof Spacing];
```

Bad:

```ts
export const PropertyHeroCardMagicSpacing = 17;
```

### 7.2 Spacing

Use `Spacing` for:

- gaps
- padding
- margins
- measured vertical rhythm
- minimum repeated layout offsets

Do not use raw spacing numbers in reusable components unless the value is a
runtime measurement or a documented local geometry constant.

Acceptable local geometry examples:

```ts
const TAB_PRESS_SCALE = 0.985;
const DEFAULT_MAX_VISIBLE_OPTIONS = 5;
```

Non-acceptable static styling:

```ts
paddingHorizontal: 15;
height: 50;
```

If a value exists only to compensate for border-width changes, document it
locally and keep it near the component. Do not add a theme token for that.

### 7.3 Radius

Use `Radius` for:

- cards
- inputs
- buttons
- badges/chips
- thumbnails
- headers

Use `Radius.Full` only for pill/circular shapes. The current `Radius.Full = 60`
works only for current sizes. Prefer `999` in a future token cleanup if circular
components grow beyond 120px.

### 7.4 Typography

`typography.ts` should own text roles only.

Target pattern:

```ts
export const TypographySize = {
	Display: 'Display',
	H1: 'H1',
	H2: 'H2',
	H3: 'H3',
	Body: 'Body',
	Body2: 'Body2',
} as const;

export type TTypographySize =
	(typeof TypographySize)[keyof typeof TypographySize];

export const TypographyWeight = {
	Regular: 'Regular',
	Medium: 'Medium',
	Semibold: 'Semibold',
	Bold: 'Bold',
} as const;

export type TTypographyWeight =
	(typeof TypographyWeight)[keyof typeof TypographyWeight];

export const TypographyTone = {
	Primary: 'Primary',
	Secondary: 'Secondary',
	Muted: 'Muted',
	Disabled: 'Disabled',
	Brand: 'Brand',
	Info: 'Info',
	Warning: 'Warning',
	Error: 'Error',
	Success: 'Success',
	Inverse: 'Inverse',
} as const;

export type TTypographyTone =
	(typeof TypographyTone)[keyof typeof TypographyTone];
```

`TypographyColors` should map `TTypographyTone` to `TextColors`.

Do not keep `Active` as a typography tone unless it maps to a clearly named
semantic action role. For links, prefer `Link` or `Brand`, not `Active`.

### 7.5 Icon sizes

Create `src/theme/icon-sizes.ts` and move icon sizing there.

Target pattern:

```ts
export const IconSizes = {
	Small: 18,
	Medium: 24,
	Large: 28,
	Navigation: 24,
	NavigationActive: 26,
} as const;

export type TIconSize = (typeof IconSizes)[keyof typeof IconSizes];

export const IconStrokeWidths = {
	Thin: 1,
	Regular: 2.5,
	Thick: 4,
} as const;

export type TIconStrokeWidth =
	(typeof IconStrokeWidths)[keyof typeof IconStrokeWidths];
```

Rules:

- Components should accept `size?: TIconSize` only when the prop maps to token
  values.
- Components should not expose raw `iconSize?: number` or `size?: number` unless
  the component is a low-level media/layout primitive.
- `AppIcon` may support a narrow raw numeric escape hatch only if SVG rendering
  makes token sizing impractical. Prefer token values first.

### 7.6 Shadows

Keep `Shadows` typed with `satisfies Record<string, ViewStyle>`.

Rules:

- Use shadows for cards, modals, header overlays, and bottom navigation.
- Do not put shadows on every nested element.
- Prefer border + muted surface for dense lists.

### 7.7 Layout and z-index

Use `Layout` for app-wide repeated dimensions:

```ts
export const Layout = {
	AuthHeaderHeight: 265,
	MainHeaderHeight: 265,
	ScreenHorizontalPadding: 16,
	BottomNavigationHeight: 76,
} as const;
```

Use `ZIndex` for overlay stacking only. Do not use arbitrary z-index values in
components.

## 8. Prop naming rules

### 8.1 `variant`

Use `variant` for the component's visual treatment or shape.

Examples:

```ts
export const ButtonVariant = {
	Solid: 'Solid',
	Outline: 'Outline',
	Ghost: 'Ghost',
	Link: 'Link',
} as const;
```

Good use:

```tsx
<TurndownButton variant={ButtonVariant.Outline} />
```

Bad use:

```tsx
<Badge variant='Success' />
```

`Success` is a color intent, so it should be `tone`.

### 8.2 `tone`

Use `tone` for semantic color intent.

Use one shared tone object unless a component needs a narrower local one:

```ts
export const ComponentTone = {
	Brand: 'Brand',
	Neutral: 'Neutral',
	Success: 'Success',
	Warning: 'Warning',
	Error: 'Error',
	Info: 'Info',
	Inverse: 'Inverse',
} as const;

export type TComponentTone = (typeof ComponentTone)[keyof typeof ComponentTone];
```

Good:

```tsx
<Badge tone={ComponentTone.Success}>Ready</Badge>
```

Bad:

```tsx
<Badge variant='Success'>Ready</Badge>
```

### 8.3 `size`

Use `size` for component scale.

Examples:

```ts
export const ComponentSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TComponentSize = (typeof ComponentSize)[keyof typeof ComponentSize];
```

Rules:

- Use `Medium`, not `Normal`.
- Do not expose raw pixel values for reusable UI component sizes.
- Size should affect a predictable group of values: height, padding, icon size,
  font size, or avatar diameter.

### 8.4 `align`

Use `align` for text alignment only.

Use this shape:

```ts
export const TextAlign = {
	Left: 'left',
	Center: 'center',
	Right: 'right',
} as const;

export type TTextAlign = (typeof TextAlign)[keyof typeof TextAlign];
```

Rules:

- Prefer `align` over `textAlign` on public text components if this refactor
  touches the API.
- Keep `textAlign` only if avoiding a breaking rename is more important in a
  narrow component.
- Do not use `align` for flex layout alignment. Use `justifyContent` or a layout
  component prop for layout alignment.

### 8.5 Boolean props

Use boolean props only for true state or layout toggles.

Allowed:

```ts
disabled;
loading;
selected;
isActive;
hasError;
fullWidth;
multiline;
multiSelect;
```

Not allowed:

```ts
primary;
secondary;
danger;
roundedGold;
isGreen;
```

When booleans start creating visual variants, replace them with `variant`,
`tone`, or `size`.

### 8.6 Raw style props

Do not expose raw visual props on normal reusable components.

Avoid:

```ts
color?: string;
backgroundColor?: string;
padding?: number;
radius?: number;
fontSize?: number;
iconSize?: number;
```

Accepted escape hatches:

- `style?: StyleProp<...>` on low-level text/media/layout primitives.
- `backgroundColor`, `contentBackgroundColor`, `horizontalPadding`, and related
  props on `Screen`, because screen composition sometimes needs one-off layout
  control.
- Dynamic animated styles and measured layout styles.

Rules for escape hatches:

- Use them sparingly.
- Do not add new raw props to business/domain components.
- Do not pass raw hex values when a semantic token exists.
- Document why the raw prop exists if it is not obvious.

### 8.7 Style-only props

Any prop that exists only to influence styling must be filtered with
`withFilteredProps`.

Examples that must be filtered:

```ts
variant;
tone;
size;
fullWidth;
selected;
isActive;
isFocused;
hasError;
rounded;
padding;
```

Do not filter valid React Native primitive props such as `disabled`, `onPress`,
`testID`, `accessibilityLabel`, or `children`.

## 9. Const-object typing pattern

### 9.1 Default pattern

Use const objects plus derived union types.

```ts
export const ButtonSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];
```

Use this for:

- variants
- tones
- sizes
- alignments
- statuses
- input types
- surface padding values
- typography sizes
- typography weights
- layout modes

Do not use TypeScript `enum`.

### 9.2 Token value types

For numeric theme maps:

```ts
export const Spacing = {
	XSmall: 8,
	Small: 16,
	Medium: 24,
	Large: 32,
} as const;

export type TSpacing = (typeof Spacing)[keyof typeof Spacing];
```

Use the value type only when the consumer truly accepts a token value.

### 9.3 Style maps

Use `satisfies` for component style maps.

```ts
const ButtonPaddingBySize = {
	Small: {
		paddingVertical: Spacing.XSmall,
		paddingHorizontal: Spacing.Small,
	},
	Medium: {
		paddingVertical: Spacing.Small,
		paddingHorizontal: Spacing.Medium,
	},
	Large: {
		paddingVertical: Spacing.Medium,
		paddingHorizontal: Spacing.Large,
	},
} satisfies Record<
	TButtonSize,
	{
		paddingVertical: number;
		paddingHorizontal: number;
	}
>;
```

This keeps autocomplete and catches missing map entries when a new size or tone
is added.

### 9.4 Shared versus local prop objects

Use local const objects when values only make sense for one component:

```ts
export const ButtonVariant = {
	Solid: 'Solid',
	Outline: 'Outline',
	Ghost: 'Ghost',
	Link: 'Link',
} as const;
```

Use a shared const object when the concept appears across many components:

```ts
export const ComponentTone = {
	Brand: 'Brand',
	Neutral: 'Neutral',
	Success: 'Success',
	Warning: 'Warning',
	Error: 'Error',
	Info: 'Info',
	Inverse: 'Inverse',
} as const;
```

Do not create a shared object for one component.

## 10. Component category prop rules

### 10.1 Button

Target public API:

```ts
export const ButtonVariant = {
	Solid: 'Solid',
	Outline: 'Outline',
	Ghost: 'Ghost',
	Link: 'Link',
} as const;

export type TButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const ButtonSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

export interface IButtonProps {
	children?: ReactNode;
	variant?: TButtonVariant;
	tone?: TComponentTone;
	size?: TButtonSize;
	fullWidth?: boolean;
	disabled?: boolean;
	loading?: boolean;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	align?: TTextAlign;
	accessibilityLabel?: string;
	testID?: string;
	onPress: () => void;
}
```

Rules:

- `variant` controls treatment: solid, outline, ghost, link.
- `tone` controls semantic color intent: brand, neutral, success, warning,
  error, inverse.
- `size` controls height, padding, and label size.
- Remove `Normal`; use `Medium`.
- Do not accept raw `color`, `backgroundColor`, `height`, or `padding`.
- Do not keep unused props such as `size` unless implemented.
- `Inverse` should be a tone, not a variant.
- Link buttons should make only the text pressable when visually presented as a
  text link.

### 10.2 Typography/Text

Target public API:

```ts
export interface ITypographyProps {
	children?: ReactNode;
	size?: TTypographySize;
	tone?: TTypographyTone;
	weight?: TTypographyWeight;
	align?: TTextAlign;
	underline?: boolean;
	numberOfLines?: number;
	testID?: string;
	style?: StyleProp<TextStyle>;
}
```

Rules:

- Prefer `tone` over `variant` for text color.
- Keep `style` as a narrow escape hatch because text often needs runtime
  overrides, but do not use it for static component styling.
- `Inverse`, `Success`, `Warning`, and `Error` map through `TextColors`.
- `Typography` should not own icon sizes or stroke widths.
- `numberOfLines` should pass through to native `Text`.

### 10.3 Icon

Target public API:

```ts
export interface IAppIconProps {
	name: TIconName;
	size?: TIconSize;
	tone?: TComponentTone;
	strokeWidth?: TIconStrokeWidth;
	disabled?: boolean;
	testID?: string;
}
```

Rules:

- `AppIcon` should render icons only.
- Interactive behavior belongs in `IconButton`, not `AppIcon`.
- Do not type `color` as typography variant and then pass raw hex values.
- Do not expose raw `color?: string` unless there is a documented one-off need.
- Keep SVG files unchanged.

### 10.4 IconButton

Target public API:

```ts
export const IconButtonVariant = {
	Solid: 'Solid',
	Ghost: 'Ghost',
	Soft: 'Soft',
} as const;

export interface IIconButtonProps {
	name: TIconName;
	accessibilityLabel: string;
	variant?: TIconButtonVariant;
	tone?: TComponentTone;
	size?: TComponentSize;
	iconSize?: TIconSize;
	disabled?: boolean;
	testID?: string;
	onPress: () => void;
}
```

Rules:

- `size` must map to button container size tokens.
- `iconSize` must map to icon size tokens.
- Do not accept raw numbers for either unless this remains a deliberate
  low-level escape hatch.
- `Ghost` should not imply a specific color by itself; use `tone`.

### 10.5 Input

Target public API:

```ts
export const InputType = {
	Text: 'Text',
	Email: 'Email',
	Password: 'Password',
	Phone: 'Phone',
	Number: 'Number',
} as const;

export type TInputType = (typeof InputType)[keyof typeof InputType];

export interface IInputProps {
	label?: string;
	placeholder?: string;
	type?: TInputType;
	value?: string;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	disabled?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	multiline?: boolean;
	onTrailingIconPress?: () => void;
	onChange: (text: string) => void;
}
```

Rules:

- Use a const object for `InputType`.
- Use `hasError`, not `error`, for boolean state.
- Use `errorMessage` for displayed validation text.
- Replace `rounded` with a `variant` only if there are multiple stable input
  shapes. Otherwise keep it local until a real design need exists.
- `isFocused` remains internal style state and must be filtered.
- Input border colors should come from `BorderColors`.

### 10.6 Dropdown

Target public API:

```ts
export interface IDropdownProps {
	label: string;
	options: ISelectOption[];
	value?: string | string[];
	placeholder?: string;
	multiSelect?: boolean;
	disabled?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	maxVisibleOptions?: number;
	testID?: string;
	onChange: (value: string | string[]) => void;
}
```

Rules:

- Keep `multiSelect` as a boolean because it changes real interaction behavior.
- Do not expose raw menu height, color, or padding props.
- Style-only props such as `isOpen` and `isSelected` must be filtered.
- Single-select should close after selecting an option.
- Multi-select should close only when the user taps away or otherwise dismisses.
- Menu positioning constants may remain local because they are geometry logic,
  not theme styling.

### 10.7 Card

Target public API:

```ts
export const CardVariant = {
	Default: 'Default',
	Elevated: 'Elevated',
	Outlined: 'Outlined',
	Muted: 'Muted',
} as const;

export interface ICardProps {
	children: ReactNode;
	variant?: TCardVariant;
	tone?: Extract<TComponentTone, 'Neutral' | 'Brand' | 'Inverse'>;
	padding?: TComponentPadding;
	testID?: string;
}
```

Rules:

- Use `variant` for elevation/border treatment.
- Use `tone` only if the card surface color changes semantically.
- Use tokenized padding values, not raw numeric padding.
- Keep card behavior simple; do not create header/footer compound APIs unless
  repeated usage proves the need.

### 10.8 Badge/Pill/Chip

Target public API for non-interactive badge:

```ts
export interface IBadgeProps {
	children: ReactNode;
	tone?: TComponentTone;
	variant?: TBadgeVariant;
	testID?: string;
}
```

Target public API for interactive chip:

```ts
export interface IChipProps {
	children: ReactNode;
	tone?: TComponentTone;
	selected?: boolean;
	disabled?: boolean;
	leadingIconName?: TIconName;
	accessibilityLabel?: string;
	testID?: string;
	onPress?: () => void;
}
```

Rules:

- `Success`, `Warning`, `Error`, and `Info` must be `tone`, not `variant`.
- `variant` may describe shape/treatment only, such as `Solid`, `Soft`, or
  `Outline`.
- `selected` is valid for chips because it is interaction state.
- Do not use both `status` and `tone` unless status is domain state and tone is
  visual mapping.

### 10.9 Alert/Notification

Target public API:

```ts
export const AlertVariant = {
	Banner: 'Banner',
	Inline: 'Inline',
	Card: 'Card',
} as const;

export interface IAlertProps {
	title?: string;
	message: string;
	tone?: Extract<TComponentTone, 'Info' | 'Success' | 'Warning' | 'Error'>;
	variant?: TAlertVariant;
	actionLabel?: string;
	testID?: string;
	onActionPress?: () => void;
}
```

Rules:

- Alerts require a feedback `tone`.
- Do not use `variant='Error'`.
- Error alerts use `FeedbackColors.Error` and `TextColors.Error`.
- Keep toast/global notification implementation separate from inline alert UI.

### 10.10 Row and ActionRow

`Row` target public API:

```ts
export interface IRowProps {
	children?: ReactNode;
	gap?: TSpacing;
	fillChildren?: boolean;
	justifyContent?:
		| 'space-between'
		| 'space-around'
		| 'space-evenly'
		| 'flex-start'
		| 'flex-end'
		| 'center';
}
```

`ActionRow` target public API:

```ts
export interface IActionRowProps {
	title?: string;
	description?: string;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	variant?: TActionRowVariant;
	tone?: TComponentTone;
	disabled?: boolean;
	accessibilityLabel?: string;
	testID?: string;
	onPress?: () => void;
}
```

Rules:

- `Row` is layout; it should not accept color/tone props.
- `ActionRow` may accept `variant` for treatment and `tone` for color intent.
- Keep `alignSelf: 'stretch'` behavior for full-width rows.
- Do not use raw width props unless a parent layout owns measurement.

### 10.11 Screen and layout components

Current `Screen` props are allowed to remain more flexible than normal UI
components because screen composition needs layout escape hatches.

Allowed raw-ish props on `Screen`:

```ts
backgroundColor?: string;
contentBackgroundColor?: string;
contentPadding?: number;
horizontalPadding?: number;
verticalPadding?: number;
bottomSpacing?: number;
gap?: number;
```

Rules:

- Do not copy these raw props into normal reusable UI components.
- Prefer theme tokens when passing these values.
- Keep `header` render function support because it enables scroll-aware headers.
- Keep `static`, `scroll`, and `list` modes.
- Do not create nested scroll containers inside `TurndownScrollScreen`.
- Preserve FlashList behavior for list mode.

## 11. Migration rules for the later refactor

Later implementation work must follow these rules:

1. Preserve current component behavior.
2. Preserve current visual appearance as closely as reasonable.
3. Allow only minor visual differences caused by standardized shared values.
4. Keep SVG files unchanged.
5. Remove `HeaderGradient` and replace runtime usage with semantic tokens.
6. Consolidate near-duplicate colors.
7. Replace raw colors and raw sizes in reusable components with theme tokens.
8. Replace raw string unions with exported const objects and derived types.
9. Use `tone` for semantic color intent.
10. Use `variant` for visual treatment only.
11. Use `size` only for component scale.
12. Use `align` only for text alignment.
13. Filter style-only props with `withFilteredProps`.
14. Do not add dependencies.
15. Do not add a ThemeProvider.
16. Do not redesign components.
17. Do not alter routes, API calls, auth behavior, or persisted state.
18. Do not add new barrel exports.
19. Do not expand theme scales unless a repeated use case exists.
20. Do not rename `Grey` to `Gray` as part of this refactor.

Recommended migration order:

1. Update `colors.ts` semantic buckets while temporarily preserving old exports
   if needed for incremental migration.
2. Add `icon-sizes.ts`.
3. Move icon tokens out of `typography.ts`.
4. Update `Typography` to use `tone` internally.
5. Update `Icon` and `IconButton`.
6. Update `Button`.
7. Update `Input` and `Dropdown`.
8. Update badge/chip/status components.
9. Update card/surface/action-row.
10. Replace `HeaderGradient` usages.
11. Remove deprecated color aliases once references are gone.

## 12. Examples of good and bad prop APIs

### 12.1 Button

Bad:

```ts
export interface IButtonProps {
	variant?: 'Primary' | 'Outline' | 'Inverse' | 'Link';
	color?: string;
	height?: number;
}
```

Problems:

- `Inverse` is a color intent inside `variant`.
- `color` accepts raw values.
- `height` accepts raw size values.

Good:

```ts
export interface IButtonProps {
	variant?: TButtonVariant;
	tone?: TComponentTone;
	size?: TButtonSize;
	fullWidth?: boolean;
	disabled?: boolean;
	onPress: () => void;
}
```

### 12.2 Badge

Bad:

```ts
export const BadgeVariant = {
	Default: 'Default',
	Success: 'Success',
	Error: 'Error',
} as const;
```

Good:

```ts
export const BadgeVariant = {
	Solid: 'Solid',
	Soft: 'Soft',
	Outline: 'Outline',
} as const;

export interface IBadgeProps {
	variant?: TBadgeVariant;
	tone?: TComponentTone;
}
```

### 12.3 Icon

Bad:

```ts
export interface IAppIconProps {
	color?: TTypographyVariant;
	size?: number;
	onPress?: () => void;
}
```

Problems:

- Icon color is coupled to typography.
- Raw numeric size leaks into component usage.
- Icon has button behavior.

Good:

```ts
export interface IAppIconProps {
	name: TIconName;
	tone?: TComponentTone;
	size?: TIconSize;
	strokeWidth?: TIconStrokeWidth;
}
```

### 12.4 Input

Bad:

```ts
export type TInputType = 'Text' | 'Email' | 'Password';

export interface IInputProps {
	rounded?: boolean;
	icon?: TIconName;
	color?: string;
}
```

Good:

```ts
export const InputType = {
	Text: 'Text',
	Email: 'Email',
	Password: 'Password',
	Phone: 'Phone',
	Number: 'Number',
} as const;

export interface IInputProps {
	type?: TInputType;
	leadingIconName?: TIconName;
	trailingIconName?: TIconName;
	hasError?: boolean;
	errorMessage?: string;
}
```

### 12.5 Style-only props

Bad:

```ts
export const StyledButton = styled(Pressable)<{
	variant: TButtonVariant;
	fullWidth: boolean;
}>(({ variant, fullWidth }) => ({
	...
}));
```

Good:

```ts
interface IButtonStyleProps {
	variant?: TButtonVariant;
	fullWidth?: boolean;
}

const FilteredPressable = withFilteredProps<
	PressableProps,
	IButtonStyleProps
>(Pressable, ['variant', 'fullWidth']);

export const StyledButton = styled(FilteredPressable)<IButtonStyleProps>(
	({ variant, fullWidth }) => ({
		...
	}),
);
```

## 13. Checklist for future component updates

Use this checklist for every component touched during the implementation
refactor.

### Scope

- [ ] No unrelated route changes.
- [ ] No API/data/auth changes.
- [ ] No dependency changes.
- [ ] No SVG changes.
- [ ] No component-level redesign.
- [ ] Current behavior is preserved.

### Theme

- [ ] No raw hex values outside `src/theme/colors.ts`.
- [ ] No static spacing/radius/font/icon values hard-coded in reusable styles.
- [ ] All colors map through semantic tokens.
- [ ] `HeaderGradient` is not introduced or reintroduced.
- [ ] `Success`, `Warning`, `Error`, `Info`, and `Inverse` map to semantic
      roles.

### Props

- [ ] `variant` describes treatment/shape only.
- [ ] `tone` describes semantic color intent.
- [ ] `size` describes component scale.
- [ ] `align` describes text alignment only.
- [ ] Boolean props represent real state or layout toggles.
- [ ] Raw visual props are avoided unless the component is a documented escape
      hatch.
- [ ] Const-object unions are used instead of string unions.
- [ ] No TypeScript `enum`.

### Styled-components

- [ ] Static styles are in `*.styles.ts`.
- [ ] Style-only props are filtered with `withFilteredProps`.
- [ ] Valid React Native props are not unnecessarily filtered.
- [ ] Dynamic runtime/animated styles are the only inline styles.
- [ ] Styled-component names are descriptive.

### TypeScript

- [ ] No `any`.
- [ ] `import type` is used for type-only imports.
- [ ] Style maps use `satisfies` where useful.
- [ ] Props interfaces use the `I<ComponentName>Props` pattern.
- [ ] Type aliases use the `T` prefix.

### Verification

- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Tests pass.
- [ ] Storybook stories still render for touched components.
- [ ] Components render close to the pre-refactor visual appearance.

## 14. Final verification commands

Run these after each implementation batch:

```bash
npm run format:check
npm run lint
npm test
npx tsc --noEmit
```

When formatting changes are expected:

```bash
npm run format
npm run lint:fix
npm test
npx tsc --noEmit
```

When Storybook files are touched:

```bash
npm run storybook:generate
npm run storybook
```

Manual checks:

- Launch the app.
- Inspect auth screens.
- Inspect admin property screens.
- Inspect Storybook stories for touched components.
- Confirm dark/header surfaces still use inverse text correctly.
- Confirm error/success/warning states remain visually distinct.
