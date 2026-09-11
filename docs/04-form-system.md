# 04. Form system

## Core rule

Forms are controlled and predictable.

- Fields receive `value` and `onChange`.
- Forms own validation state.
- Screens own navigation and modal close.
- Services/hooks own API calls.
- Use imperative refs only when the submit button lives outside the form.

## Field architecture

```txt
FieldContainer
  label
  helper text
  error text
  children field
```

`FieldContainer` owns label/helper/error. Inputs should focus on input behavior.

## Existing components

Keep and extend:

- `Input`
- `Dropdown`
- `Checkbox`

## Validation

Start with feature-local typed validation helpers.

```txt
src/features/properties/utils/property-form.utils.ts
src/features/jobs/utils/job-form.utils.ts
```

Use typed error maps:

```ts
export interface IPropertyFormErrors {
	displayName?: string;
	propertyType?: string;
	addressLine1?: string;
	city?: string;
	stateCode?: string;
	postalCode?: string;
}
```

## Imperative modal form pattern

Use only when modal footer owns the save button.

```ts
export interface IBaseFormWithIdRefProps {
	submitData: (
		callback: (success: boolean, id: string | null) => void,
	) => void;
}
```

Rules:

- prevent double submit
- keep validation in the form
- keep navigation/modal closing in the parent
- show API errors
- avoid `forwardRef` when normal props are clearer

## Dropdown behavior

- Single-select closes after selecting.
- Multi-select stays open until backdrop press.
- Arrow rotates with open state.
- Menu avoids top/bottom screen overflow.
- Selected multi-values can render as chips.
