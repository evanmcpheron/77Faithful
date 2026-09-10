### Spacer

**Status:** Existing  
**Recommended path:** `src/components/ui/spacer/spacer.component.tsx`

**Purpose**  
Simple tokenized spacing utility.

**What it should not own**  
Do not own API calls, navigation side effects, global state, or unrelated
child-component props. The parent screen or feature hook should own data
loading, mutations, and route decisions.

**Used in screens**  
Auth forms and small one-off gaps.

**Composition**  
Styled spacer view.

**Suggested props**

```ts
export interface ISpacerProps {
	children?: ReactNode;
	variant?: TSpacerVariant;
	disabled?: boolean;
	testID?: string;
	onPress?: () => void;
}

export const SpacerVariant = {
	Default: 'Default',
	Muted: 'Muted',
	Brand: 'Brand',
} as const;

export type TSpacerVariant = (typeof SpacerVariant)[keyof typeof SpacerVariant];
```

**Prop guidance**

| Prop kind                    | Rule                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Required content/domain data | Keep explicit and typed.                                                     |
| Child pass-through props     | Only pass through when they are part of the component's public purpose.      |
| Styling props                | Use semantic props only; filter styling-only props with `withFilteredProps`. |
| Event handlers               | Name by user intent, such as `onTrackPress`, `onAssignPress`, or `onClose`.  |

**Variants**  
Use variants only when there is a repeated visual or behavioral need in the
screenshots. Do not add one-off variants.

**States**  
Support only relevant states: default, loading, disabled, selected, active,
error, empty, pressed, focused, completed, pending, and overdue.

**Behavior**  
The component should render from props and call callbacks. It should not fetch
data or navigate internally unless it is explicitly a navigation component.

**Accessibility**  
Interactive components need a role, accessible label when text is not visible,
and selected/disabled/expanded state where relevant. Icon-only controls require
labels.

**Styling notes**  
Use theme tokens for colors, spacing, typography, radius, and shadows. Avoid
static inline styles. Keep dense card spacing consistent with the screenshots.

**Example usage**

```tsx
<Spacer
/* Pass the documented props. Keep parent data and navigation outside. */
/>
```

**Implementation notes**  
Prefer `Stack`/`Inline` for structured layouts.

**Testing notes**  
Test meaningful behavior only: press callbacks, disabled/loading suppression,
selection changes, and accessibility state.
