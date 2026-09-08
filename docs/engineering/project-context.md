# Project context

Updated 2026-09-07 after the curated Scripture architecture change. **Observed** describes files in this checkout; **selected/planned** describes decisions awaiting implementation, not deployed services. Recheck source and configuration when making changes.

This is the implementation inventory. [The navigation and UX contract](../APP_NAVIGATION_AND_UX.md) is authoritative for intended screens, routes, flows, journey behavior, and route-level V1/Future exposure. Its source reconciliation distinguishes working navigation scaffolding from planned feature behavior and state-backed protection. [Product requirements](../PRODUCT_REQUIREMENTS.md) owns feature-level release scope and settled product policy; [formation content](../FORMATION_CONTENT_SPEC.md) owns curriculum structure, approval, storage/versioning, and fixtures.

## Observed: stack and dependencies

The app contains a V1 navigation scaffold with Today/Journey tabs, auth/onboarding steps, focused day routes, Settings, and journey completion. Verify Email and Notifications are now required V1 additions but their routes/features are absent. Screens are intentionally minimal and contain no user records or working submissions. The preserved splash and other configured assets still include starter artwork; iOS currently points to the product PNG icon.

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

| Path                                                      | Current responsibility                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                                                | Root stack/launch redirect, auth/onboarding/app groups, two tabs, dynamic days, Settings, completion                                              |
| `src/components/`                                         | Themed text/view, platform tabs, placeholder/link UI, Settings header action, splash/animated icon, external link                                 |
| `src/components/ui/`                                      | `collapsible.tsx` only                                                                                                                            |
| `src/navigation/`                                         | Day-number parsing, validated route context, and navigation regression tests                                                                      |
| `src/hooks/`                                              | Theme and color-scheme hooks, including a web variant                                                                                             |
| `src/constants/theme.ts`                                  | Light/dark colors, font families, spacing, content width, tab inset                                                                               |
| `src/global.css`                                          | Web font-family variables                                                                                                                         |
| `assets/`                                                 | Product icon and remaining Expo/React starter images, density variants, and unused starter tab icons                                              |
| `scripts/reset-project.js`                                | Moves or deletes `src/` and `scripts/`, then creates a blank `src/app/`                                                                           |
| `app.json`, `tsconfig.json`                               | Expo app and TypeScript configuration                                                                                                             |
| `docs/PRODUCT_REQUIREMENTS.md`                            | Settled product policy, audience, feature scope, practices, trust/privacy, and theological guardrails                                             |
| `docs/FORMATION_CONTENT_SPEC.md`                          | Curriculum structure, human production approval, versioned local content, fixtures, and future variants                                           |
| `docs/engineering/`                                       | Repository context, visual-system inventory, and verification notes                                                                               |
| `docs/APP_NAVIGATION_AND_UX.md`                           | Authoritative navigation/UX contract, planned screens and flow states, source reconciliation, settled V1 decisions, and deferred Future questions |
| `src/**/*.test.{ts,tsx}`                                  | Colocated component, hook, parser, and router regression tests, outside `src/app/`                                                                |
| `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Lint rules and formatting configuration                                                                                                           |
| `jest.config.js`, `jest.setup.js`                         | Expo test preset, native animation mocks, and CSS setup                                                                                           |
| `.github/workflows/ci.yml`, `.nvmrc`                      | Node 24 CI and local runtime selection                                                                                                            |
| `AGENTS.md`, `CLAUDE.md`                                  | Persistent engineering rules; `CLAUDE.md` imports `AGENTS.md`                                                                                     |
| `prompts/`                                                | Optional task prompts for bounded implementation, planning, testing, and review; see [prompt index](../../prompts/README.md)                      |
| `.vscode/`                                                | Expo extension recommendation and explicit save actions for fixes/import organization/member sorting                                              |

The curated Scripture service is in `src/services/scripture.ts`, content is in `src/content/scripture/`, and structural validation/types/tests are in `src/scripture/`. There is no root `app/`, `lib/`, `utils/`, separate `theme/` directory, or backend implementation. There is no custom Babel, Metro, or EAS configuration. Native `ios/` and `android/` directories are absent and ignored; configuration is currently owned by Expo app config/plugins.

## Observed: navigation and platform configuration

[app.json](../../app.json) sets portrait orientation, automatic light/dark appearance, the `77faithful` scheme, static web output, Expo Router and splash-screen plugins, and enables typed routes and React Compiler. Android predictive back is explicitly disabled. No iOS bundle identifier, Android application package, or EAS project/build profiles are configured.

[src/app/_layout.tsx](../../src/app/_layout.tsx) uses Router `ThemeProvider`, `DarkTheme`, and `DefaultTheme`. It preserves splash prevention and `AnimatedSplashOverlay`, while a root `Stack` contains bootstrap, `(auth)`, `(onboarding)`, and `(app)`. `/` uses `Redirect` to replace to `/auth/welcome`.

- Native [app-tabs.tsx](../../src/components/app-tabs.tsx) uses `NativeTabs` from `expo-router/unstable-native-tabs`, with exactly `today` and `journey` triggers and system SF/Material icons. Web [app-tabs.web.tsx](../../src/components/app-tabs.web.tsx) retains Router UI `Tabs`/`TabSlot`/`TabList`/`TabTrigger`. Its `/today` and `/journey` links occupy a named Main navigation region and expose the active destination with `aria-current="page"`, using ordinary browser link keyboard behavior. The web bar occupies layout space beneath content.
- Each tab has a small stack layout for its title and the shared Settings header action. Settings pushes above the tabs, so its nested stack returns through Account/Settings to the originating tab without a stored return destination. Focused day routes and journey completion also live above the tabs.
- Auth links, the four onboarding navigation-only steps, confirmation review links, Settings rows, Account → Delete Account/Cancel, validated day → Scripture/Reflection links, and completion → Journey review are wired. Confirmation exposes no Start Day 1 action. Today/Journey contain no fabricated current day or history and require real journey data before offering day-entry actions.
- Shared `day/[dayNumber]/_layout.tsx` validates the decimal URL segment with [parseDayNumber](../../src/navigation/day-number.ts), replaces invalid parameters with `/journey`, and supplies the number through a route-scoped context to the three day screens. Only canonical decimal strings `1` through `77` are accepted; whitespace, leading zeros, arrays, fractional/exponential forms, and out-of-range values are rejected.
- The shared day layout exports `generateStaticParams` for exactly Day 1–77. Static export includes all 231 concrete ungrouped day pages plus Expo's generated group aliases and dynamic fallback files, without private/user-specific data. `web.output` remains `static`.
- Root group declarations are the future centralized `Stack.Protected` boundary. Authentication restoration, onboarding resume/completion, sign-out history removal, and session-aware splash gating are deferred until actual state exists. Direct routes currently expose public placeholders; no fake auth provider, global store, or successful onboarding state exists.
- Add journey-dependent access checks centrally in the shared day layout. Current-day detail → Today, future-day → Journey, and ended-Day-77 behavior remain deferred. Follow the now-settled verification-before-onboarding and ended-Day-77 historical-access rules when implementing those flows.
- `/explore`, Verify Email, Notifications, Community, invitation, Prayer, and generic Practice routes are absent. `ExternalLink` remains a reusable utility; unused tutorial hint and web badge components have been removed. Splash assets/animation are retained.

API verification used the exact [SDK 57 Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/), [Stack](https://docs.expo.dev/versions/v57.0.0/sdk/router/stack/), [Link](https://docs.expo.dev/versions/v57.0.0/sdk/router/link/), [native tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/), and [Router UI](https://docs.expo.dev/versions/v57.0.0/sdk/router/ui/) references, supplemented by the [static rendering guide](https://docs.expo.dev/router/web/static-rendering/) and installed package implementation/types. Expo 57.0.20 and Expo Router 57.0.19 were not upgraded; no dependency or app-config change was needed.

Use direct local-preview paths such as `/onboarding` or `/today` to inspect scaffolding without pretending to sign in. Product deep-link preservation, universal links/App Links, Firebase authorization, and native hardware/gesture behavior are not established by the file tree, configured scheme, static export, or mocked router tests. Runtime verification limits are in [testing.md](testing.md).

## Observed: source conventions and styling

TypeScript extends `expo/tsconfig.base` with `strict: true` and explicit `expo/types`, Jest, and Node ambient types. The installed base uses bundler module resolution, React JSX, `noEmit`, and `skipLibCheck`. Includes cover TypeScript source, `.expo/types/**/*.ts`, and `expo-env.d.ts`. `npm run typecheck` uses Expo's supported `customize tsconfig.json` command to regenerate route types before compilation; no running server is needed.

`@/*` resolves to `src/*`; `@/assets/*` resolves to root `assets/*`. Shared imports usually use aliases, with relative imports for siblings and the CSS module. Static images use literal `require(...)` calls. Source files use kebab-case; components/types use PascalCase and hooks/functions use camelCase. Routes/layout and `AppTabs` have default exports; shared components and hooks generally have named exports. Props typically use small type aliases composed with React Native props. There are no barrel files.

Prettier enforces two-space indentation, single-quoted JavaScript/TypeScript strings, semicolons, trailing commas, a 100-column print width, and same-line closing JSX brackets. ESLint checks the whole repository, uses Expo's rules, requires type-only imports where appropriate, and rejects explicit `any` and warnings.

Most styles are colocated `StyleSheet.create` objects with arrays for theme/platform/pressed values. `ThemedText`, `ThemedView`, `useTheme`, and theme constants provide a partial shared visual system. Web also uses CSS variables and a CSS module for the animated icon. See [design-system.md](design-system.md) for exact values and limitations.

## Observed: state, data, backend, and environment

State is local React `useState` for the collapsible and native splash transition. Theme selection uses the system color scheme; all application consumers go through the shared hooks. The web color hook uses `useSyncExternalStore` with a light server/hydration snapshot and an `Appearance` subscription. There is no global application store, reducer-based domain state, server-state cache, persistence, or network client. A focused curated Scripture data boundary now resolves published day/passages, available translations, stable preference IDs, and bundled text. The checked-in plan is an empty draft and all translations remain disabled; no production content or saved preference exists. Navigation placeholders render static explanatory content. A context scoped to the dynamic day layout contains only the validated route number; it is not journey or authentication state.

Firebase, local notifications, Crashlytics, and behavioral analytics dependencies/integrations are absent. Scripture uses no third-party Bible service, SDK, endpoint, or key. No authentication, Firestore rules/indexes/emulator configuration, Cloud Functions, journal storage, or other backend code was found. A comments-only `.env.example` documents that the scaffold and Scripture require no configuration. No service environment validation or credentials exist. The only explicit `process.env` usage in source is Expo's `EXPO_OS` platform check in `ExternalLink`.

`.gitignore` excludes `.env*` except `.env.example`, plus `.expo/`, `expo-env.d.ts`, native folders, coverage, lint cache, and `example/`. No service credentials or external account settings have been configured or inspected.

## Observed: testing and engineering gaps

`npm run check` checks formatting, lint, generated route types and strict TypeScript, and the regression suite. The suite includes themed primitives, collapsible interaction, web appearance subscriptions, day-number parsing, and navigation relationships using real Expo Router JavaScript state with mocked native boundaries. GitHub Actions runs a clean install, these checks, and static web export on pull requests and pushes to `main`. Exact commands, test locations, and remaining limits are in [testing.md](testing.md).

Concrete follow-up work, when relevant to an authorized task:

- Device testing remains necessary for safe areas, text scaling, contrast, motion, and native startup. Historical verification and its limits are recorded in [testing.md](testing.md); recheck available runtimes when affected UI changes.
- The visual system still has no dedicated radius/elevation scale or shared product buttons, inputs, and loading/empty/error states. Add them with the screens that need them.
- No backend, navigation end-to-end, or native binary tests exist yet; curated Scripture domain/service tests now exist. Cloud security-rule tests belong with the future integration.
- Product branding is selected, but configured artwork and splash still use Expo assets; route screens now use restrained text placeholders. The tracked `assets/app-icon.png` is the 77/path/cross identity source; store-ready derivatives and replacement of starter art remain product work.
- Store identifiers, signing, Firebase registrations, EAS profiles, translation source/distribution permissions, and legal/support destinations require actual external values; no such configuration is established in this checkout. See the prerequisite table below.

## Selected/planned: product, content, and architecture

[Product requirements](../PRODUCT_REQUIREMENTS.md) now records the settled V1 scope and exclusions. [Formation content](../FORMATION_CONTENT_SPEC.md) records the approved theme structure and human publication workflow; no approved 77-day production curriculum exists yet. Structured Scripture content slots, the 14-entry translation registry, data-access functions, and development/release audits now exist, with no invented assignments or text. The navigation contract records settled V1 flows, including verification before onboarding, local reminder Settings, fixed journey timezone, native offline/pending-write sign-out, and editable historical Day 77 after the period ends. These are requirements, not implemented product behavior.

[Architecture decisions](architecture-decisions.md) retains native Firebase/offline persistence and private user-owned data with verified cloud writes. Scripture now uses curated canonical passages, a centralized translation registry, and locally bundled text when permitted, behind a small service boundary. BSB is the configured fallback candidate, still disabled pending approved readings and verified source text. No cloud services are configured. No translation preference persistence or legacy identifier mapping was needed because the scaffold had no user records or saved translation state. V1.x / post-launch covers maintenance/refinement without another committed feature set. Repeat journeys/variants, Community, and app lock remain Future under product requirements, not missing V1 integrations.

## External setup and release prerequisites

These are **external setup prerequisites**, not unresolved V1 product decisions. No real values or account ownership for the items below are established by the inspected repository. The product owner must supply them and implementation/release work must verify them; never invent permanent identifiers, legal destinations, or credentials.

| Fact                                                                             | Repository status / required input                                                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support email/contact destination                                                | **TBD — product owner must supply.** Help/Feedback opens the configured contact; no V1 ticket backend.                                                                    |
| Website/domain and organization identity                                         | **TBD — product owner must supply.** The product name, Expo slug, and `77faithful` URL scheme do not establish domain or organization ownership.                          |
| Privacy Policy URL and approved policy                                           | **TBD — product owner must supply before launch.** Disclosures must match actual data handling.                                                                           |
| Terms of Service URL and approved terms                                          | **TBD — product owner must supply before launch.**                                                                                                                        |
| Legal entity/business name                                                       | **TBD — product owner must supply.** Do not invent it from the app name or repository owner.                                                                              |
| Production Apple bundle identifier                                               | **TBD — product owner must supply/confirm.** No `ios.bundleIdentifier` in app config.                                                                                     |
| Production Android application ID/package                                        | **TBD — product owner must supply/confirm.** No `android.package` in app config.                                                                                          |
| Apple Developer and Google Play accounts                                         | **TBD — product owner must supply/confirm ownership and release access.**                                                                                                 |
| Development/production Firebase project IDs and native registrations             | **TBD — product owner must supply/confirm.** Architecture selects products/region; no projects are configured here.                                                       |
| EAS account/project ownership and build/signing setup                            | **TBD — product owner must supply/confirm.** No EAS project ID or build profiles in the checkout.                                                                         |
| Verified translation source editions, distribution permissions, required notices | **TBD — supply and verify before enabling each translation.** BSB public-domain terms are verified, but no source text has been imported; all 14 targets remain disabled. |

Human-approved, versioned production formation content is also a launch deliverable, separate from these account/configuration facts. Its structure is settled in the content specification, but this architecture change does not author or approve the complete curriculum. Exact backup-erasure timing and any jurisdictional legal-support claims require verified provider/infrastructure/legal evidence before being promised.
