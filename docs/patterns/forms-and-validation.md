# Forms and validation

Turndown forms should be predictable, keyboard-safe, and reusable between
screens and modals.

## Form architecture

Use three layers:

1. **Field components:** `Input`, `Dropdown`, `Checkbox`, `DateInput`,
   `ImagePickerField`.
2. **Form components:** `PropertyForm`, `JobCreateForm`, `InviteTeamMemberForm`.
3. **Screen/modal containers:** decide when to open/close and where to navigate
   after success.

## FieldContainer pattern

Every field with a label, helper text, or error text should use
`FieldContainer`.

```ts
export interface IFieldContainerProps {
	children: ReactNode;
	label?: string;
	helperText?: string;
	errorText?: string;
	required?: boolean;
	disabled?: boolean;
	testID?: string;
}
```

`FieldContainer` keeps label spacing consistent across text inputs, dropdowns,
date inputs, image upload fields, and custom selectors.

## Controlled fields

Prefer controlled form fields.

```tsx
<Input
	label='Email'
	value={email}
	keyboardType='email-address'
	autoCapitalize='none'
	errorText={emailError}
	onChangeText={setEmail}
/>
```

The existing `Checkbox` should be refactored from internal `defaultValue` state
into controlled behavior:

```ts
export interface ICheckboxProps {
	checked: boolean;
	disabled?: boolean;
	label?: string;
	onChange: (checked: boolean) => void;
}
```

## Validation ownership

| Concern                  | Owner                                     |
| ------------------------ | ----------------------------------------- |
| Required field checks    | Form component                            |
| Field error display      | Field component through `errorText`       |
| API validation mapping   | Form component or feature hook            |
| Navigation after success | Parent screen/modal                       |
| Toast/error banner       | Parent screen or form, depending on scope |

Primitive field components must not know about `Property`, `Job`, or backend
error codes.

## Imperative form refs

Use the forwardRef submission pattern only when the submit button lives outside
the form, usually inside a modal footer or sticky screen footer.

```ts
export interface IBaseFormWithIdRefProps {
	submitData: (
		callback: (success: boolean, id: string | null) => void,
	) => void;
}
```

Rules:

- prevent double submission with `isSubmitting`
- keep validation inside the form
- keep closing/navigating in the parent
- surface API errors; do not silently fail
- do not use this pattern for simple forms with an internal submit button

## Form sections

Use `FormSection` for grouped fields.

```tsx
<FormSection title='Property Details'>
	<Input
		label='Property Name'
		value={name}
		onChangeText={setName}
	/>
	<Dropdown
		label='Property Type'
		value={propertyType}
		options={propertyTypeOptions}
	/>
</FormSection>
```

Practical groups:

- **Property Details:** name, type, square footage
- **Address:** city/state, ZIP, address lines
- **Access Details:** entry code, Wi-Fi, parking, notes
- **Job Details:** date, property, room, assignee, severity
- **Checklist Item:** name, photo requirement, remarks

## Button placement

- Primary save button belongs at the bottom of forms.
- Long forms should use `StickyFooter` or the existing `Screen` footer pattern.
- Secondary actions should be visually lighter and placed above or beside the
  primary action.
- Destructive actions should not be adjacent to the primary save action unless
  confirmation is required.

## Keyboard handling

Use `Screen`/`ScrollScreen` with keyboard support. Do not manually wrap every
form in nested `KeyboardAvoidingView` and `ScrollView`.

Rules:

- one vertical scroll owner per screen
- no nested `ScrollView` inside `ScrollScreen`
- form content uses `Stack` or `FormSection` for spacing
- footer actions stay visible when practical

## Field-specific guidance

### `PasswordInput`

Split password visibility toggle out of generic `Input` once the current `Input`
is extended.

### `Dropdown` and `MultiSelectDropdown`

The existing `Dropdown` already supports single and multi-select behavior. Keep
one implementation if the API stays readable. Exporting a `MultiSelectDropdown`
wrapper is acceptable if it improves call sites.

Single-select should close after selection. Multi-select should stay open until
outside tap or explicit close.

### `DateTimeField`

Use composed fields rather than one overloaded component when screens need
independent date and time selection.

### `ImagePickerField`

Use this for profile images, property images, proof photos, damage photos, and
checklist attachments. It should compose `FieldContainer`, `PhotoGrid`, and
image actions.

## Error handling UX

- Show field-level errors directly under the field.
- Show form-level errors in `AlertBanner` at the top of the form or card.
- Preserve typed values after validation failure.
- Disable primary action while submitting.
- Do not show a toast for every field validation error.

## Validation examples

```ts
export interface IPropertyFormErrors {
	displayName?: string;
	propertyType?: string;
	city?: string;
	stateCode?: string;
	postalCode?: string;
}
```

Use explicit error shapes for substantial forms instead of generic
`Record<string, string>`.

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
