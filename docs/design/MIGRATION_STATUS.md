# Quiet Sanctuary migration status

## Phase 1 — Shared visual language

Implemented September 9, 2026. Work stops at Phase 1; screen recomposition remains for later phases.

### Baseline and scope

- The initial worktree contained 17 modified and 17 untracked files, including ongoing Today, journey, setup, and backend work. Those changes were preserved. Phase 1 builds on the existing formation helpers and theme configuration.
- Read `STYLE_GUIDE.md`, `VISUAL_DESIGN_GUIDE.md`, `VOICE_AND_LANGUAGE_GUIDE.md`, existing component APIs and representative screen consumers, and relevant read-only severity, practice, account, and journey contracts.
- `prompts/design/README.md` and `docs/design/today-reference.png` are absent from this checkout, including ignored-file searches. The supplied phase instructions and visual guide were used. No reference image was invented or substituted; the missing execution contract could not be applied.
- Baseline: lint and `tsc --noEmit` passed. `format:check` failed only on the pre-existing `VISUAL_DESIGN_GUIDE.md` formatting. Final formatting normalizes that document without changing its guidance.
- `AGENTS.md` now includes the requested visual-authority section, preserving its existing instructions. `CLAUDE.md` still contains `@AGENTS.md`.

### Adopted definitions

`src/constants/colors.ts` owns the Quiet Sanctuary light/dark palette, practice accent pairs, status fills, status text/surfaces, and contrasting button foregrounds. The ordinary Tamagui themes now use these definitions. Both formation subthemes are compatibility aliases of those same themes.

`color1`–`color12`, background interaction states, border variants, `outlineColor`, placeholders, accent foreground/background, and selection now map to the semantic palette. Active backgrounds are a quiet selection wash, allowing inherited text to remain readable. Decorative borders and control outlines have separate roles. Existing `successSoft`, `successStrong`, `warningSoft`, `warningStrong`, `errorSoft`, `borderStrong`, `borderSubtle`, and `accent` names derive from these definitions. The old separate status palette was removed. Legacy brand colors remain alongside existing blue launch/welcome artwork, pending the art migration; they are not used by the shared interaction themes.

`src/constants/design-tokens.ts` owns non-color spacing, radii, content widths, font families, sizes, and leading. Tamagui extends its installed v5 defaults with these semantic names instead of replacing required numeric tokens, settings, or font keys. Installed Tamagui is 2.7.7. Web uses its existing CSS animation driver; native retains Reanimated. This removed the web `nativeID` warning seen with the previous driver. No new animations were added to controls.

