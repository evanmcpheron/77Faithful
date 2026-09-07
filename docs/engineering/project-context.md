# Project context

Repository inspection: 2026-09-07. **Observed** describes files in this checkout; **planned** describes the supplied product direction and is not evidence of an implemented feature or deployed service. Recheck source and configuration when making changes.

## Observed: stack and dependencies

The app is still a `create-expo-app` starter with Home and Explore example screens. The app name, slug, and URL scheme identify 77Faithful; the screens and configured artwork still use Expo branding.

Versions below are declarations from [package.json](../../package.json). [package-lock.json](../../package-lock.json) is an npm lockfile (version 3); its root dependency declarations match the manifest.

| Area | Dependencies / configuration |
| --- | --- |
| Runtime | `expo ~57.0.20`, `react-native 0.86.3`, `react 19.2.3` |
| Routing | `expo-router ~57.0.19`; entry point `expo-router/entry` |
| Types | `typescript ~6.0.3`, `@types/react ~19.2.2` |
| Web | `react-dom 19.2.3`, `react-native-web ~0.21.0`; static web output |
| Animation | `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`; keyframe/splash and collapsible examples |
| Layout/navigation support | `react-native-safe-area-context ~5.7.0`, `react-native-screens ~4.26.0`, `react-native-gesture-handler ~2.32.0` |
| Images/icons | `expo-image ~57.0.4`, `expo-symbols ~57.0.2` |
| Startup/device/links | `expo-splash-screen ~57.0.8`, `expo-device ~57.0.1`, `expo-web-browser ~57.0.2` |

Other direct dependencies are `@expo/ui`, `expo-constants`, `expo-font`, `expo-glass-effect`, `expo-linking`, `expo-status-bar`, and `expo-system-ui`, all on SDK 57 version ranges. They have no direct imports in `src/`; their presence does not establish a component library, custom font loader, or application integration.

