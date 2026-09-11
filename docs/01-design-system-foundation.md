# 01. Design system foundation

## Token files

Use existing token files first:

```txt
src/theme/colors.ts
src/theme/spacing.ts
src/theme/typography.ts
src/theme/radius.ts
src/theme/shadows.ts
src/theme/icon-sizes.ts
src/theme/layout.ts
src/theme/z-index.ts
```

## Color usage

| Purpose           | Token                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Primary CTA       | `BrandColors.Primary`                                               |
| Brand/dark header | `SurfaceColors.Header` or `SurfaceColors.Inverse`                   |
| Text              | `TextColors` through `TypographyColors`                             |
| Borders           | `BorderColors.Default`, `BorderColors.Subtle`, `BorderColors.Error` |
| Success           | `FeedbackColors.Success`                                            |
| Warning           | `FeedbackColors.Warning`                                            |
| Error/destructive | `FeedbackColors.Error`                                              |
| Background        | `SurfaceColors.Screen`, `SurfaceColors.Card`, `SurfaceColors.Muted` |

## Spacing rules

| Purpose                   |      Recommended value |
| ------------------------- | ---------------------: |
| Screen horizontal padding |                     16 |
| Field gap                 |                     16 |
| Label-to-field gap        |                      8 |
| Card padding              |               16 or 24 |
| Section gap               |               24 or 32 |
| Bottom nav extra spacing  | centralize in `Screen` |

## Typography hierarchy

| Role              | Size                           |
| ----------------- | ------------------------------ |
| Screen/auth title | `Display`                      |
| Card title        | `H1` / `H2`                    |
| Field label       | `H3` + Semibold                |
| Body              | `Body`                         |
| Metadata          | `Body2` or `Body` + muted tone |

## Radius rules

| Element              |                           Radius |
| -------------------- | -------------------------------: |
| Inputs               | `Radius.Medium` / `Radius.Large` |
| Cards                |                   `Radius.Large` |
| Auth panel           |                  `Radius.XLarge` |
| Chips/badges/buttons |                    `Radius.Full` |
| Thumbnails           |                  `Radius.Medium` |

## Shadow rules

Use shadows for:

- auth card
- property/job cards where separation is needed
- custom bottom navigation
- modal card

Avoid shadows on every chip, input, table row, or nested card. Prefer border +
muted surface for dense content.

## Layout constants

Current app-wide layout constants live in `src/theme/layout.ts`. Add to this
file only when a value is repeated across app-level layout concerns.

```ts
export const Layout = {
	AuthHeaderHeight: 265,
	MainHeaderHeight: 265,
	ScreenHorizontalPadding: 16,
	BottomNavigationHeight: 76,
} as const;
```

## Icon sizes

Icon size and stroke width tokens live in `src/theme/icon-sizes.ts`.

```ts
export const IconSizes = {
	Small: 18,
	Medium: 24,
	Large: 28,
	Navigation: 24,
	NavigationActive: 26,
} as const;
```

## UX rules

- One dominant title per screen/card.
- One primary action per form/screen section.
- Primary action is filled gold.
- Secondary action is outline/link.
- Destructive action is separated and confirmed.
- Search/filter controls sit above lists.
- Date strips show selected date and today clearly.
- Status labels use consistent wording.
- Do not rely on shadows for visual hierarchy.
