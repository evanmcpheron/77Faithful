# Props and composition

This document defines how component props should work when one component uses
another.

## Default rule

A parent component should expose props for its own purpose, not every prop
supported by its children. Broad prop pass-through makes the component library
harder to maintain and creates inconsistent screens.

## Good composition boundaries

| Component          | Should expose                                                       | Should not expose                                                    |
| ------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PropertyCard`     | `property`, `onPress`, optional primary actions, status data        | every `Card` padding, shadow, radius, and layout prop                |
| `JobCard`          | `job`, `onPress`, `onTrackPress`, `status`, concise assignment data | raw nested `Pressable`, `Card`, `StatusBadge`, and `Thumbnail` props |
| `FieldContainer`   | `label`, `helperText`, `errorText`, `required`, `children`          | text input value handling                                            |
| `Input`            | text input field props and field state                              | modal layout, submit behavior, unrelated validation orchestration    |
| `ImagePickerField` | `label`, `images`, `maxImages`, `onImagesChange`, `errorText`       | every `PhotoGrid`, `ActionSheet`, and uploader implementation detail |
| `Modal`            | structure, close/save callbacks, title, visibility                  | form validation and API submission logic                             |
| `Tabs`             | selected value, item config, content children                       | screen-specific business state                                       |

## Avoid broad prop pass-through

Do not do this:

```ts
export interface IPropertyCardProps extends ICardProps {
	property: Property;
	onPress: () => void;
}
```

That couples `PropertyCard` to all current and future `Card` props.

Prefer this:

```ts
export interface IPropertyCardProps {
	property: Property;
	disabled?: boolean;
	showActions?: boolean;
	onPress: (propertyId: string) => void;
	onChecklistPress?: (propertyId: string) => void;
	onAssignJobPress?: (propertyId: string) => void;
}
```

The component internally decides how to compose `Card`, `Thumbnail`,
`StatusBadge`, `KeyValueRow`, and `TurndownButton`.

## When pass-through is acceptable

Pass-through is acceptable only when the child prop is part of the parent
component's public purpose.

```ts
export interface IIconButtonProps {
	iconName: TIconName;
	accessibilityLabel: string;
	disabled?: boolean;
	testID?: string;
	onPress: () => void;
}
```

`testID`, `disabled`, and `onPress` are acceptable because they are direct
interaction props for `IconButton`.

## Semantic props over styling props

Prefer semantic props:

```ts
variant?: TButtonVariant;
size?: TButtonSize;
status?: TJobStatus;
```

Avoid raw styling props:

```ts
backgroundColor?: string;
padding?: number;
borderRadius?: number;
shadow?: ViewStyle;
```

Raw style props bypass theme tokens and lead to inconsistent screens.

## Domain component data props

Use one of these patterns.

### Whole domain object

Use this when the component displays most of the object and the domain type is
stable.

```ts
export interface IJobCardProps {
	job: WorkSession;
	onPress: (jobId: string) => void;
}
```

### View model object

Use this when the screen combines API data, derived status, counts, thumbnails,
or role-specific labels.

```ts
export interface IJobCardViewModel {
	id: string;
	propertyName: string;
	roomName: string;
	assigneeName: string;
	status: TJobStatus;
	thumbnailUrl?: string;
	checklistCompletedCount: number;
	checklistTotalCount: number;
}

export interface IJobCardProps {
	job: IJobCardViewModel;
	onPress: (jobId: string) => void;
	onTrackPress: (jobId: string) => void;
}
```

Use view models for dense cards in the screenshots because many cards combine
property, room, job, and checklist data.

## Children composition

Use `children` when composition improves readability and does not hide behavior.

```tsx
<ContentCard>
	<SectionHeader title='Checklist Execution' />
	<JobChecklistExecutionTable rows={checklistRows} />
</ContentCard>
```

Avoid children APIs when required data becomes unclear.

## Modal and form composition

The modal owns presentation. The form owns validation and submission logic.

```tsx
<Modal
	title='New Job'
	isVisible={isJobModalVisible}
	onClose={handleClose}
	onPrimaryAction={handleSubmitFromRef}
	primaryActionLabel='Create Job'
>
	<JobCreateForm
		ref={jobCreateFormRef}
		propertyId={propertyId}
	/>
</Modal>
```

Do not put job creation API logic inside `Modal`.

## Component ownership examples

### `FieldContainer`

Owns label, required marker, helper text, error text, and vertical spacing.

Does not own input value, keyboard type, password visibility, or dropdown option
rendering.

### `Input`

Owns text entry, focus/error/disabled visuals, and optional input icons.

Does not own form submission, API validation, or screen layout.

### `ImagePickerField`

Owns label/error composition, picker/camera actions, max image limit
enforcement, and image add/remove callbacks.

Does not own upload API mutation unless explicitly built as a higher-level
feature component.

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
