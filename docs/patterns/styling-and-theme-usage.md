# Styling and theme usage

All component styling should use `styled-components/native` and project theme
tokens.

## File structure

```txt
src/components/ui/button/
	button.component.tsx
	button.types.ts
	button.styles.ts
```

Use `*.styles.ts` for new and migrated style files. Existing `*.styled.ts` files
should be renamed when the component is touched for migration.

## Theme token rule

Do not hard-code colors, spacing, typography sizes, radius values, shadow
values, icon sizes, or layout constants.

Use:

```ts
import { BrandColors, NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
```

## Filter style-only props

Styling-only props must not reach React Native primitives.

```ts
interface IButtonStyleProps {
	variant?: TButtonVariant;
	fullWidth?: boolean;
}

const FilteredPressable = withFilteredProps<PressableProps, IButtonStyleProps>(
	Pressable,
	['variant', 'fullWidth'],
);
```

Valid primitive props like `disabled` do not need filtering.

## Semantic style props

Good:

```ts
variant?: TButtonVariant;
size?: TButtonSize;
isSelected?: boolean;
hasError?: boolean;
fullWidth?: boolean;
```

Bad:

```ts
padding?: number;
backgroundColor?: string;
shadowOpacity?: number;
borderRadius?: number;
```

## Inline style exceptions

Inline styles are acceptable for animated values, runtime measurements, and
third-party component API requirements.

Do not inline static values like colors, padding, radius, or typography.

## Styled component naming

Use descriptive names:

```ts
StyledButton;
StyledButtonLabel;
StyledPropertyCard;
StyledPropertyCardImage;
StyledModalBackdrop;
StyledModalCard;
```

Avoid vague names like `Container`, `Wrapper`, `Box`, or `Inner` unless the file
is tiny and private.

## Shadows and borders

Use one of these patterns:

1. border-only for dense rows
2. subtle shadow for floating cards
3. stronger shadow for modals/bottom navigation

Do not stack heavy border and heavy shadow on every component.

## Color semantics

Create or reuse semantic tokens for repeated roles:

- primary brand
- surface background
- surface border
- muted text
- danger/error
- warning
- success/active
- info

Do not use raw hex values inside components.

## Variant discipline

A variant should exist only when repeated in multiple screens.

Acceptable:

```ts
ButtonVariant.Primary;
ButtonVariant.Secondary;
ButtonVariant.Ghost;
ButtonVariant.Destructive;
```

Avoid variants that describe one specific screen exception.

## Migrating old styles

When migrating a component:

- move static styles into `*.styles.ts`
- preserve behavior and props
- preserve animation timing unless the task is animation-specific
- replace hard-coded visuals with equivalent tokens
- do not rename route files or navigation targets
- run format/lint after migration

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
