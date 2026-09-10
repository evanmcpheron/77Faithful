### Screen

**Status:** Existing but should be extended  
**Recommended path:** `src/components/layout/screen/screen.component.tsx`

**Purpose**  
Base safe-area, keyboard-aware, static/scroll/list wrapper.

**What it should not own**  
Do not own API calls, navigation side effects, global state, or unrelated
child-component props. The parent screen or feature hook should own data
loading, mutations, and route decisions.

**Used in screens**  
All screens.

**Composition**  
SafeAreaView, KeyboardAvoidingView, ScrollView/FlashList.

**Suggested props**

```ts
export interface IScreenProps {
	children?: ReactNode;
	testID?: string;
}
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
<Screen
/* Pass the documented props. Keep parent data and navigation outside. */
/>
```

**Implementation notes**  
Keep as core scroll owner.

**Testing notes**  
Test meaningful behavior only: press callbacks, disabled/loading suppression,
selection changes, and accessibility state.
