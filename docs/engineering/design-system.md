# Design system

Updated 2026-09-07. The repository has a small set of theme primitives with working color overrides and accessible collapsibles. The blue 77/path/cross identity is selected for product work; route screens now use minimal navigation placeholders; the splash and configured artwork still use starter assets. This document separates implemented tokens from the visual direction and remaining production assets.

## Colors and theme selection

[src/constants/theme.ts](../../src/constants/theme.ts) exports `Colors` with matching light/dark keys and a `ThemeColor` key type:

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| `text`               | `#000000` | `#ffffff` |
| `background`         | `#ffffff` | `#000000` |
| `backgroundElement`  | `#F0F0F3` | `#212225` |
| `backgroundSelected` | `#E0E1E6` | `#2E3135` |
| `textSecondary`      | `#60646C` | `#B0B4BA` |
| `link`               | `#1B5FA7` | `#91C7FF` |

`useTheme` selects this palette using the shared `useColorScheme` hook and maps `unspecified` to light. On web, `useSyncExternalStore` reads `Appearance`, subscribes to changes, and uses light for the server and initial hydration snapshot. Layout, tabs, and navigation placeholders use the shared hooks. Router's `ThemeProvider` still uses its separate default light/dark navigation themes. There is no saved theme preference or custom navigation palette.

Colors outside the shared palette include the starter logo gradient (`#3C9FFE` to `#0274DF`), splash blue (`#208AEF`), and Android adaptive-icon background (`#E6F4FE`). These are remaining starter artwork values. Primary link colors now use the theme palette. There are no success, warning, or error color tokens.

## Typography

[ThemedText](../../src/components/themed-text.tsx) wraps React Native `Text`, forwards its props, and supports these variants. Sizes are the numeric style values in source; an unset value inherits platform/parent behavior.

| `type`        | Font size | Line height | Weight                        |
| ------------- | --------- | ----------- | ----------------------------- |
| `default`     | 16        | 24          | 500                           |
| `small`       | 14        | 20          | 500                           |
| `smallBold`   | 14        | 20          | 700                           |
| `title`       | 48        | 52          | 600                           |
| `subtitle`    | 32        | 44          | 600                           |
| `link`        | 14        | 30          | Unset                         |
| `linkPrimary` | 14        | 30          | Unset                         |
| `code`        | 12        | Unset       | 700 on Android; 500 otherwise |

Text defaults to the palette's `text` color; `linkPrimary` defaults to `link`. An explicit `themeColor` takes precedence over either default, and caller `style` comes last. Font sizes/weights are centralized in this component, not exported as standalone tokens.

`Fonts` defines `sans`, `serif`, `rounded`, and `mono` families: iOS uses system design family names; the default branch uses `normal`, `serif`, `normal`, and `monospace`; web uses CSS variables from [src/global.css](../../src/global.css). The web sans stack starts with Spline Sans and Inter and falls back to system fonts, but there is no bundled font asset or custom font-loading code. Only `code` explicitly applies a `Fonts` family (`mono`) in `ThemedText`; other variants do not apply `Fonts.sans` automatically.

## Spacing, radius, and sizing

The existing `Spacing` scale is intentionally recorded exactly; the key names are not multipliers.

| Key     | Value |
| ------- | ----- |
| `half`  | 2     |
| `one`   | 4     |
| `two`   | 8     |
| `three` | 16    |
| `four`  | 24    |
| `five`  | 32    |
| `six`   | 64    |

`MaxContentWidth` is 800. `BottomTabInset` remains an unused starter token: iOS 50, Android 80, and 0 otherwise. Navigation placeholders do not use it. It is not a measured safe-area inset or live tab-bar height.

There are no dedicated radius tokens. Components reuse spacing values for radii: collapsible content and web tab buttons use 16. The collapsible icon box uses a literal radius of 12 and the logo uses 40. No shared elevation/shadow scale or control-height/touch-target sizing tokens exist; image and icon dimensions are mostly local values.

## Reusable primitives

