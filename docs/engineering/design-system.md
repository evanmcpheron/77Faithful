# Design system

Updated 2026-09-08. The semantic color, typography, and geometry foundation is implemented in [src/constants/theme.ts](../../src/constants/theme.ts). Shared primitives and navigation scaffolds consume it. Product buttons, inputs, cards, and loading/empty/error components remain later work; tokens do not establish working feature states or native visual acceptance.

## Visual direction

Use the blue 77/path/cross in [assets/app-icon.png](../../assets/app-icon.png) as the identity source. Quiet neutral surfaces, deep-blue actions, readable system text, generous spacing, and restrained corners should feel calm, modern, trustworthy, and welcoming across ages. Scripture should receive the primary reading space and hierarchy. Christian identity does not require decorative crosses on every surface.

Prefer subtle borders and surface changes to shadows. Avoid glassmorphism, decorative gradients, excessive pills, dense dashboards, tiny type, streak flames, and competitive or achievement styling. Completion styling records participation; it never grades spiritual worth. [Product requirements](../PRODUCT_REQUIREMENTS.md) owns these product guardrails and release scope.

## Colors and theme selection

`Colors.light` and `Colors.dark` share the `ThemeColor` contract, enforced by TypeScript. `useTheme` remains the palette access point. It uses the shared system `useColorScheme` hook and maps `unspecified` to light. Web uses `Appearance` subscriptions with a light server/hydration snapshot. App configuration retains automatic appearance; there is no manual switch, stored preference, or second theme mechanism.

| Token                | Light     | Dark      | Role / intended V1 consumer                                                                   |
| -------------------- | --------- | --------- | --------------------------------------------------------------------------------------------- |
| `background`         | `#F7F8FA` | `#121820` | Screen and reading canvas                                                                     |
| `surface`            | `#FFFFFF` | `#1A232E` | Cards, editors, and input interiors                                                           |
| `backgroundElement`  | `#EEF1F5` | `#222E3C` | Subtle grouped content and secondary controls; existing tabs/collapsible                      |
| `backgroundSelected` | `#DFEAF7` | `#243C58` | Selected practices/translation and neutral pressed surfaces; existing web tab selection       |
| `text`               | `#182330` | `#F0F3F7` | Reading text, headings, labels                                                                |
| `textSecondary`      | `#526071` | `#B5C0CF` | Supporting explanations and metadata; never lower opacity to mute further                     |
| `primary`            | `#164E87` | `#3274B3` | Filled primary actions such as Continue and Save; blue is lighter in dark mode for visibility |
| `primaryPressed`     | `#103D6C` | `#28669F` | Pressed primary fill, retaining the same foreground                                           |
| `onPrimary`          | `#FFFFFF` | `#FFFFFF` | Text and icons on either primary fill                                                         |
| `link`               | `#1B5FA7` | `#91C7FF` | Inline links and navigation actions                                                           |
| `border`             | `#D5DBE3` | `#3A4758` | Decorative dividers and surface separation                                                    |
| `borderControl`      | `#7A8797` | `#8393A7` | Essential input/outlined-control boundaries                                                   |
| `focus`              | `#1B5FA7` | `#91C7FF` | Visible keyboard/input focus indicator                                                        |
| `disabled`           | `#E3E7ED` | `#2B3644` | Unavailable action fill                                                                       |
| `onDisabled`         | `#586576` | `#A6B2C2` | Readable disabled labels/icons                                                                |
| `error`              | `#A52A32` | `#FFADB3` | Validation/write errors and destructive text/outlined actions such as Delete Account          |
| `errorSurface`       | `#FCEDEF` | `#3A242C` | Subtle error message/destructive confirmation background                                      |
| `success`            | `#276345` | `#9DD5B4` | Explicitly recorded completion and confirmed saves                                            |
| `successSurface`     | `#EAF4EE` | `#20372D` | Quiet completion/save status background                                                       |
| `warning`            | `#805411` | `#EBC784` | Pending sync or a condition needing attention                                                 |
| `warningSurface`     | `#FBF2DF` | `#383021` | Quiet pending/attention background                                                            |

