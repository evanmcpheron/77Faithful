# Design system

Updated 2026-09-08. The semantic color, typography, and geometry foundation is implemented in [src/constants/theme.ts](../../src/constants/theme.ts). Shared action, selection/completion, text-field, layout, navigation, and state-feedback primitives consume it. These components do not establish working feature integrations or native visual acceptance.

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

Use semantic keys, not raw hex values in components. The existing background keys remain meaningful and retain their callers; `surface` adds a distinct input/card plane. There is no extra brand palette, tertiary text, ornamental tint scale, or shadow scale. Shared actions use the existing primary, state, border, and disabled pairs.

### Pairing and state contracts

- Use `text`, `textSecondary`, and `link` on `background`, `surface`, `backgroundElement`, or `backgroundSelected`. Each pair meets at least 4.5:1 calculated contrast in both schemes.
- Use `onPrimary` on `primary`/`primaryPressed`, `onDisabled` on `disabled`, and each state foreground on its matching `*Surface`. These pairs also meet 4.5:1. State foregrounds additionally meet that threshold on `background` and `surface`. Do not invert state pairs or assume white text works on a state foreground.
- `borderControl` and `focus` meet 3:1 against the four neutral/selected surfaces. `border` is deliberately subtle and must not be the only cue identifying an input or interactive control. For focus around filled controls, leave a neutral gap so the focus indicator is assessed against the surrounding canvas, not blue against blue.
- Shared actions use pressed fill tokens rather than whole-control opacity. `backgroundSelected` also provides neutral pressed feedback. Selection requires a check, text, weight, or accessible state; the fill alone is insufficient.
- Disabled appearance requires actual disabled interaction and accessibility state. Explain a material reason nearby; do not gray out required reading content. Error, pending, saved, and recorded completion require honest text/icon/state semantics. Never use warning/error colors for missed participation.
- Color tokens do not implement focus management, validation announcements, save confirmation, or completion behavior. Those belong to the consuming component and its product contract.

Scaffold links and the Settings icon use shared actions. Web tabs use surface feedback on press and preserve their current-page semantics; native tabs retain platform rendering and their SF/Material icon names. The specialized collapsible retains its starter opacity/fade behavior. The root Router `ThemeProvider` still uses its built-in navigation palettes. Routes and navigation behavior are unchanged.

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

### Shared actions

| Primitive                                          | Use                                                                                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Button](../../src/components/button.tsx)          | A visible string label and `variant="primary"` (default), `secondary`, `tertiary`, or `destructive`.                                                                             |
| [IconButton](../../src/components/icon-button.tsx) | A quiet icon action, such as the Settings header control. Requires `icon` and `accessibilityLabel`; consequential actions should use visible text.                               |
| [TextLink](../../src/components/text-link.tsx)     | An underlined, left-aligned textual navigation action with the same minimum target and interaction states. Use Button's tertiary variant for an in-place text action.            |
| [AppIcon](../../src/components/app-icon.tsx)       | Decorative symbols with a small typed name map, `size`, `themeColor`, and optional layout/transform style. Accessible meaning belongs to adjacent text or the containing action. |