| Component / hook                            | Existing responsibility and limits                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ThemedText`                                | Shared text variants and palette selection; a link text style does not itself make text interactive                 |
| `ThemedView`                                | Background-colored `View`, with `type` selecting a palette key; forwards native view props and allows caller styles |
| `useTheme` / `useColorScheme`               | System palette selection with a web hydration fallback                                                              |
| `ExternalLink`                              | Router link with native in-app browser behavior                                                                     |
| `Collapsible`                               | Local open/closed state, chevron, press feedback, and animated content entry                                        |
| `NavigationPlaceholder` / `PlaceholderLink` | Temporary scrollable scaffold and accessible typed link rows; not a final screen/form framework                     |
| `SettingsHeaderAction`                      | Shared 48-point Settings link for the Today/Journey stack headers                                                   |
| `AppTabs`                                   | Platform-specific native/web navigation; see [project context](project-context.md)                                  |
| `AnimatedIcon`, `AnimatedSplashOverlay`     | Preserved starter branding/splash infrastructure; hint row and web badge removed                                    |

`ThemedView` honors the active scheme's `lightColor`/`darkColor` override, falls back to the selected palette token when that override is absent, and applies caller `style` last. Prefer tokens for ordinary screen work; use overrides only when a specific surface needs them. There is no final product button, input, card, or loading/empty/error system. `NavigationPlaceholder` is a temporary screen treatment using the existing themed primitives; `PlaceholderLink` supplies underlined link rows with a minimum 48-point target and pressed feedback.

## Layout and interaction conventions

This guide owns visual primitives and layout techniques. Before changing screen boundaries, navigating CTAs, tabs, headers/back behavior, editors, or modal/sheet flows, read [the navigation and UX contract](../APP_NAVIGATION_AND_UX.md). It owns screen relationships, flow states, and placement; visual consistency or component extraction alone does not justify new screens. An intentional material behavior change updates that contract in the same change; small visual adjustments do not.

Static styles are generally colocated `StyleSheet.create` objects. Style arrays layer dynamic palette values, platform adjustments, pressed state, and caller overrides. Web additionally uses a CSS module for the logo gradient and global CSS font variables imported through the theme module; there is no utility-class styling system.

- Navigation placeholders use one `ScrollView`, `contentInsetAdjustmentBehavior="automatic"` for iOS navigation insets, safe-area padding where needed, existing spacing, and centered content capped at 800. Welcome accounts for its headerless layout. There are no fixed tab-height offsets, final forms, or fixed-height text cards.
- Native tabs retain system tab controls and inset handling. Web uses a flex layout with the tab bar beneath the content, keeping content clear of the bar without a hard-coded offset.
- Each tab has a native stack header with a consistent labeled Settings action and no back control. Pushed screens use native stack headers/back behavior; the root theme provider remains in place.
- Several pressable examples reduce opacity to 0.7 when pressed. `Collapsible` mounts content with a 200 ms fade-in. Its trigger exposes a button role, the title as its accessible label, and expanded state; it has a minimum 48-by-48 target, a decorative icon, and a wrapping title.
- The logo examples use Reanimated keyframes (600 ms native, 300 ms web, plus a four-minute glow rotation). The native splash overlay is hidden after its animation; the web overlay returns `null`. There is no application-level reduced-motion policy demonstrated in source.

Native visual/interaction checks were not recorded during engineering setup on 2026-09-07. The navigation foundation replaces Home/Explore layout limitations, but runtime safe areas, text scaling, contrast, touch targets, and motion still need platform evidence; use the reuse and accessibility criteria in `AGENTS.md` when adapting them.

## Selected visual direction and remaining work

Use [assets/app-icon.png](../../assets/app-icon.png), which depicts a blue 77, path, and cross, as the identity source. Use the app name `77Faithful`, quiet neutral reading surfaces, deep-blue actions, and restrained illustration. Retain system sans-serif UI/body text and monospaced technical text; do not add web fonts or a font package by default. Readability, text scaling, and Scripture content take priority over decorative type or animation.

The implemented blue link tokens support this direction. Keep spacing consistent with the existing scale. Introduce shared control sizes, radius, and elevation only with actual product primitives; the collapsible's minimum 48-point target is the current starting point for interactive controls. Prefer subtle state feedback and honor reduced-motion settings as product motion replaces the starter demonstrations.

The source icon contains a baked rounded square and surrounding light margin; it is not yet a finished full-bleed iOS icon or Android adaptive foreground. Produce platform-specific derivatives and replace the configured Expo icon/splash assets during branding implementation. The existing binary artwork has not been modified or substituted in app config by this tooling task.

Keep the product calm, focused, trustworthy, and welcoming. Avoid perfection scores, competitive visuals, or celebratory pressure. Product and reuse rules are in [AGENTS.md](../../AGENTS.md); selected release scope and service decisions are in [architecture-decisions.md](architecture-decisions.md).