Use semantic keys, not raw hex values in components. The existing background keys remain meaningful and retain their callers; `surface` adds a distinct input/card plane. There is no extra brand palette, tertiary text, ornamental tint scale, or shadow scale. Primary, state, border, and disabled pairs are ready for the required V1 controls; those controls are not fabricated in this foundation task.

### Pairing and state contracts

- Use `text`, `textSecondary`, and `link` on `background`, `surface`, `backgroundElement`, or `backgroundSelected`. Each pair meets at least 4.5:1 calculated contrast in both schemes.
- Use `onPrimary` on `primary`/`primaryPressed`, `onDisabled` on `disabled`, and each state foreground on its matching `*Surface`. These pairs also meet 4.5:1. State foregrounds additionally meet that threshold on `background` and `surface`. Do not invert state pairs or assume white text works on a state foreground.
- `borderControl` and `focus` meet 3:1 against the four neutral/selected surfaces. `border` is deliberately subtle and must not be the only cue identifying an input or interactive control. For focus around filled controls, leave a neutral gap so the focus indicator is assessed against the surrounding canvas, not blue against blue.
- Future shared controls should use the pressed fill tokens rather than whole-control opacity. `backgroundSelected` can also provide neutral pressed feedback. Selection requires a check, text, weight, or accessible state; the fill alone is insufficient.
- Disabled appearance requires actual disabled interaction and accessibility state. Explain a material reason nearby; do not gray out required reading content. Error, pending, saved, and recorded completion require honest text/icon/state semantics. Never use warning/error colors for missed participation.
- Color tokens do not implement focus management, validation announcements, save confirmation, or completion behavior. Those belong to the consuming component and its product contract.

Existing scaffold links/tabs retain their 0.95 pressed opacity; the Settings icon and collapsible retain starter 0.7 feedback. The root Router `ThemeProvider` still uses its built-in navigation palettes, and native navigation controls retain system rendering. This task changes no routes, navigation actions, or platform navigation behavior.

## Typography

`Typography` exports ordinary React Native text styles; `TypographyRole` defines [ThemedText](../../src/components/themed-text.tsx)'s `type` values. Non-Text primitives such as future inputs can reuse `Fonts.sans` and `Typography.body` without copying size values.

| Role             | Size | Line height | Weight | Use                                                            |
| ---------------- | ---- | ----------- | ------ | -------------------------------------------------------------- |
| `heading`        | 28   | 36          | 600    | Screen heading                                                 |
| `section`        | 20   | 28          | 600    | Scripture/practice section heading                             |
| `body` (default) | 17   | 26          | 400    | Reading text and main explanations                             |
| `supporting`     | 15   | 22          | 400    | Short supporting descriptions; unselected web tabs             |
| `label`          | 15   | 22          | 600    | Form/control labels; selected web tabs and collapsible trigger |
| `caption`        | 14   | 20          | 400    | Brief metadata and scaffold notices, not long reading content  |
| `action`         | 16   | 24          | 600    | Button text                                                    |
| `link`           | 16   | 24          | 500    | Underlined action/link text                                    |

There is no oversized display role without an actual layout need. Starter `default`, `title`, `subtitle`, `small`, `smallBold`, `linkPrimary`, and unused `code` variants are removed. Callers migrate to semantic roles: the placeholder heading uses `heading`, its supporting notice uses `supporting`, and navigation links use `link`. New code should not introduce compatibility aliases or one-off size hierarchies.

All roles explicitly use system sans-serif: `system-ui` on iOS, `sans-serif` on Android, and the system-only `--font-sans` stack in [src/global.css](../../src/global.css) on web. Unused serif/rounded/monospace definitions and Spline Sans/Inter fallbacks are removed. No fonts are downloaded, bundled, or installed.

Text defaults to `text`; `link` defaults to the matching link color and underline. `themeColor` overrides the default color, and caller `style` comes last. The wrapper forwards native `TextProps`; a typography role does not itself make text interactive or assign a heading/link accessibility role. Consumers supply the correct semantics.

