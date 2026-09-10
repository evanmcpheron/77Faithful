# 06. Navigation system

## Bottom navigation

The existing custom bottom navigation is fragile.

Rules:

- Do not change route names during UI work.
- Do not change tab order unless explicitly requested.
- Do not change animation constants unless the task is navigation animation.
- Keep geometry helpers in `navigation.utils.ts`.
- Keep rendering in `navigation.component.tsx`.
- Keep styles in `navigation.styles.ts`.

## Route files

Route files stay thin:

```tsx
import { AdminPropertiesScreen } from '@td/features/properties/screens/admin-properties.screen';

export default AdminPropertiesScreen;
```

No API calls, large styles, or business logic in route files.

## Local tabs

Use:

- `TabsLayout` for Expo Router tabs.
- `Tabs` for in-screen content tabs.
- `SegmentedControl` for filtering/switching without tab body.

## Date strip

Use for jobs/dashboard scheduling.

Rules:

- show selected date clearly
- show today clearly
- keep horizontal list bounded
- do not make it the only way to navigate large date ranges

## Header icon actions

Use `HeaderIconButton`. Every icon-only control needs an accessibility label.
