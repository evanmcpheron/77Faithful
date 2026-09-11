## Date Formatting & Helpers

`import { ... } from '@td/utils/object/date.util'`

### Formatting

```ts
formatDate(new Date()); // '04/21/2025'  (MM/DD/YYYY default)
formatDate('2025-01-15', 'MM/DD/YY HH:mm A'); // '01/15/25 00:00 AM'
formatDate(undefined); // '--'

timeAgo(new Date()); // 'a few seconds ago'
timeAgo('2024-01-01'); // '3 months ago'
timeAgo(undefined); // '--'
```

### Arithmetic

```ts
addDays('2025-01-01', 7); // Date => 2025-01-08
subtractDays('2025-01-08', 7); // Date => 2025-01-01
daysBetween('2025-01-01', '2025-01-08'); // 7  (always absolute)
```

### Boundaries

```ts
startOfDay('2025-04-21T14:30:00'); // Date => 2025-04-21T00:00:00.000
endOfDay('2025-04-21T08:00:00'); // Date => 2025-04-21T23:59:59.999
```

### Predicates

```ts
isToday(new Date()); // true
isPast('2020-01-01'); // true
isFuture('2099-01-01'); // true
```

All functions accept `Date | string | undefined`. Undefined returns `'--'` for
formatters and `false` for predicates.

**Available format tokens**

| Token              | Example                  |
| ------------------ | ------------------------ |
| `MM/DD/YYYY`       | `04/21/2025` _(default)_ |
| `MM/DD/YY HH:mm A` | `04/21/25 14:30 PM`      |
