# 05. Feedback and overlays

## Use the right overlay

| Component               | Use                                          |
| ----------------------- | -------------------------------------------- |
| Toast                   | Non-blocking success/error/info              |
| AlertBanner             | Inline persistent warning/error/info         |
| ConfirmationDialog      | Consequential confirmation                   |
| Modal                   | Centered focused task                        |
| BottomSheet             | Filters, action lists, short selection tasks |
| LoadingOverlay          | Brief save/submit overlay                    |
| BlockingProgressOverlay | Upload or non-interruptible operation        |

## Modal rules

- Width is screen width minus 32 px.
- Use radius Large/XLarge.
- Modal owns its own internal scroll only when content overflows.
- Do not close after save until parent confirms success.

## Bottom sheet rules

- Anchor to bottom.
- Respect bottom safe area.
- Dim backdrop.
- Sticky footer for actions.
- Apply/reset for filters.
- Avoid long keyboard-heavy forms in small sheets.

## Confirmation copy

Use consequence-specific copy.

Good:

- `Delete checklist item?`
- `This removes the item from this room checklist only.`
- `Delete`
- `Cancel`

Bad:

- `Are you sure?`

## State rules

- Skeleton for list/card loading.
- Button loading for submit.
- Empty state for successful empty data.
- Error state for failed data.
- Retry for recoverable errors.
