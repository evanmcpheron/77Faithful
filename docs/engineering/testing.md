# Testing and verification

Updated 2026-09-07. The repository has an operational lint/format/type/test setup and a small regression suite. Product/backend tests are still future work.

## Tooling and conventions

- Node 24 and npm 11; `.nvmrc` and package engines define the supported development runtime. Use `npm ci` and commit lockfile changes with dependency changes.
- ESLint uses `eslint-config-expo/flat` plus `eslint-config-prettier`, which disables conflicting formatting rules. Prettier runs separately. Explicit `any`, incorrect type imports, and lint warnings fail verification.
- Jest 29 uses `jest-expo ~57.0.5` and the React Native 0.86.3 preset. React Native Testing Library 14 uses its `test-renderer` peer. Await `render`, `renderHook`, `act`, and user interactions; prefer accessible role/name queries and behavioral assertions.
- Tests are colocated as `src/**/*.test.tsx` or `*.test.ts`, outside `src/app/`. There are no snapshots or arbitrary coverage thresholds. Coverage collection includes untested source rather than just imported modules.
- `jest.setup.js` uses the official Worklets mock before Reanimated's test setup, and mocks the global CSS import. Keep real components/hooks under test; isolate native/platform or external-service boundaries. [Worklets setup](https://docs.swmansion.com/react-native-worklets/docs/guides/testing/), [Reanimated setup](https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/).
- Jest disables Watchman for portable local/CI runs. Mock call history and spies are reset between tests; configure individual mock return values in each suite.

ESLint 9 is currently required by the peer range of `eslint-plugin-react` used by Expo's SDK 57 configuration. npm marks this ESLint major unsupported. Keep this constraint visible and move to a supported major when the Expo/plugin combination supports it; do not force incompatible peer dependencies. Jest 29 likewise follows this version of `jest-expo` rather than an independent latest-major upgrade.

## Commands

| Command                                                          | Purpose                                                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                  | Formatting, lint, generated route types and TypeScript, then CI-mode tests                                     |
| `npm run typegen`                                                | `expo customize tsconfig.json`; regenerates ignored Expo environment/route declarations without starting Metro |
| `npm run typecheck`                                              | Type generation followed by `tsc --noEmit`                                                                     |
| `npm run lint` / `npm run lint:fix`                              | Check the repository / apply available lint fixes                                                              |
| `npm run format:check` / `npm run format`                        | Check formatting / format supported repository files                                                           |
| `npm test` / `npm run test:watch`                                | Run tests once / watch tests                                                                                   |
| `npm run test:ci`                                                | Run Jest once, serially, in CI mode                                                                            |
| `npm test -- --runInBand src/components/ui/collapsible.test.tsx` | Target one suite                                                                                               |
| `npm run test:coverage`                                          | Report coverage and write ignored output to `coverage/`                                                        |
| `npm run export:web`                                             | Build the static web preview in ignored `dist/`                                                                |
| `git diff --check`                                               | Check diff whitespace only                                                                                     |

The committed TypeScript configuration explicitly loads `expo/types`, so CSS imports type-check even before Expo's first run. The normal `typecheck` command also generates route-specific declarations, avoiding a misleading pass without route validation. Keep `.expo/` and `expo-env.d.ts` ignored and do not hand-edit them. [Expo typed routes](https://docs.expo.dev/router/reference/typed-routes/).

GitHub Actions runs `npm ci`, `npm run check`, and `npm run export:web` for pull requests and pushes to `main`, using `.nvmrc`, read-only repository permissions, and no application secrets. It does not build signed native binaries or deploy anything.

## Regression coverage

| Location                                 | Behavior covered                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/themed-view.test.tsx`    | Light/dark overrides, unspecified-scheme fallback, palette fallback, and caller style precedence |
| `src/components/themed-text.test.tsx`    | Theme-aware primary link colors and explicit palette overrides                                   |
| `src/components/ui/collapsible.test.tsx` | Accessible name/role, expanded/collapsed state, and content toggling through user presses        |
| `src/hooks/use-color-scheme.test.tsx`    | Web appearance subscription, updates, and cleanup                                                |

Local validation on 2026-09-07: a clean `npm ci`, `npm run check` (including all ten tests without snapshots), and `npm run export:web` passed. The source no longer has the original missing-CSS type errors or ignored themed-view overrides. Browser startup failed in the available automation connection, so live browser interaction/hydration and native-device checks have not been verified. A successful static export does not replace those checks. CI configuration is present for execution on GitHub; a remote CI run has not been observed from this local task.

## Remaining coverage

Add regression cases when fixing bugs and practical behavior tests with each domain/integration feature. In particular:

- Router navigation, native splash lifecycle, external links, safe areas, larger text, contrast, reduced motion, and future keyboard/forms need platform verification.
- The chosen calendar/time-zone rules need date-boundary, daylight-saving, travel, missed-day, and historical-edit tests when implemented. Use deterministic clocks and synthetic records.
- Future Firebase tests must exercise unauthenticated/cross-user denial, validated writes, offline/pending data, account switching/deletion, and journal edit conflicts using emulators where relevant.
- Future API.Bible tests must cover input validation, explicit translation selection, response parsing, attribution, timeouts, quotas, and unavailable Scripture states without calling the live provider in routine tests.

Follow [AGENTS.md](../../AGENTS.md) for scope and test quality. Report the exact checks run and their limits; never imply that mocked tests establish native runtime behavior or production security.
