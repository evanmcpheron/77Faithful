# Modal and bottom sheet patterns

Turndown uses modals and overlays for assignment, filtering, confirmation,
company switching, and checklist customization prompts.

## Choose the right overlay

| Use case                                | Recommended component                         |
| --------------------------------------- | --------------------------------------------- |
| Confirm destructive or important action | `ConfirmationDialog`                          |
| Short focused decision                  | `Modal`                                       |
| Mobile filter controls                  | `BottomSheet`                                 |
| Long form with save/cancel              | Full-screen route or `Modal` with scroll body |
| Simple list of actions                  | `ActionSheet`                                 |
| Blocking network progress               | `BlockingProgressOverlay`                     |

## Modal responsibilities

`Modal` owns backdrop, card placement, close affordance, title/subtitle area,
footer actions, keyboard-safe content area, and accessibility modal semantics.

`Modal` does not own form validation, API submission logic, domain-specific
assignment rules, or navigation after success.

## Bottom sheet responsibilities

`BottomSheet` owns bottom anchoring, drag/close behavior if implemented,
safe-area bottom padding, maximum height, and optional sticky footer.

Use bottom sheets for filters because they keep the list context visible.

## Assignment modal pattern

The assign job UI appears repeatedly. Keep it as a domain component.

```tsx
<JobAssignmentModal
	isVisible={isAssignModalVisible}
	assignmentTarget={assignmentTarget}
	internalTeamMembers={internalTeamMembers}
	externalProviderCompanies={providerCompanies}
	onClose={handleCloseAssignModal}
	onAssignInternalMember={handleAssignInternalMember}
	onAssignExternalProvider={handleAssignExternalProvider}
/>
```

Rules:

- owner company chooses internal team member or external provider company
- external provider company assigns internally to its workers later
- provider workers are not flattened into the owner company team

## Filter panel pattern

Use a generic `FilterPanel` only for structure. Feature filter panels own their
filter fields.

```tsx
<BottomSheet
	isVisible={isFilterVisible}
	onClose={handleCloseFilters}
>
	<PropertyFilterPanel
		value={propertyFilters}
		properties={properties}
		onChange={setPropertyFilters}
		onApply={handleApplyFilters}
	/>
</BottomSheet>
```

## Confirmation dialog pattern

Use `ConfirmationDialog` for deleting a checklist item, discarding unsaved
changes, removing a team member, cancelling a job, or customizing a room
checklist from a template.

Do not use a full form modal for yes/no decisions.

## Checklist customization prompt

The checklist customization prompt should be domain-specific.

```tsx
<ChecklistCustomizePrompt
	isVisible={isPromptVisible}
	checklistTemplateName={templateName}
	onUseTemplate={handleUseTemplate}
	onCustomize={handleCustomizeRoomChecklist}
	onClose={handleClose}
/>
```

Rules:

- using a template assigns the reusable template without mutation
- customizing creates or updates a room-specific checklist copy
- editing the room checklist must not mutate the original template unless the
  user explicitly edits the template screen

## Modal sizing

- Small decision dialogs: content-sized card, centered.
- Filter panels: bottom sheet, up to roughly 80% screen height.
- Long forms: full-screen route is usually better than a modal.
- Avoid tiny scrollable content areas inside centered cards.

## Backdrop behavior

- Tapping backdrop closes non-destructive transient overlays.
- Tapping backdrop should not close while submitting.
- Destructive confirmations should require explicit cancel/confirm.

## Accessibility

- Modal title should be readable by screen readers.
- Close icon buttons need `accessibilityLabel='Close'`.
- Focus should move logically into the modal where supported.
- Overlay content should not rely on dimming alone to communicate disabled
  background state.

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