Keep platform font scaling enabled with no foundation-imposed maximum, shrink-to-fit behavior, or line limit. React Native's [Text contract](https://reactnative.dev/docs/0.86/text#allowfontscaling) enables scaling by default. Do not disable it in product callers. Preserve natural wrapping, Android font padding, and room for ascenders/descenders; controls use minimum dimensions and grow with text. The [React Native 0.86 font-family contract](https://reactnative.dev/docs/0.86/text-style-props#fontfamily) and [Expo SDK 57 automatic appearance configuration](https://docs.expo.dev/versions/v57.0.0/config/app/#userinterfacestyle) were consulted for this foundation.

## Spacing, radius, borders, and sizing

The existing `Spacing` scale is unchanged; names are not multipliers.

| Key     | Value |
| ------- | ----- |
| `half`  | 2     |
| `one`   | 4     |
| `two`   | 8     |
| `three` | 16    |
| `four`  | 24    |
| `five`  | 32    |
| `six`   | 64    |

| Token                        | Value | Contract                                                                                          |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `Radius.control`             | 8     | Inputs, buttons, web tabs, small collapsible icon surface                                         |
| `Radius.surface`             | 12    | Grouped content/cards; existing collapsible content                                               |
| `ControlSize.minTouchTarget` | 48    | Minimum height and width of pressable controls; use minimums, never a fixed text container height |
| `BorderWidth.default`        | 1     | Surface dividers and control outlines                                                             |
| `BorderWidth.focus`          | 2     | Visible focus indicator; reserve space or use an outer indicator to avoid layout jumps            |

The scaffold links, Settings action, web tabs, and collapsible consume the shared target size. Radius is independent of spacing. There is no pill, hero radius, or elevation token: no current V1 need justifies those styles. Let native navigation manage its own elevation.

`MaxContentWidth` remains 800. `BottomTabInset` remains an unused starter token (iOS 50, Android 80, otherwise 0), not a measured inset or tab-bar height. Continue using real safe areas and normal native tab layout.

## Primitives and layout

[ThemedView](../../src/components/themed-view.tsx) selects its background with `type`, defaults to `background`, honors active-scheme `lightColor`/`darkColor` overrides, and applies caller style last. Its behavior is unchanged. Prefer palette tokens for normal product work.

Use colocated `StyleSheet.create` and style arrays for palette values, interaction states, and caller overrides. No styling framework or new theme provider is needed. The existing `NavigationPlaceholder` and `PlaceholderLink` remain temporary navigation scaffolds, not production screen or form components.

The [navigation and UX contract](../APP_NAVIGATION_AND_UX.md) owns screen placement, entry points, CTA destinations, back behavior, gates, and day states. Visual primitives do not justify new screens. Native stack headers/back behavior and Today/Journey tabs remain in place. With Router 57.0.19, keep styles on a direct `Link asChild` Pressable static; pressed feedback belongs in its children render function because slot merging drops style callbacks.

### Shared screen layout inventory

| Primitive                                                       | Responsibility                                                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ScreenScrollView](../../src/components/screen-scroll-view.tsx) | One vertical scroll view with a themed canvas, 24-point horizontal/vertical padding plus applicable measured insets, and centered content capped at `MaxContentWidth` (800). Direct children are separated by 32 points. |
| [ScreenSection](../../src/components/screen-section.tsx)        | Groups related content with 16-point gaps. Optional `title` and its `description` use the shared section heading treatment. It has no scrolling, card background, fixed height, or grouped accessibility focus.          |
| [ScreenHeading](../../src/components/screen-heading.tsx)        | Accessible heading with optional secondary supporting copy, separated by 8 points. `level="screen"` (default) uses `heading`; `level="section"` uses `section`. These are content headings, not navigation headers.      |

Compose sections directly inside `ScreenScrollView`. Padding sits outside the capped content width, preserving up to 800 points of usable content on wide displays. Heading/supporting text wraps naturally and inherits unrestricted system font scaling. No non-scroll screen wrapper is introduced: there is no current consumer requiring one.

`NavigationPlaceholder` now composes these primitives; its links and descriptions remain navigation scaffolding. Route migration is limited to marking Today/Journey's bottom inset as already handled. No forms, production formation content, or working saves are introduced.

### Safe-area ownership