There is no repository Node version pin, `engines`, or `packageManager` field. The [Expo 57 SDK matrix](https://docs.expo.dev/versions/v57.0.0/) lists a minimum Node version of 22.13.x. The inspection environment used Node 24.10.0 and npm 11.16.0; those are observations, not repository requirements.

## Observed: repository structure

| Path | Current responsibility |
| --- | --- |
| `src/app/` | `_layout.tsx`, `index.tsx` (`/`), `explore.tsx` (`/explore`) |
| `src/components/` | Themed text/view, platform-specific tabs and animated icon, external link, starter hint row and web badge |
| `src/components/ui/` | `collapsible.tsx` only |
| `src/hooks/` | Theme and color-scheme hooks, including a web variant |
| `src/constants/theme.ts` | Light/dark colors, font families, spacing, content width, tab inset |
| `src/global.css` | Web font-family variables |
| `assets/` | Expo/React starter images, density variants, tab icons, and an iOS `.icon` asset bundle |
| `scripts/reset-project.js` | Moves or deletes `src/` and `scripts/`, then creates a blank `src/app/` |
| `app.json`, `tsconfig.json` | Expo app and TypeScript configuration |
| `docs/engineering/` | Repository context, visual-system inventory, and verification notes |
| `AGENTS.md`, `CLAUDE.md` | Engineering instructions; `CLAUDE.md` imports `AGENTS.md` |
| `.vscode/` | Expo extension recommendation and explicit save actions for fixes/import organization/member sorting |

There is no root `app/`, service layer, `lib/`, `utils/`, separate `theme/` directory, backend directory, or test directory. No custom Babel, Metro, ESLint, Prettier, EAS, or CI configuration was found. Native `ios/` and `android/` directories are absent and ignored; configuration is currently owned by Expo app config/plugins.

## Observed: navigation and platform configuration

[app.json](../../app.json) sets portrait orientation, automatic light/dark appearance, the `77faithful` scheme, static web output, Expo Router and splash-screen plugins, and enables typed routes and React Compiler. Android predictive back is explicitly disabled. No iOS bundle identifier, Android application package, or EAS project/build profiles are configured.

[src/app/_layout.tsx](../../src/app/_layout.tsx) uses `ThemeProvider`, `DarkTheme`, and `DefaultTheme` from `expo-router`. It prevents automatic splash hiding and renders `AnimatedSplashOverlay` plus `AppTabs`.

- Native [app-tabs.tsx](../../src/components/app-tabs.tsx) uses `NativeTabs` from `expo-router/unstable-native-tabs`, with `index` and `explore` triggers and bundled template icons. This import matches the [SDK 57 native-tabs reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/).
- Web [app-tabs.web.tsx](../../src/components/app-tabs.web.tsx) uses `Tabs`, `TabSlot`, `TabList`, and `TabTrigger` from `expo-router/ui`, with custom pressable tabs linking to `/` and `/explore`. See the [SDK 57 Router UI reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/ui/).
- `.web.tsx` variants also separate the web logo animation from native splash behavior. There are no nested route groups, authentication guards, detail stacks, or modal routes.
- `ExternalLink` wraps Router `Link`: web uses a new tab, while native presses open `expo-web-browser` after preventing the default link action.

## Observed: source conventions and styling

TypeScript extends `expo/tsconfig.base` with `strict: true`. The installed base uses bundler module resolution, React JSX, `noEmit`, and `skipLibCheck`; these are inherited rather than custom project rules. Includes cover TypeScript source, `.expo/types/**/*.ts`, and `expo-env.d.ts`.

`@/*` resolves to `src/*`; `@/assets/*` resolves to root `assets/*`. Shared imports usually use aliases, with relative imports for siblings and the CSS module. Static images use literal `require(...)` calls. Source files use kebab-case; components/types use PascalCase and hooks/functions use camelCase. Routes/layout and `AppTabs` have default exports; shared components and hooks generally have named exports. Props typically use small type aliases composed with React Native props. There are no barrel files.

Source generally uses two-space indentation, single-quoted strings, semicolons, and trailing commas. The reset script uses double quotes. No formatter enforces these conventions.

Most styles are colocated `StyleSheet.create` objects with arrays for theme/platform/pressed values. `ThemedText`, `ThemedView`, `useTheme`, and theme constants provide a partial shared visual system. Web also uses CSS variables and a CSS module for the animated icon. See [design-system.md](design-system.md) for exact values and limitations.

## Observed: state, data, backend, and environment

State is local React `useState` for the collapsible, native splash transition, and web hydration. Theme selection uses the system color scheme. There is no global application store, reducer-based domain state, server-state cache, persistence, data model, network client, or service/data-access convention. The examples render static content.

Firebase and API.Bible dependencies/integrations are absent. No authentication, Firestore rules/indexes/emulator configuration, Cloud Functions, journal storage, or other backend code was found. No environment files, environment example, or environment validation exist. The only explicit `process.env` usage in source is Expo's `EXPO_OS` platform check in `ExternalLink`.

`.gitignore` ignores `.env*.local`, but not every `.env` filename. It also ignores `.expo/`, `expo-env.d.ts`, native folders, and `example/`. No application secrets were found in the inspected configuration; deployed accounts and settings outside this repository were not inspected.

## Observed: testing and engineering gaps

There are no application tests, test runner, coverage setup, or CI checks. The `lint` script exists but ESLint dependencies/configuration do not. A direct TypeScript check before Expo generates its environment types fails on two CSS imports; explicitly including `expo/types` passes as a diagnostic. Exact commands, outcomes, and limitations are in [testing.md](testing.md).

Concrete follow-up work, when relevant to an authorized task:

- Establish reproducible type generation/checks, lint/formatting, and meaningful tests/CI. Do not treat the starter lint script as configured tooling.
- `ThemedView` exposes `lightColor` and `darkColor` props but ignores them. `ThemedText` hard-codes the `linkPrimary` color outside the palette. The visual system has no dedicated radius, elevation, or control-sizing tokens.
- `Collapsible` does not explicitly expose a button role or expanded accessibility state. Native device behavior, text scaling, touch targets, contrast, reduced motion, and web hydration need verification; system color-scheme reads bypass the hydration-aware wrapper in several components.
- README setup text refers to root `app/` and an `app-example/` reset destination. Actual paths are `src/app/` and `example/`; the reset script can delete source and is not routine setup.
- Product branding and release configuration are incomplete. An existing untracked `assets/app-icon.png` was present during inspection and is not referenced in app config or source; its intended role is unconfirmed.

## Planned: product and architecture

The supplied direction is a free iOS/Android app for a 77-day formation experience: Scripture reading, prayer, reflection, and two participant-selected practices, with weekly themes, daily passages/prompts/questions, intentions, completion tracking, and private journaling. None of this domain behavior or content is implemented yet. Product/privacy constraints live in [AGENTS.md](../../AGENTS.md).

Firebase Authentication and Firestore/Firebase backend services are planned for identity and application data. API.Bible is planned for licensed Scripture access. No SDK choice, collection/schema design, backend boundary, credential arrangement, translation list, licensing agreement, caching policy, or offline/synchronization model is established in code. Resolve these during integration work using current authoritative documentation and actual requirements; do not infer them from the package list.

Day boundaries/time zones, missed-day/completion behavior, account lifecycle, and any explicit sharing flow are also unspecified. Web is configured as a starter target; production web scope has not been established. There is no approved 77Faithful design system beyond the product's desired calm, focused, trustworthy character.
