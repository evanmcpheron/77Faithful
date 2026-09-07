# Project context

Updated 2026-09-07 after the V1 navigation foundation. **Observed** describes files in this checkout; **selected/planned** describes decisions awaiting implementation, not deployed services. Recheck source and configuration when making changes.

This is the implementation inventory. [The navigation and UX contract](../APP_NAVIGATION_AND_UX.md) is authoritative for intended screens, routes, flows, journey behavior, and V1/Future scope. Its source reconciliation distinguishes working navigation scaffolding from planned feature behavior and state-backed protection.

## Observed: stack and dependencies

The app now contains the complete required V1 navigation scaffold with Today/Journey tabs, auth/onboarding steps, focused day routes, Settings, and journey completion. Screens are intentionally minimal and contain no user records or working submissions. The preserved splash and other configured assets still include starter artwork; iOS currently points to the product PNG icon.

Versions below are declarations from [package.json](../../package.json). [package-lock.json](../../package-lock.json) is an npm lockfile (version 3); its root dependency declarations match the manifest.

| Area                      | Dependencies / configuration                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Runtime                   | `expo ~57.0.20`, `react-native 0.86.3`, `react 19.2.3`                                                          |
| Routing                   | `expo-router ~57.0.19`; entry point `expo-router/entry`                                                         |
| Types                     | `typescript ~6.0.3`, `@types/react ~19.2.2`                                                                     |
| Web                       | `react-dom 19.2.3`, `react-native-web ~0.21.0`; static web output                                               |
| Animation                 | `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`; keyframe/splash and collapsible examples       |
| Layout/navigation support | `react-native-safe-area-context ~5.7.0`, `react-native-screens ~4.26.0`, `react-native-gesture-handler ~2.32.0` |
| Images/icons              | `expo-image ~57.0.4`, `expo-symbols ~57.0.2`                                                                    |
| Startup/device/links      | `expo-splash-screen ~57.0.8`, `expo-device ~57.0.1`, `expo-web-browser ~57.0.2`                                 |

Other direct dependencies are `@expo/ui`, `expo-constants`, `expo-font`, `expo-glass-effect`, `expo-linking`, `expo-status-bar`, and `expo-system-ui`, all on SDK 57 version ranges. They have no direct imports in `src/`; their presence does not establish a component library, custom font loader, or application integration.