Primary uses a calm blue fill with `onPrimary` text. Secondary uses a neutral fill and control outline. Tertiary uses text on a transparent surface. Destructive uses an error-colored outline, explicit action wording such as `Discard unsynced changes`, and an always-present warning symbol, including while pending or disabled. The wording and symbol distinguish consequence without relying on red. Follow the [CTA rules](../APP_NAVIGATION_AND_UX.md#15-cta-and-interaction-rules) for prominence and confirmation; the primitive never opens a confirmation or performs deletion itself.

All three controls share the internal [ActionControl](../../src/components/ui/action-control.tsx) implementation: 48-point minimum width/height, token-based pressed feedback, an outer focus outline with a neutral gap, native Pressable interaction, and forwarded refs/events/accessibility hints. Labels use ThemedText, shrink within their row, wrap, and grow vertically without a line limit or font-scaling cap. Use layout `style` only to place controls; do not impose fixed heights, clipping, tiny widths, or disabled scaling. Keep bottom placement, safe areas, keyboard handling, and focus after navigation in the screen/layout owner.

`disabled` blocks presses and exposes disabled state. `loading` is controlled by the caller and is true only while its real operation is running: it blocks repeated presses, exposes busy and disabled state, and shows a decorative progress indicator. Optional `loadingLabel` supplies specific pending wording; otherwise the accessible name and visible label remain. IconButton replaces its icon with the indicator while retaining an accessible name. A background sync backlog is a separate status, not an indefinitely loading button. Callers handle errors, retry, success announcements, and reset loading in cleanup; controls never infer success or invent a timer.

Navigation stays with the caller. Compose Router links as follows, retaining the caller's `push`, `replace`, or `dismissTo` choice:

```tsx
<Link href="/settings" push asChild>
  <IconButton icon="settings" accessibilityLabel="Settings" />
</Link>

<Link href="/settings/privacy" push asChild>
  <TextLink>Privacy & Data</TextLink>
</Link>

<Button onPress={saveChanges} loading={isSaving} loadingLabel="Saving changes">
  Save Changes
</Button>
```

Router forwards the link role, destination, and activation to the control. A disabled/pending control also removes its forwarded web `href`. Keep direct `asChild` child styles flat and static: these controls accept a `ViewStyle` object, not a callback or array; use `StyleSheet.flatten` for composed caller styles. Their internal Pressable retains static geometry and applies pressed fills in its child render function, preserving Router 57's slot constraints. See the verified [Expo SDK 57 Link API](https://docs.expo.dev/versions/v57.0.0/sdk/router/link/).

[ExternalLink](../../src/components/external-link.tsx) remains a navigation adapter with native in-app-browser/web-anchor behavior and no current screen consumer. Compose `<ExternalLink href="https://example.com" asChild><TextLink>External information</TextLink></ExternalLink>` to use the shared presentation. It is not a save/pending/error boundary; address browser-launch feedback when a real external-action flow is introduced. Native/web tabs remain specialized navigation controls rather than Button variants.

AppIcon centralizes the current Settings, chevron, and destructive-warning mappings using the installed [Expo SDK 57 Symbols API](https://docs.expo.dev/versions/v57.0.0/sdk/symbols/). Add names only for actual consumers; no extra icon package is installed. Because Symbols 57's Android/web implementation does not forward accessibility props, the wrapper hides the entire glyph subtree with native and web accessibility attributes. Use separate visible text for standalone meaningful status icons. Native tab icons continue through NativeTabs' own icon API. AppIcon introduces no animation; pending state remains exposed independently of spinner motion.

### Selection, completion, and inline settings

These controlled primitives share the existing palette, typography, control boundaries, wrapping labels, and focus treatment. They emit user intent; consumers own persisted state, validation, failures, and truthful save feedback. No component navigates or infers completion from reading, scrolling, typing, or autosave. The [navigation contract](../APP_NAVIGATION_AND_UX.md#154-completion-controls) owns completion behavior and screen placement.

| Primitive                                                        | Controlled API and semantics                                                                                                                                                                                                                                                                                                                           | Intended consumer                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CompletionControl](../../src/components/completion-control.tsx) | `title`, `checked`, `onCheckedChange`; checkbox semantics, visible checkmark and `Complete` / `Not complete` text. Optional `pending="local"` shows `Saving on this device…` and busy state; `pending="sync"` shows `Pending sync`. Neither implies success or blocks reversal; use `disabled` only when the consumer actually cannot accept a change. | Explicit completion on current/historical daily screens, including Scripture's manual completion and Reflection's explicit undo. Feature actions still follow their screen-specific completion rules. |
| [SelectionCard](../../src/components/selection-card.tsx)         | `title`, required concise `description`, `selected`, `onSelectedChange`; multi-selection checkbox semantics and a checkmark.                                                                                                                                                                                                                           | Onboarding/Settings optional practices. The feature enforces exactly two choices and explains disabled options.                                                                                       |
| [RadioRow](../../src/components/radio-row.tsx)                   | `title`, optional `description`, `selected`, `onSelect`, required `groupName`; radio semantics and a filled circular indicator. Selecting the checked option does nothing.                                                                                                                                                                             | Onboarding/Settings translation choices supplied by the Scripture service.                                                                                                                            |
| [SwitchRow](../../src/components/switch-row.tsx)                 | `title`, optional `description`, `value`, `onValueChange`; a standard React Native Switch with one named switch accessibility target. The surrounding label row is passive.                                                                                                                                                                            | Inline reminder enablement on Notification Settings; permission, explicit time selection, and actual scheduling belong to that feature.                                                               |

All four accept `disabled` and layout `style`. Disabled interaction preserves the recorded checked/selected value. Keep text scaling enabled and use minimum dimensions rather than fixed heights. Completion/cards/radios have 48-point targets. Native switches retain their platform behavior with hit slop contained in a padded target; the web adapter enlarges React Native Web's actual input hit area without stretching the switch. See the verified [React Native 0.86 Switch API](https://reactnative.dev/docs/0.86/switch).

Group RadioRows in a named `View accessibilityRole="radiogroup" accessibilityLabel="…"`. Give all rows in one group the same `groupName`, unique to that group on the screen, and derive each `selected` from one selected identifier. The web target uses actual checkbox/radio inputs for native Space activation and radio arrow/focus behavior. Native targets use Pressable with checked accessibility state. Indicators are decorative and hidden from assistive technology; accessible meaning stays on the control.

Compose a navigation row and a completion control as siblings inside a passive Surface. Do not wrap inline controls in a navigating Pressable or Link: separate targets preserve reliable disabled behavior and screen-reader access. SelectionCard takes text rather than arbitrary interactive children. A Settings row that opens Notifications remains NavigationRow; SwitchRow belongs only where the value changes inline. Pending status is presentation only, with no queue, persistence, or success timer. Existing feature routes remain navigation scaffolds until their integrations are implemented.

[Selection tests](../../src/components/selection-controls.test.tsx) exercise reversal, caller-owned state, local/sync presentation, disabled/selected states, unconstrained generic multi-selection, radio exclusivity, interaction isolation, label growth, focus, and both themes. [Web DOM tests](../../src/components/selection-controls.web.test.jsx) cover real inputs, grouping, disabled label activation, click isolation, and a single switch target. These tests do not establish native screen-reader/device acceptance or browser layout; perform those checks with feature integration.

### Shared surfaces and rows

| Primitive                                                | Responsibility / documented V1 consumer                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Surface](../../src/components/surface.tsx)              | Passive content grouping for Today/practice summaries: `surface` background, subtle `border`, 12-point radius, 16-point padding and child gaps. Ordinary View props and style overrides; no navigation, completion state, shadow, or automatic accessibility grouping.          |
| [NavigationRow](../../src/components/navigation-row.tsx) | Settings destinations, Journey current/history entries, and Today Scripture/Reflection entry points. Required `label`, optional `supportingText` for a description/current value, and optional decorative `icon`. Always shows a disclosure chevron and exposes link semantics. |
| [Separator](../../src/components/separator.tsx)          | A decorative, one-point themed divider between related rows. No accessibility stop or pointer interaction. Caller controls surrounding spacing.                                                                                                                                 |

`NavigationRow` defaults to `appearance="row"`: transparent, padded content without an individual border or card background. It is also the Settings navigation row; a second Settings-only wrapper would duplicate the same contract. Supporting/current-value text sits below the label so both can wrap without competing for horizontal space, and the default accessible name includes both. An explicit `accessibilityLabel` replaces that combined name; preserve meaningful current-value information when overriding it.

Use `appearance="card"` for a whole-card destination: it composes Surface with the same disclosure, label layout, target, and interaction semantics. Do not wrap that appearance in another Surface. For ordinary content, use Surface directly. For long Scripture, prompts, and simple Settings sections, keep content on the screen canvas using the existing ScreenSection/ScreenHeading and plain Views; no additional section-row framework is needed. Upcoming Journey metadata stays noninteractive with visible `Upcoming` text, not a navigable row or a completion control.

Rows use the existing 48-point minimum target, grow with wrapped/scaled text, and introduce no font-scaling cap, fixed height, clipping, or animation. Pressed feedback uses `backgroundSelected`; disabled rows block activation, expose disabled state, remove the web destination, and use the disabled color pair. Provide a visible reason when needed. Keyboard focus uses the existing two-point outline and neutral offset. Leading icons and disclosure glyphs use AppIcon's hidden decorative subtree.

Compose routing at the caller with `<Link href="/settings/account" push asChild><NavigationRow label="Account" /></Link>`. The primitive does not choose routes, gates, day access, or back behavior. It forwards refs and native events and keeps its Pressable styles static for the [Expo SDK 57 Link API](https://docs.expo.dev/versions/v57.0.0/sdk/router/link/); caller `style` is a flat layout object, as with shared actions. The Settings scaffold now uses these rows and separators for its existing seven destinations, retaining its honest preview notice and ordinary push/pop behavior.

For a surface containing navigation and a separate inline completion control, place a row and the completion control as **siblings inside a passive Surface**. The row accepts text/icon props, not arbitrary children, so a checkbox cannot be accidentally nested inside its press target. Keep the checkbox visibly distinct with its own accessible name and checked state; route and completion callbacks belong to their respective controls. Never wrap that entire Surface in Link or Pressable. Caller layout may remove Surface padding for an edge-to-edge navigation region and pad the sibling completion region separately. Follow the [navigation-card and completion rules](../APP_NAVIGATION_AND_UX.md#153-navigation-cards); primitives do not implement practice persistence or imply a recorded completion.

### Shared daily experience

[PracticeCard](../../src/components/practice-card.tsx), [PrayerPrompt](../../src/components/prayer-prompt.tsx), and [MorningIntention](../../src/components/morning-intention.tsx) compose the existing primitives for Today and Historical Day Detail. Their placement and interaction rules belong to [Today](../APP_NAVIGATION_AND_UX.md#1011-today), [Historical Day Detail](../APP_NAVIGATION_AND_UX.md#1013-historical-day-detail), and the [daily flow](../APP_NAVIGATION_AND_UX.md#11-core-daily-user-flow). These are controlled presentations; route scaffolds and feature integrations remain separate work.

`PracticeCard` accepts `title`, optional `supportingText`, and `complete`. The caller supplies the practice definition applicable to that day's stored configuration, never labels resolved from current Settings for history. Supply `navigation={{ onPress, href?, disabled?, accessibilityHint? }}` for Scripture/Reflection destinations; the caller owns the day-specific route and push/back behavior. Supply `completion={{ onCheckedChange, disabled?, pending? }}` for Prayer and the optional practices. An optional inline completion control is a sibling of the navigation row inside a passive Surface, so its activation cannot navigate. Do not wrap the card in Link or Pressable. Without a completion callback, status remains visible and readable without a checkbox. Local-save busy state and background pending sync retain CompletionControl's semantics; callers explicitly disable changes only when necessary and provide a reason in supporting text.

Place `PrayerPrompt` in the Prayer card's children to keep caller-supplied approved text fully visible outside both press targets. It uses the section and reading-text primitives, with no timer, written response, or collapse state. `MorningIntention` accepts the stable content `prompt`, controlled `value`/`onChangeText`, editor ref/focus/content-size callbacks, optional `disabled`/`error`, and optional `syncStatus` using SyncStatus's existing props. Its multiline TextField labels intention optional and outside the five practices. There is no completion action or inferred save state. Both prompt inputs must come from approved content, or clearly isolated synthetic test/development fixtures; these components author no formation content.

Use the existing [PracticeProgress](../../src/components/progress.tsx) directly for the daily summary: `<PracticeProgress recordedCount={recordedCount} />` renders `N of 5 recorded`. There is no additional score or duplicate progress wrapper. All day-specific data, completion derivation, private persistence, and truthful sync outcomes belong to future feature callers.

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

Use [TextField](../../src/components/text-field.tsx) for single-line text and multiline intention/reflection editors. Its required visible `label` also supplies the default accessible name. `helperText` and a caller-provided `error` appear below the input; errors include an explicit `Error:` prefix, enter the input's accessibility hint, and are announced with a live region on Android/web or an explicit VoiceOver announcement on iOS. Web descriptions reference the visible helper/error text and expose invalid state. Keep errors actionable and free of entered passwords, codes, or private response text.

The field owns label/input/message spacing, theme colors, focus outline, and disabled presentation. There is no separate field-wrapper, label, error, or textarea component because these consumers share the same structure. Native `TextInputProps` and `ref` pass through, including controlled `value`/`onChangeText`, `defaultValue`, blur/submit/selection/content-size events, and caller styles. `disabled`, `editable={false}`, or `readOnly` blocks editing and exposes disabled semantics. Text scaling remains enabled and uncapped by default; inputs have a 48-point minimum target with no fixed or maximum height or imposed content length.

[PasswordField](../../src/components/password-field.tsx) composes TextField with secure entry and a shared text button below the field. It starts concealed, disables capitalization/correction/spell checking by default, and exposes `Show password` / `Hide password` actions named for the field. The button remains separate from the input's accessible node and has room to wrap at large text sizes. The caller selects the appropriate native autofill contract; the component holds only reveal state. Native `secureTextEntry` is also available directly on TextField when a toggle is unnecessary.

Choose native input props in the feature that knows the content:

- Sign In, Sign Up, and Forgot Password email: `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="email"`.
- Sign In password: PasswordField with `autoComplete="current-password"`; Sign Up and password recovery use `autoComplete="new-password"`. Native `textContentType` and `passwordRules` remain available when required; avoid conflicting autofill hints.
- Verify Email and recovery code: TextField with `autoComplete="one-time-code"`; choose keyboard and length constraints from the authentication service's verified code contract.
- Reflection, morning intention, and applicable Settings text: TextField with `multiline` where needed. Private editors can pass `autoComplete="off"` and `importantForAutofill="no"`. Writing requirements, validation timing, completion, drafts, submission, truthful save/sync feedback, and navigation guards remain with the feature under the [navigation contract](../APP_NAVIGATION_AND_UX.md#20-accessibility-and-mobile-ux-requirements).

These controls never persist drafts, log content, call AWS, infer a successful save, or navigate. Compose actual feature-owned persistence outcomes with SyncStatus and actions with Button. The existing Auth/Reflection routes remain honest navigation scaffolds until their feature integrations exist.

Keep reading text, prompts, fields, and actions in the same `ScreenScrollView`; never wrap it in another scroll view. Sections and headings add only ordinary views. A multiline editor that belongs to the page should grow with its content and use `scrollEnabled={false}` so page scrolling stays coherent. Avoid fixed-height text containers.

TextField defaults multiline inputs to `scrollEnabled={false}` and top-aligned text. Native inputs use their intrinsic content measurement. The internal [web input adapter](../../src/components/ui/form-text-input.web.tsx) measures the textarea on render, input, and layout changes, clearing the previous height first so deletion can shrink it. Browser measurement stays out of native modules. Caller-imposed fixed heights, line counts, or nested scrolling should not be used for intention/reflection content.

The shared scroll view enables [React Native 0.86 keyboard inset adjustment](https://reactnative.dev/docs/0.86/scrollview#automaticallyadjustkeyboardinsets) on iOS. Android uses the existing [Expo default `resize` keyboard layout](https://docs.expo.dev/versions/v57.0.0/config/app/#softwarekeyboardlayoutmode) and native focused-child scrolling. Do not add a second keyboard adjustment mechanism by default. Taps on handled controls remain available with the keyboard open; drag dismissal defaults to interactive on iOS and on-drag elsewhere. Consumers may override the two keyboard interaction props.

The native scroll `ref` and scroll/content-size callbacks are available for editor-specific focus handling on the same container. Fields, draft state, focus policy, validation, and save actions belong to the consumer. Actual focused-field visibility, multiline caret movement, reachable actions, and draft retention across keyboard dismissal must be verified on iOS/Android when forms are implemented; mocked layout tests do not establish keyboard safety on devices.

Use simple recognizable platform icons with accessible names for icon-only actions; decorative icons stay hidden from assistive technology. Pair state color with text/icons and native accessibility state. Avoid animation-dependent meaning and honor reduced motion when introducing product transitions. Existing splash/logo keyframes and collapsible fade remain starter infrastructure, outside this foundation change.

## Application-state feedback

[Navigation contract section 17](../APP_NAVIGATION_AND_UX.md#17-loading-error-offline-and-empty-states) owns loading, failure, offline, and empty-state behavior. The shared components below provide inline presentation inside the existing screen layout. They own no routes, overlays, requests, timers, persistence, or connectivity subscriptions. Keep headers/tabs mounted and place feedback beside the affected content.

| Component                                                          | Use and API                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [InlineNotice](../../src/components/inline-notice.tsx)             | Required `message`, with `tone="info"` by default or `tone="error"`. Uses a quiet Surface and supporting text. Error copy has a visible `Error:` prefix and an accessible announcement.                                                                                                                                  |
| [ErrorState](../../src/components/error-state.tsx)                 | Required `message`; optional `onRetry` exposes a shared secondary Button. Caller-controlled `retrying` changes its label to `Retrying…` and blocks repeat activation. Omit the callback when no recoverable operation exists.                                                                                            |
| [EmptyState](../../src/components/empty-state.tsx)                 | Required `title` and `description`, using the section heading primitive without a card, illustration, score, or invented action. Compose a sibling Button only for an existing meaningful action.                                                                                                                        |
| [LoadingPlaceholder](../../src/components/loading-placeholder.tsx) | Required contextual `label`, such as `Loading journey…`. Default `presentation="skeleton"` supplies static decorative lines; `presentation="refresh"` shows only a quiet label beside retained content. Both expose named, indeterminate progress with busy semantics. No shimmer, animation, fake percentage, or delay. |
| [SyncStatus](../../src/components/sync-status.tsx)                 | Required `status` selects the explicit outcomes below. Optional `offline` appends Offline when connectivity materially affects the operation. Supporting text stays on the surrounding canvas; normal status uses `textSecondary`, without a badge, success banner, or spinner.                                          |

### Truthful save and sync labels

| `status`      | Visible text                           | Required caller evidence                                                                                    |
| ------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `synced`      | Saved and synced                       | Backend confirmation for the current revision; no newer unconfirmed edits.                                  |
| `pending`     | Saved locally · Pending sync           | Durable local persistence succeeded; backend confirmation is still outstanding.                             |
| `sync-failed` | Failed to sync · Saved locally         | The cloud write failed or was rejected, and the current revision remains durably stored locally.            |
| `save-failed` | Failed to save · Changes are not saved | The current edits could not be saved locally; retain available in-memory input without claiming durability. |
| `offline`     | Offline                                | Known, material connectivity loss; this status makes no claim about saving.                                 |

`offline` can also accompany a saved/pending/failed status without replacing its persistence outcome. Render status only where useful, usually near the affected editor or practice. These props are presentation inputs, not a state machine: components cannot verify a save, infer connectivity, or promote pending work to synced. CompletionControl retains its own accessible pending description inside its checkbox; do not nest an announcing SyncStatus or a Retry button inside that press target. Place failure/recovery feedback beside it.

Use ErrorState next to retained local content for a read failure. If required journey state has never loaded, use it in the content area with a real Retry operation, retaining navigation chrome. Do not invent a journey/day to fill the gap. During refresh, keep existing content and editors mounted and add the refresh presentation alongside them; use skeletons only for missing content. Feedback components do not disable siblings or auto-complete any practice.

Scripture unavailability belongs beside the known reference and available content. Use Retry only for a real recoverable text load; absent bundled text has no network operation to retry or animate. Keep other practices available and follow the contract for explicit external-reading completion. EmptyState must not replace Journey's current/upcoming rows or introduce `No history yet`, a zero-score dashboard, or Future Community UI.

Errors use readable text as well as color. The internal FeedbackText exposes an alert with a polite live region on Android/web and queues an explicit VoiceOver announcement on iOS when an error appears or its message changes. Routine saved/pending labels do not announce every update. The retry action remains a separate accessible Button; messages do not take focus, dismiss automatically, or impose a text-scaling cap. Keep messages specific, calm, and free of raw exceptions, credentials, or private draft content. Accessibility behavior follows the [React Native 0.86 live-region contract](https://reactnative.dev/docs/0.86/accessibility#accessibilityliveregion) and [announcement API](https://reactnative.dev/docs/0.86/accessibilityinfo#announceforaccessibilitywithoptions).

**Integration limit:** the repository has no durable personal-record persistence/sync queue. These components add presentation only; they do not establish offline editing, draft retention across relaunch, or backend-confirmed saves. Feature callers must implement and verify the [account-scoped persistence boundary](architecture-decisions.md#offline-persistence-and-account-boundaries) before supplying those outcomes. Existing scaffold routes remain unchanged.

## Progress and day status

[Shared progress components](../../src/components/progress.tsx) provide text-first inline presentation for the [Journey Overview](../APP_NAVIGATION_AND_UX.md#1012-journey-overview) and related daily context. Use them within existing screen layouts:

- `DayProgress({ dayNumber })` shows calendar position as `Day N of 77`.
- `PracticeProgress({ recordedCount })` shows `N of 5 recorded`; `RecordedPracticeCount` permits only 0–5.
- `JourneyProgress({ period, fullyRecordedDays, partiallyRecordedDays, completeDayStreak })` stacks calendar context and participation counts, with the streak last in secondary supporting text. `period` is either `{ state: 'active', dayNumber }` or `{ state: 'ended' }`. Use this summary only on Journey; daily screens use the separate day/practice components.
- `DayStatus({ dayNumber, state, recordedCount })` presents historical or today participation. Today remains explicit alongside its participation label. The `upcoming` state accepts no practice count and exposes visible Upcoming text, a day-specific accessible name, and disabled accessibility state. This is passive status text; row navigation and its accessible name belong to the consuming screen/control. Upcoming rows must remain non-navigable.

These components accept known, validated presentation values. Callers own calendar/day validation, derived counts and streak recalculation, loading/error states, and access rules. Missing data must not become zero participation. The ended-period label makes no claim that every practice was completed. No routes or fixture records are added to the product scaffold.

All labels use existing typography and readable theme colors without pills, scores, animations, or warning/error styling for participation. Text wraps naturally with no line limit, font-scaling cap, shrink-to-fit, or fixed container height. Summary entries stack vertically to preserve room at large text sizes. Screen owners retain scrolling and insets. Accessibility labels follow the [React Native 0.86 accessibility contract](https://reactnative.dev/docs/0.86/accessibility#accessibilitylabel); passive statuses do not impersonate completion checkboxes or announce routine summary changes.

[Progress tests](../../src/components/progress.test.tsx) cover day boundaries, all recorded-practice counts, current/historical/upcoming labels and accessibility state, corrected supplied counts, ended-period context, both themes, and unrestricted text-scaling props. Native large-text rendering and VoiceOver/TalkBack delivery still require device verification.

## Journey presentation

Reuse `JourneyProgress` for the summary. [JourneyWeekSection](../../src/components/journey-week-section.tsx) takes `weekNumber`, `theme`, and the week's seven ordered `days` from the pinned content version. It composes a wrapping section heading and separated rows without a theme route, internal scroll container, or animation. Screen owners retain scrolling and safe areas; a list can render one seven-row week per item without fixed item heights that would clip larger text.

[JourneyDayRow](../../src/components/journey-day-row.tsx) uses `DayStatus` and the shared `NavigationRow`. Supply `dayNumber`, `state`, an optional preformatted `dateLabel` in the journey timezone, and `recordedCount` for `today`/`historical`. These states require an `onPress` callback; optional `href` supplies the matching web destination. Callers own Today switching and historical push/back behavior under the [Journey contract](../APP_NAVIGATION_AND_UX.md#1012-journey-overview). Upcoming accepts neither navigation nor recorded counts and renders a passive row with no content slots. No Scripture or prompt fields are accepted. Dates and status are included in the row's accessible name; nested status text is hidden from accessibility to avoid duplicate announcements.

`NavigationRow` now also accepts passive `supportingContent` instead of `supportingText`, requiring an explicit `accessibilityLabel` for this composition. Keep interactive controls outside its press target. `getDayStatusPresentation` shares status wording between passive text and the enclosing row's accessible name.

[Journey component tests](../../src/components/journey.test.tsx) cover caller navigation, current and historical Day 77, all eleven week groups, new-journey Upcoming rows, excluded future content/actions, corrections, both palettes, and scaling/focus props. The components add presentation only; the Journey route remains a scaffold. Device scrolling performance, large-text layout, and VoiceOver/TalkBack delivery still require native verification.

## Verification and remaining work

[Theme tests](../../src/constants/theme.test.ts) calculate contrast for the documented foreground/background pairs in both schemes. [Text tests](../../src/components/themed-text.test.tsx) check typography, palette selection, style/prop forwarding, and unrestricted scaling defaults; existing view, appearance, collapsible, and navigation tests cover their corresponding contracts. See [testing guidance](testing.md) for required checks and evidence limits.

[Layout tests](../../src/components/screen-layout.test.tsx) cover measured inset changes, headerless/stack/tab padding across platform branches, centered width and section/heading rhythm, a single scroll container with synthetic editor/action content, heading semantics, and retaining input through appearance/inset updates. Existing navigation tests exercise the migrated scaffold's links and back behavior.

[Field tests](../../src/components/text-field.test.tsx) cover explicit labels, native input/submit props and refs, focus/blur, both palettes, disabled editing, error announcements and correction, long multiline content, and password reveal. The layout fixture now composes TextField in the existing screen scroll container. [Web adapter tests](../../src/components/ui/form-text-input.web.test.jsx) use the actual React Native Web DOM input with synthetic layout measurements to check prefilled/controlled text, growth, shrinkage, event forwarding, and refs. These do not establish browser layout or native keyboard/screen-reader behavior; the in-app browser connection failed before visual verification.

[Surface tests](../../src/components/surfaces.test.tsx) cover passive content accessibility, row names/current values, hidden icons, both themes, row/card Router navigation and press feedback, disabled navigation, scaling/wrapping defaults, focus forwarding, and independent reversible completion in a composed surface. Native boundaries are mocked; these checks do not prove native large-text layout or screen-reader announcements.

[Action tests](../../src/components/action-controls.test.tsx) cover caller activation, blocked disabled/pending actions, a failed asynchronous save and recovery, decorative glyph/spinner hiding, both palettes and pressed/disabled styling, wrapping/scaling props, focus/blur, real Router asChild composition/navigation, and external-link composition. Symbol rendering is mocked at the native boundary; these checks do not establish native icon appearance or assistive-technology announcements.

Shared-action verification on 2026-09-08 passed `npm run check` (222 tests) and `npm run export:web` (517 static routes). An isolated Chrome preview verified the migrated Settings icon and textual links in both themes at 320-pixel width: a 48×48 header target, pressed fill, visible keyboard focus, hidden decorative glyph subtree, Enter navigation, and wrapped links without horizontal overflow at 200% CSS zoom. These browser checks cover the migrated controls; they are not native text-scaling or VoiceOver/TalkBack acceptance.

Automated contrast calculations and static export do not prove native rendering. On iOS and Android, verify light/dark transitions, system font weights, largest accessibility text sizes, multiline controls, clipping/line spacing, keyboard focus indicators, touch targets, safe areas, and screen-reader semantics. Native visual acceptance remains required before release.

[State-feedback tests](../../src/components/state-feedback.test.tsx) cover meaningful Retry availability and pending interaction, explicit save/sync/offline labels, confirmation-gated success and rejected-sync draft retention in a synthetic caller, independent actions and retained content during Scripture failure/refresh, error announcements across platform branches, both themes, loading semantics, and explanatory empty copy. These composition tests do not establish native storage, actual service integration, device layout, or VoiceOver/TalkBack delivery.

Feature flows should consume these controls as their integrations are implemented. Configured iOS/Android icons point to the product PNG; platform-ready icon derivatives, the starter splash, web favicon, and animated logo still need separate branding work. No artwork or Expo configuration changes are included here.
