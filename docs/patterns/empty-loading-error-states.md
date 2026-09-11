# Empty, loading, and error states

State handling should be consistent across screens so the app feels reliable
while data is loading or missing.

## State ownership

| State                   | Owner                                                  |
| ----------------------- | ------------------------------------------------------ |
| Full-screen loading     | `Screen`                                               |
| Full-screen empty       | `Screen` or `EmptyStateCard` in list empty component   |
| Full-screen error       | `Screen` or `ErrorStateCard`                           |
| Inline card loading     | `Skeleton` or card-local loading block                 |
| Form submission loading | form component and submit button                       |
| Blocking operation      | `BlockingProgressOverlay` only when the user must wait |

## Loading states

### Full screen initial load

```tsx
<Screen
	isLoading={isLoadingProperties}
	loadingMessage='Loading properties...'
>
	{content}
</Screen>
```

### List refresh

Use pull-to-refresh and keep existing content visible.

### Card skeleton

Use `Skeleton` when a card layout is known but data is pending. Do not show a
spinner for every small card on a dense dashboard.

## Empty states

Empty states should include a clear title, one sentence explaining what is
missing, one primary action when the user can fix it, and optional icon.

| Screen              | Empty state                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| Property list       | “No properties yet” + “Add Property”                                   |
| Jobs                | “No jobs scheduled” + “New Job”                                        |
| Checklist templates | “No checklists yet” + “New Checklist”                                  |
| Team                | “No team members yet” + “Invite Team Member”                           |
| Inventory           | “No inventory items yet” + “Add Item”                                  |
| Damage reports      | “No damage reports” without a primary action if there is nothing to do |

## Error states

Use `ErrorStateCard` when content cannot load.

```tsx
<ErrorStateCard
	title='Unable to load jobs'
	message='Check your connection and try again.'
	actionLabel='Retry'
	onActionPress={refetchJobs}
/>
```

Do not display stack traces or raw server messages.

## Form errors

- Field errors render under fields.
- Form-level errors render in an `AlertBanner` near the top of the form.
- API conflicts, permission errors, and server failures should not be forced
  into field errors unless they map to a specific field.

## Offline and retry behavior

For future offline support:

- keep cached content visible when possible
- show an inline stale/offline banner
- queue writes only when the behavior is intentionally designed
- avoid pretending a failed mutation succeeded

## Blocking overlays

Use `BlockingProgressOverlay` sparingly.

Appropriate:

- finalizing a critical upload
- processing a payment/subscription change
- creating a large job with many checklist assignments

Not appropriate:

- normal list refresh
- every form submit
- simple delete confirmation

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
