# Design system

Observed on 2026-09-07. The repository has a small, consistent set of **Expo starter** theme primitives, not a complete or approved 77Faithful design system. This is an inventory of current code; it does not prescribe a new palette, font, or component library.

## Colors and theme selection

[src/constants/theme.ts](../../src/constants/theme.ts) exports `Colors` with matching light/dark keys and a `ThemeColor` key type:

| Token | Light | Dark |
| --- | --- | --- |
| `text` | `#000000` | `#ffffff` |
| `background` | `#ffffff` | `#000000` |
| `backgroundElement` | `#F0F0F3` | `#212225` |
| `backgroundSelected` | `#E0E1E6` | `#2E3135` |
| `textSecondary` | `#60646C` | `#B0B4BA` |

`useTheme` selects this palette using the local `useColorScheme` hook and maps `unspecified` to light. The web hook returns light until hydration, then the system scheme. Layout, tab, and badge components also read React Native's color scheme directly. Router's `ThemeProvider` uses its separate default light/dark navigation themes. There is no saved theme preference or single custom navigation palette.

Colors outside the shared palette include `ThemedText`'s `linkPrimary` blue (`#3c87f7`), the logo gradient (`#3C9FFE` to `#0274DF`), splash blue (`#208AEF`), and Android adaptive-icon background (`#E6F4FE`). These are starter values, not approved product brand or semantic status tokens. There are no success, warning, or error color tokens.

## Typography

[ThemedText](../../src/components/themed-text.tsx) wraps React Native `Text`, forwards its props, and supports these variants. Sizes are the numeric style values in source; an unset value inherits platform/parent behavior.

| `type` | Font size | Line height | Weight |
| --- | --- | --- | --- |
| `default` | 16 | 24 | 500 |
| `small` | 14 | 20 | 500 |
| `smallBold` | 14 | 20 | 700 |
| `title` | 48 | 52 | 600 |
| `subtitle` | 32 | 44 | 600 |
| `link` | 14 | 30 | Unset |
| `linkPrimary` | 14 | 30 | Unset |
| `code` | 12 | Unset | 700 on Android; 500 otherwise |

Text defaults to the palette's `text` color; `themeColor` selects another palette key. `linkPrimary` applies its hard-coded blue after the palette color, so it overrides `themeColor`. Caller `style` comes last. Font sizes/weights are centralized in this component, not exported as standalone tokens.

`Fonts` defines `sans`, `serif`, `rounded`, and `mono` families: iOS uses system design family names; the default branch uses `normal`, `serif`, `normal`, and `monospace`; web uses CSS variables from [src/global.css](../../src/global.css). The web sans stack starts with Spline Sans and Inter and falls back to system fonts, but there is no bundled font asset or custom font-loading code. Only `code` explicitly applies a `Fonts` family (`mono`) in `ThemedText`; other variants do not apply `Fonts.sans` automatically.

## Spacing, radius, and sizing

The existing `Spacing` scale is intentionally recorded exactly; the key names are not multipliers.

| Key | Value |
| --- | --- |
| `half` | 2 |
| `one` | 4 |
| `two` | 8 |
| `three` | 16 |
| `four` | 24 |
| `five` | 32 |
| `six` | 64 |

`MaxContentWidth` is 800. `BottomTabInset` is a fixed platform value: iOS 50, Android 80, and 0 otherwise. It is not a measured safe-area inset or live tab-bar height.

There are no dedicated radius tokens. Components reuse spacing values for radii: hint snippet 8, collapsible content and web tab button 16, Home's starter panel 24, and documentation button/web tab container 32. The collapsible icon box uses a literal radius of 12 and the logo uses 40. No shared elevation/shadow scale or control-height/touch-target sizing tokens exist; image and icon dimensions are mostly local values.

## Reusable primitives

| Component / hook | Existing responsibility and limits |
| --- | --- |
| `ThemedText` | Shared text variants and palette selection; a link text style does not itself make text interactive |
| `ThemedView` | Background-colored `View`, with `type` selecting a palette key; forwards native view props and allows caller styles |
| `useTheme` / `useColorScheme` | System palette selection with a web hydration fallback |
| `ExternalLink` | Router link with native in-app browser behavior |
| `Collapsible` | Local open/closed state, chevron, press feedback, and animated content entry |
| `AppTabs` | Platform-specific native/web navigation; see [project context](project-context.md) |
| `HintRow`, `WebBadge`, `AnimatedIcon`, `AnimatedSplashOverlay` | Starter tutorial/branding components, not general product primitives |

`ThemedView` declares `lightColor`/`darkColor` props but does not use them. Do not depend on these props working. There is no shared product button, input, card, screen container, header, loading state, empty state, or error state. The inline documentation button and starter panels are examples, not general component APIs.

## Layout and interaction conventions

Static styles are generally colocated `StyleSheet.create` objects. Style arrays layer dynamic palette values, platform adjustments, pressed state, and caller overrides. Web additionally uses a CSS module for the logo gradient and global CSS font variables imported through the theme module; there is no utility-class styling system.

- Home centers a `SafeAreaView` inside a themed view, caps content width at 800, uses horizontal `Spacing.four`, and adds `BottomTabInset + Spacing.three` at the bottom. Its hero fills available space; the screen is not scrollable.
- Explore uses a `ScrollView` with `useSafeAreaInsets`. It supplies `contentInset`, applies explicit inset padding on Android, and uses separate web padding. Inner content is centered and capped at the same width.
- Native tabs use system tab controls. Web places a custom tab strip in an absolute container with themed focused/unfocused surfaces. There is no shared screen/header layout abstraction or keyboard/form convention.
- Several pressable examples reduce opacity to 0.7 when pressed. `Collapsible` mounts content with a 200 ms fade-in; its trigger does not explicitly set a button role or expanded accessibility state.
- The logo examples use Reanimated keyframes (600 ms native, 300 ms web, plus a four-minute glow rotation). The native splash overlay is hidden after its animation; the web overlay returns `null`. There is no application-level reduced-motion policy demonstrated in source.

These patterns have not been visually or interactively verified on devices during this documentation task. In particular, fixed tab insets, the non-scrolling Home layout, contrast, text scaling, touch targets, motion, and web hydration deserve validation when affected UI is changed.

## Future design work

The product direction is calm, intentional, focused, trustworthy, and welcoming. Reuse sound existing primitives and tokens, then deliberately extend missing tokens and controls when actual screens require them. Choose a cohesive product palette/typography and address accessibility during that work; do not treat scattered starter values as product requirements or add a speculative component library. Product and reuse rules are in [AGENTS.md](../../AGENTS.md).
