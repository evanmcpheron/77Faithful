# 07. Data display system

## Rules

- Prefer cards and rows over dense tables.
- Use tables only when columns are stable and few.
- Keep mobile tables to 2-4 columns.
- Use status badges consistently.
- Use stat cards for dashboard counts.
- Use key/value rows for metadata.

## Use `StatCard` for

- total properties
- pending jobs
- assigned tasks
- completed tasks
- inventory shortages
- damage reports

## Use `DataTable` for

- checklist execution
- pending checklist items
- damage report items
- inventory shortages
- subscription history

## Empty state structure

```txt
Icon
Title
Short explanation
Optional action
```

## Status labels

Use consistent wording:

- `Pending`
- `In Progress`
- `Completed`
- `Overdue`
- `Active`
- `Inactive`
- `Due`
