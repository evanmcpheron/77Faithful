# Icon and asset usage

Icons and images should be centralized so screens do not import raw assets
directly.

## SVG icons

SVG files live in:

```txt
src/assets/icons
```

Use `kebab-case.svg` filenames.

All icons should be registered in `iconMap`, and `TIconName` should be derived
from the map.

```ts
export const iconMap = {
	Home: HomeIcon,
	Properties: PropertiesIcon,
	Jobs: JobsIcon,
} as const;

export type TIconName = keyof typeof iconMap;
```

## AppIcon rules

Screens should render icons through `AppIcon`.

```tsx
<AppIcon
	name='Jobs'
	size={IconSizes.Medium}
	tone={ComponentTone.Brand}
/>
```

Do not import raw SVG components in screens.

## IconButton rules

Interactivity should move to `IconButton`, not `AppIcon`.

```tsx
<IconButton
	accessibilityLabel='Open filters'
	name='Filter'
	onPress={handleOpenFilters}
/>
```

This keeps `AppIcon` as a pure renderer and makes accessibility consistent.

## Icon sizing

Add `IconSizes` when needed:

```ts
export const IconSizes = {
	Small: 16,
	Medium: 24,
	Large: 32,
	Navigation: 24,
	NavigationActive: 26,
} as const;
```

Do not hard-code icon sizes across screens.

## Image assets

Use `AppImage`, `ImageThumbnail`, `ImageCarousel`, or domain media components.
Do not scatter raw `Image` usage across feature screens once media components
exist.

## Remote images

For remote property, room, job, proof, and damage images:

- use explicit width and height
- show placeholder/fallback state
- handle load failures
- avoid huge uncompressed images
- prefer `expo-image` through `AppImage`

## Upload assets

Use `ImagePickerField` and media services/utilities for
picking/compression/upload flow.

Rules:

- compress large camera images before upload
- enforce max count at the field level
- show thumbnail previews
- allow removal before submit
- do not upload from a primitive `PhotoGrid`

## Proof photos

Checklist proof photos and damage proof photos are domain-specific displays:

- `ProofPhotoViewer`
- `DamageProofViewer`
- `BeforeAfterPhotoRow`

These may compose generic media components but should own domain labels and
status meaning.

## Accessibility

- Decorative icons should be hidden from accessibility if supported.
- Icon-only buttons require clear labels.
- Status icons should be paired with readable text; do not rely on color alone.

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