API references: [Tamagui configuration](https://tamagui.dev/docs/core/configuration) and [Expo Symbols](https://docs.expo.dev/versions/latest/sdk/symbols/), checked against the installed source.

Root navigation backgrounds consume the revised colors and status-bar appearance continues to follow the effective system appearance. The existing Settings behavior follows the phone; this phase does not introduce account preference persistence or an appearance switch.

### Typography and approval gap

No app-owned `.ttf`, `.otf`, or `.woff` assets were present. There are no new font downloads, dependencies, external font requests, or fictitious asset paths.

- Editorial fallback: **Georgia on iOS**, **serif on Android**, **Georgia, serif on web**.
- Interface fallback: **System on iOS**, **sans-serif on Android**, and the platform system-sans CSS stack on web.
- Existing `HeadingLarge`, `Heading`, `HeadingSmall`, and `Paragraph` callers remain valid, now using the guide’s 34/40, 30/38, 24/30, and 16/24 roles. Additional roles cover card titles, support, labels, metadata, buttons, Scripture, and quotations.
- The `$formation` font alias and formation heading/card exports still work, deriving from the central definitions. The card has one implementation, still in `src/surface/`; the dropdown remains in `src/components/surface/`.
- Text scaling remains enabled. Shared buttons and fields have minimum sizes and can grow. No shrinking or new maximum font-scale caps were added.

**Final font gap:** the owner still needs to approve Source Serif 4 and Inter, the actual font files/weights and license notices, and their inclusion in the app. The fallback does not promise identical typography across platforms. Existing Expo Font facilities can be used once approved assets exist. Expo Symbols already includes its own Material Symbols dependency for Android/web; the inspected iOS/Android/web symbol names rendered on web without adding a package.

### Component compatibility

- Buttons retain `href`, `onPress`, severity, disabled state, and forwarded Tamagui props. Filled and outlined buttons use 18-unit corners without glow or scaling feedback. The additive `Text` appearance replaces duplicated stepper actions. Additive `isLoading` blocks presses/navigation, exposes busy state, and retains label space beneath a centered spinner. Account submit buttons now use it instead of changing labels; request guards and account behavior remain intact.
- Fields preserve optional labels, controlled/uncontrolled values, password visibility, autocomplete, keyboard configuration, submit/blur callbacks, and multiline input. `onFocus` is additive. Labels, inline error relationships, semantic focus colors, 16-unit corners, generous padding, and stronger outlines are shared.
- Choices retain Tamagui selection and label behavior, with 24-unit visible controls inside 48-unit targets. Unchecked outlines use `controlBorder`, checked states use an indicator in addition to color, and disabled labels cannot activate individually disabled controls.
- The dropdown retains its selection/expansion API and uses Expo Symbols in a 48-unit disclosure target. The stepper retains its navigation callbacks and progress meaning.
- `SeventySevenNotice` consolidates the existing account form error presentation with semantic status surfaces and accessible announcements. No unused section or practice-row framework was introduced.
- `SeventySevenPage` keeps its existing props, uses shared gutters and a 640-unit content column, and reads the native-header context before applying top insets. `SeventySevenTabScreen` owns the absolute tab-bar clearance, including its bottom safe area. Pages and placeholders avoid adding that safe area again. Standalone pages own their bottom inset. Account shells retain keyboard avoidance and use the shared 460-unit limit.
- Welcome adopts shared buttons; email confirmation drops local primary-button overrides; setup uses readable link/error text colors. These are limited primitive-adoption changes. Layout, authored content, navigation destinations, and journey behavior were not recomposed.

### Verification

- Required `npm run format`: passed.
- Required `npm run lint`: passed with no warnings after correcting import order.
- `npm run format:check` and `git diff --check`: passed.
- `npx --no-install tsc --noEmit`: passed.
- `node --test tests/route-access.test.cjs tests/journey-access.test.cjs tests/journey-setup.test.cjs`: **25 passed**.
- Production web export (`CI=1 EXPO_OFFLINE=1 npx --no-install expo export --platform web --output-dir /tmp/77faithful-phase1-web`): passed, exit 0. Expo reported that it forced process exit after writing the export.
- Protected paths: SHA-256 comparison of all **32** baseline files under `src/types/**` found no changes in the final comparison. The formatter ignores this directory; `git diff -- src/types` is empty. No dependency or lockfile changes were made.
- Rendered the actual primitives through the existing Expo server in an isolated Chrome profile. The in-app browser could not initialize because its tool session lacked sandbox metadata, so the installed Chrome was used without installing tooling. Clean final preview reload produced no console warnings/errors. The account text link maps disabled state to ARIA on web, and account loading spinners use `aria-label`, avoiding native-only attribute warnings while retaining their accessible names.
- Inspected filled/outlined/text/disabled/busy and severity buttons; focused/error/password/multiline inputs; checked/unchecked/disabled choices; cards; typography; dropdowns; notices; and the stepper in both themes. Label clicks, password reveal, multiline value preservation, dropdown expansion, and keyboard focus passed. A busy button remained 155.0625 units wide and the submission count stayed at one after another press. Welcome links still target `/register` and `/sign-in`.
- At 320-unit width with browser text sizes doubled, the page stayed 320 units wide; buttons grew to 78–122 units tall and inputs to 72 units. This is web text-growth evidence, not a native Dynamic Type test.
- Contrast audit covered 86 text/control pairs. The used foreground/surface pairs pass 4.5:1 for ordinary text and 3:1 for control outlines/focus. The guide’s light `textMuted` passes on the page canvas but reaches only 4.44:1 on `surfaceElevated` and 4.22:1 on `surfaceSubtle`. Keep it on the canvas; shared placeholders/support and notices use stronger colors. Decorative card borders are not control boundaries.

[Light specimen](phase-1-light.png) · [Dark specimen](phase-1-dark.png). These are full-height captures of a temporary local component review screen using synthetic review content. The review route was removed after verification; no preview controls were added to product navigation.

### Remaining handoff

Restore/provide the missing execution contract and Today reference PNG for exact visual comparison. Approve clean landscape artwork separately from interface text and controls; the current blue welcome and vivid Today placeholders remain provisional. Approve the final fonts before bundling them. Native iOS/Android screenshots, screen-reader behavior, keyboard coverage, and system text scaling still need device review.

Phase 2 has not started. Welcome’s existing absolute layout, image, decorative copy treatment, and existing scaling caps remain for its dedicated migration. Account/onboarding/Today/Journey/Settings compositions, feature-specific practice accents, and final imagery remain for their respective phases. No product or domain-contract changes are included.