Use `ScreenScrollView` as the screen's scroll root under the existing Router safe-area provider. It neither imports Router nor creates headers/tabs/providers. All screens add measured left/right insets to the standard margins; no fixed tab-height token is used.

- **iOS:** the root scroll view uses automatic content inset adjustment for the actual safe area and navigation overlap. Do not add top/bottom safe-area padding again. The layout flags below affect manual padding on Android/web; iOS continues to measure its own overlap.
- **Android/web pushed screens:** default `headerless={false}` assumes the ordinary nontransparent stack header already occupies the top area. Add the measured bottom safe-area inset to content padding.
- **Headerless screens:** set `headerless` (as Welcome already does) to add the measured top inset on Android/web.
- **Today/Journey roots:** set `bottomInsetHandled` because Android native tabs consume bottom space and the web tab list occupies layout space with its own bottom padding. This omits the additional bottom inset while retaining the standard 24-point content padding. Pushed daily/Settings screens use the default because they sit outside tabs.

These rules follow [Expo SDK 57 safe-area context](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/) and [native-tab inset ownership](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/#disableautomaticcontentinsets). Custom/transparent headers or overlay footers would need their actual overlap accounted for in the owning layout; they are not current consumers.

### Forms, editors, and long content

Keep reading text, prompts, fields, and actions in the same `ScreenScrollView`; never wrap it in another scroll view. Sections and headings add only ordinary views. A multiline editor that belongs to the page should grow with its content and use `scrollEnabled={false}` so page scrolling stays coherent. Avoid fixed-height text containers.

The shared scroll view enables [React Native 0.86 keyboard inset adjustment](https://reactnative.dev/docs/0.86/scrollview#automaticallyadjustkeyboardinsets) on iOS. Android uses the existing [Expo default `resize` keyboard layout](https://docs.expo.dev/versions/v57.0.0/config/app/#softwarekeyboardlayoutmode) and native focused-child scrolling. Do not add a second keyboard adjustment mechanism by default. Taps on handled controls remain available with the keyboard open; drag dismissal defaults to interactive on iOS and on-drag elsewhere. Consumers may override the two keyboard interaction props.

The native scroll `ref` and scroll/content-size callbacks are available for editor-specific focus handling on the same container. Fields, draft state, focus policy, validation, and save actions belong to the consumer. Actual focused-field visibility, multiline caret movement, reachable actions, and draft retention across keyboard dismissal must be verified on iOS/Android when forms are implemented; mocked layout tests do not establish keyboard safety on devices.

Use simple recognizable platform icons with accessible names for icon-only actions; decorative icons stay hidden from assistive technology. Pair state color with text/icons and native accessibility state. Avoid animation-dependent meaning and honor reduced motion when introducing product transitions. Existing splash/logo keyframes and collapsible fade remain starter infrastructure, outside this foundation change.

## Verification and remaining work

[Theme tests](../../src/constants/theme.test.ts) calculate contrast for the documented foreground/background pairs in both schemes. [Text tests](../../src/components/themed-text.test.tsx) check typography, palette selection, style/prop forwarding, and unrestricted scaling defaults; existing view, appearance, collapsible, and navigation tests cover their corresponding contracts. See [testing guidance](testing.md) for required checks and evidence limits.

[Layout tests](../../src/components/screen-layout.test.tsx) cover measured inset changes, headerless/stack/tab padding across platform branches, centered width and section/heading rhythm, a single scroll container with synthetic editor/action content, heading semantics, and retaining input through appearance/inset updates. Existing navigation tests exercise the migrated scaffold's links and back behavior.

Automated contrast calculations and static export do not prove native rendering. On iOS and Android, verify light/dark transitions, system font weights, largest accessibility text sizes, multiline controls, clipping/line spacing, keyboard focus indicators when controls are built, touch targets, safe areas, and screen-reader semantics. Native visual acceptance remains required before release.

Product buttons, inputs, cards, and loading/empty/error components should consume this foundation as their actual V1 flows are implemented. Configured iOS/Android icons point to the product PNG; platform-ready icon derivatives, the starter splash, web favicon, and animated logo still need separate branding work. No artwork or Expo configuration changes are included here.
