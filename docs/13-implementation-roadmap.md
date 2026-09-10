# 13. Implementation roadmap

## Phase 1: Existing primitives

Components: `Typography`, `TurndownButton`, `AppIcon`, `IconButton`, `Card`,
`Divider`, `Spacer`.

Why first: everything composes these.

Acceptance:

- no new barrel exports
- no static inline styles
- icon-only actions use `IconButton`
- existing auth UI still renders

## Phase 2: Tokens

Files: colors, spacing, typography, radius, shadows, layout, icon sizes,
z-index.

Acceptance:

- no new hard-coded visual values
- bottom nav spacing centralized

## Phase 3: Layout

Components: `Screen`, `ScrollScreen`, `ListScreen`, `StaticScreen`, `Stack`,
`Inline`, `Section`, `SectionHeader`, `StickyFooter`, `SplitActionFooter`,
`AuthShell`.

Acceptance:

- one scroll owner per screen
- keyboard-safe forms
- safe-area-aware footers

## Phase 4: Forms

Components: `FieldContainer`, `Input`, `PasswordInput`, `SearchInput`,
`TextArea`, `Dropdown`, `Checkbox`, `RadioGroup`, `DateInput`, `TimeInput`,
`FormActions`, `FormSection`, `ImagePickerField`.

Acceptance:

- controlled values
- error/helper text
- dropdown behavior preserved

## Phase 5: Feedback

Components: `Modal`, `BottomSheet`, `ConfirmationDialog`, `ActionSheet`,
`LoadingOverlay`, `Toast`, `EmptyStateCard`, `ErrorStateCard`.

Acceptance:

- controlled visibility
- safe area respected
- explicit close behavior

## Phase 6: Data display

Components: `StatCard`, `StatGrid`, `ListItem`, `DataTable`, `KeyValueList`,
`StatusSummaryCard`.

Acceptance:

- readable mobile density
- consistent status labels

## Phase 7: Media

Components: `AppImage`, `ImageThumbnail`, `PhotoGrid`, `ImageUploader`,
`ImageViewer`, `ProofPhotoViewer`.

Acceptance:

- thumbnails in lists
- upload UI separated from upload API

## Phase 8: Property and room

Build property/room components and forms.

Acceptance:

- property list/detail composition works
- room checklist/inventory relationships are represented

## Phase 9: Checklist, inventory, damage

Acceptance:

- template vs room checklist behavior preserved
- inventory remains room-specific
- proof viewing supported

## Phase 10: Jobs, company, team

Acceptance:

- assignment separates internal team vs external provider
- provider workers are not owner team members

## Phase 11: Replace duplicated UI

Replace auth inline layout, placeholders, repeated rows/cards.

## Phase 12: Focused tests

Add tests for behavior-heavy components and utilities.