Development uses Node 24 and npm 11, declared in `package.json` engines; `.nvmrc` selects Node 24. CI uses that file and `npm ci`. This meets the [Expo 57 Node requirement](https://docs.expo.dev/versions/v57.0.0/). Local verification used Node 24.10.0 and npm 11.16.0.

Development tooling now includes Expo's ESLint 57 flat configuration, ESLint 9, Prettier 3 with `eslint-config-prettier`, Jest 29 with `jest-expo ~57.0.5`, React Native Testing Library 14 and its `test-renderer` peer, and the React Native 0.86.3 Jest preset. See [testing.md](testing.md) for setup and dependency constraints.

## Observed: repository structure

| Path                                                      | Current responsibility                                                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                                                | Root stack/launch redirect, auth/onboarding/app groups, two tabs, dynamic days, Settings, completion                         |
| `src/components/`                                         | Themed text/view, platform tabs, placeholder/link UI, Settings header action, splash/animated icon, external link            |
| `src/components/ui/`                                      | `collapsible.tsx` only                                                                                                       |
| `src/navigation/`                                         | Day-number parsing, validated route context, and navigation regression tests                                                 |
| `src/hooks/`                                              | Theme and color-scheme hooks, including a web variant                                                                        |
| `src/constants/theme.ts`                                  | Light/dark colors, font families, spacing, content width, tab inset                                                          |
| `src/global.css`                                          | Web font-family variables                                                                                                    |
| `assets/`                                                 | Product icon and remaining Expo/React starter images, density variants, and unused starter tab icons                         |
| `scripts/reset-project.js`                                | Moves or deletes `src/` and `scripts/`, then creates a blank `src/app/`                                                      |
| `app.json`, `tsconfig.json`                               | Expo app and TypeScript configuration                                                                                        |
| `docs/engineering/`                                       | Repository context, visual-system inventory, and verification notes                                                          |
| `docs/APP_NAVIGATION_AND_UX.md`                           | Authoritative navigation/UX contract, planned screens and flow states, source reconciliation, and open product decisions     |
| `src/**/*.test.{ts,tsx}`                                  | Colocated component, hook, parser, and router regression tests, outside `src/app/`                                           |
| `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Lint rules and formatting configuration                                                                                      |
| `jest.config.js`, `jest.setup.js`                         | Expo test preset, native animation mocks, and CSS setup                                                                      |
| `.github/workflows/ci.yml`, `.nvmrc`                      | Node 24 CI and local runtime selection                                                                                       |
| `AGENTS.md`, `CLAUDE.md`                                  | Persistent engineering rules; `CLAUDE.md` imports `AGENTS.md`                                                                |
| `prompts/`                                                | Optional task prompts for bounded implementation, planning, testing, and review; see [prompt index](../../prompts/README.md) |
| `.vscode/`                                                | Expo extension recommendation and explicit save actions for fixes/import organization/member sorting                         |

There is no root `app/`, service layer, `lib/`, `utils/`, separate `theme/` directory, or backend implementation. There is no custom Babel, Metro, or EAS configuration. Native `ios/` and `android/` directories are absent and ignored; configuration is currently owned by Expo app config/plugins.

## Observed: navigation and platform configuration

[app.json](../../app.json) sets portrait orientation, automatic light/dark appearance, the `77faithful` scheme, static web output, Expo Router and splash-screen plugins, and enables typed routes and React Compiler. Android predictive back is explicitly disabled. No iOS bundle identifier, Android application package, or EAS project/build profiles are configured.

[src/app/_layout.tsx](../../src/app/_layout.tsx) uses Router `ThemeProvider`, `DarkTheme`, and `DefaultTheme`. It preserves splash prevention and `AnimatedSplashOverlay`, while a root `Stack` contains bootstrap, `(auth)`, `(onboarding)`, and `(app)`. `/` uses `Redirect` to replace to `/auth/welcome`.

- Native [app-tabs.tsx](../../src/components/app-tabs.tsx) uses `NativeTabs` from `expo-router/unstable-native-tabs`, with exactly `today` and `journey` triggers and system SF/Material icons. Web [app-tabs.web.tsx](../../src/components/app-tabs.web.tsx) retains Router UI `Tabs`/`TabSlot`/`TabList`/`TabTrigger`, linking to `/today` and `/journey` with accessible selected states. The web bar occupies layout space beneath content.
- Each tab has a small stack layout for its title and the shared Settings header action. Settings pushes above the tabs, so its nested stack returns through Account/Settings to the originating tab without a stored return destination. Focused day routes and journey completion also live above the tabs.
- Auth links, the four onboarding navigation-only steps, confirmation review links, Settings rows, Account → Delete Account/Cancel, validated day → Scripture/Reflection links, and completion → Journey review are wired. Confirmation exposes no Start Day 1 action. Today/Journey contain no fabricated current day or history and require real journey data before offering day-entry actions.
- Shared `day/[dayNumber]/_layout.tsx` validates the decimal URL segment with [parseDayNumber](../../src/navigation/day-number.ts), replaces invalid parameters with `/journey`, and supplies the number through a route-scoped context to the three day screens. Only canonical decimal strings `1` through `77` are accepted; whitespace, leading zeros, arrays, fractional/exponential forms, and out-of-range values are rejected.
- The shared day layout exports `generateStaticParams` for exactly Day 1–77. Static export includes all 231 concrete ungrouped day pages plus Expo's generated group aliases and dynamic fallback files, without private/user-specific data. `web.output` remains `static`.
- Root group declarations are the future centralized `Stack.Protected` boundary. Authentication restoration, onboarding resume/completion, sign-out history removal, and session-aware splash gating are deferred until actual state exists. Direct routes currently expose public placeholders; no fake auth provider, global store, or successful onboarding state exists.
- Add journey-dependent access checks centrally in the shared day layout. Current-day detail → Today, future-day → Journey, and ended-Day-77 behavior remain deferred. Resolve the contract's email-verification placement and ended-Day-77 access decisions before implementing those flows.
- `/explore`, Verify Email, Notifications, Community, invitation, Prayer, and generic Practice routes are absent. `ExternalLink` remains a reusable utility; unused tutorial hint and web badge components have been removed. Splash assets/animation are retained.

API verification used the exact [SDK 57 Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/), [Stack](https://docs.expo.dev/versions/v57.0.0/sdk/router/stack/), [Link](https://docs.expo.dev/versions/v57.0.0/sdk/router/link/), [native tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/), and [Router UI](https://docs.expo.dev/versions/v57.0.0/sdk/router/ui/) references, supplemented by the [static rendering guide](https://docs.expo.dev/router/web/static-rendering/) and installed package implementation/types. Expo 57.0.20 and Expo Router 57.0.19 were not upgraded; no dependency or app-config change was needed.

Use direct local-preview paths such as `/onboarding` or `/today` to inspect scaffolding without pretending to sign in. Product deep-link preservation, universal links/App Links, Firebase authorization, and native hardware/gesture behavior are not established by the file tree, configured scheme, static export, or mocked router tests. Runtime verification limits are in [testing.md](testing.md).

## Observed: source conventions and styling

TypeScript extends `expo/tsconfig.base` with `strict: true` and explicit `expo/types`, Jest, and Node ambient types. The installed base uses bundler module resolution, React JSX, `noEmit`, and `skipLibCheck`. Includes cover TypeScript source, `.expo/types/**/*.ts`, and `expo-env.d.ts`. `npm run typecheck` uses Expo's supported `customize tsconfig.json` command to regenerate route types before compilation; no running server is needed.

`@/*` resolves to `src/*`; `@/assets/*` resolves to root `assets/*`. Shared imports usually use aliases, with relative imports for siblings and the CSS module. Static images use literal `require(...)` calls. Source files use kebab-case; components/types use PascalCase and hooks/functions use camelCase. Routes/layout and `AppTabs` have default exports; shared components and hooks generally have named exports. Props typically use small type aliases composed with React Native props. There are no barrel files.

Prettier enforces two-space indentation, single-quoted JavaScript/TypeScript strings, semicolons, trailing commas, a 100-column print width, and same-line closing JSX brackets. ESLint checks the whole repository, uses Expo's rules, requires type-only imports where appropriate, and rejects explicit `any` and warnings.

Most styles are colocated `StyleSheet.create` objects with arrays for theme/platform/pressed values. `ThemedText`, `ThemedView`, `useTheme`, and theme constants provide a partial shared visual system. Web also uses CSS variables and a CSS module for the animated icon. See [design-system.md](design-system.md) for exact values and limitations.

## Observed: state, data, backend, and environment

State is local React `useState` for the collapsible and native splash transition. Theme selection uses the system color scheme; all application consumers go through the shared hooks. The web color hook uses `useSyncExternalStore` with a light server/hydration snapshot and an `Appearance` subscription. There is no global application store, reducer-based domain state, server-state cache, persistence, data model, network client, or implemented data-access layer. Navigation placeholders render static explanatory content. A context scoped to the dynamic day layout contains only the validated route number; it is not journey or authentication state.

Firebase and API.Bible dependencies/integrations are absent. No authentication, Firestore rules/indexes/emulator configuration, Cloud Functions, journal storage, or other backend code was found. No environment files, environment example, or environment validation exist. The only explicit `process.env` usage in source is Expo's `EXPO_OS` platform check in `ExternalLink`.

`.gitignore` excludes `.env*` except `.env.example`, plus `.expo/`, `expo-env.d.ts`, native folders, coverage, lint cache, and `example/`. No service credentials or external account settings have been configured or inspected.

## Observed: testing and engineering gaps

`npm run check` checks formatting, lint, generated route types and strict TypeScript, and the regression suite. The suite includes themed primitives, collapsible interaction, web appearance subscriptions, day-number parsing, and navigation relationships using real Expo Router JavaScript state with mocked native boundaries. GitHub Actions runs a clean install, these checks, and static web export on pull requests and pushes to `main`. Exact commands, test locations, and remaining limits are in [testing.md](testing.md).

Concrete follow-up work, when relevant to an authorized task:

- Device testing remains necessary for safe areas, text scaling, contrast, motion, and native startup. Historical verification and its limits are recorded in [testing.md](testing.md); recheck available runtimes when affected UI changes.
- The visual system still has no dedicated radius/elevation scale or shared product buttons, inputs, and loading/empty/error states. Add them with the screens that need them.
- No backend, domain, navigation end-to-end, or native binary tests exist yet. Cloud security-rule tests belong with the future integration.
- Product branding is selected, but configured artwork and splash still use Expo assets; route screens now use restrained text placeholders. The tracked `assets/app-icon.png` is the 77/path/cross identity source; store-ready derivatives and replacement of starter art remain product work.
- Store identifiers, signing, Firebase registrations, EAS profiles, and provider licensing entitlements require actual external account values; none are provisioned.

## Selected: product and architecture

The supplied direction is a free iOS/Android app for a 77-day formation experience: Scripture reading, prayer, reflection, and two participant-selected practices, with weekly themes, daily passages/prompts/questions, intentions, completion tracking, and private journaling. None of this domain behavior or content is implemented yet. Product/privacy constraints live in [AGENTS.md](../../AGENTS.md).

The owner delegated integration choices. [Architecture decisions](architecture-decisions.md) selects native Firebase with offline persistence, private user-owned data, email/password accounts with verified cloud personal-data writes, an authenticated API.Bible callable gateway, explicit translation IDs with WEB as the initial preference, and session-only Scripture caching. The [navigation contract](../APP_NAVIGATION_AND_UX.md) owns journey semantics and records open email-gate, offline-flow, and post-journey questions. The visual direction follows the existing blue 77/path/cross artwork. These are planned decisions, not claims that integrations or product features already work; Community stays Future.
