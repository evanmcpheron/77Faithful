# Testing and verification

Observed on 2026-09-07. There is **no configured application test suite**. This document distinguishes available commands from future testing guidance and records the checks actually performed during repository inspection.

## Current tooling and locations

- TypeScript is a direct development dependency and `strict` is enabled in [tsconfig.json](../../tsconfig.json). There is no `typecheck` script.
- [package.json](../../package.json) defines `lint: expo lint`, but ESLint, `eslint-config-expo`, and an ESLint configuration are absent. Prettier is also absent and no formatter configuration is committed.
- There is no `test` script, test file/location convention, Jest/Jest Expo/Vitest runner, React Native Testing Library, snapshot suite, integration suite, end-to-end setup, or coverage threshold. Jest-related utilities and optional testing-library peer references in the lockfile are dependency internals, not an application test setup.
- No CI workflow, Firebase emulator configuration, or security-rule tests exist.

## Commands and prerequisites

Run commands from the repository root with dependencies installed. `npm ci` uses the committed lockfile; dependency installation was not needed or performed during this inspection.

| Purpose | Command | Current status |
| --- | --- | --- |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit` | Uses installed TypeScript; requires Expo's environment types for the CSS imports |
| Expo development server | `npm start` | Starts Expo/Metro and its type-generation setup; not a test command |
| Manual platform checks | `npm run ios`, `npm run android`, `npm run web` | Launch development targets; native runs require a suitable simulator/emulator/device setup |
| Lint | `npm run lint` | Setup is incomplete; can install packages and create configuration |
| Unit/integration/targeted tests | None configured | No command to run until a runner is deliberately introduced |
| Diff whitespace | `git diff --check` | Checks the tracked diff for whitespace problems, not application correctness |

### Expo-generated types

Both `.expo/types/**/*.ts` and `expo-env.d.ts` are included by `tsconfig.json` and ignored by Git. Neither existed in this checkout at inspection time. The installed Expo 57 CLI's type-generation code writes `expo-env.d.ts` with a reference to `expo/types` and generates route declarations while starting the development server with typed routes enabled.

For normal development, start Expo and allow generation to complete, then run TypeScript. This startup path was confirmed by reading the installed CLI, not by starting the app during this task. A reproducible type-generation step for future CI still needs to be established. Do not hand-edit generated files or weaken strict checking to bypass missing types.

The following diagnostic explicitly loads Expo's existing CSS/global declarations without generating files:

```sh
node node_modules/typescript/bin/tsc --noEmit --types expo/types
```

It does not generate typed-route declarations or verify runtime behavior, so its success is not a substitute for normal route-aware type checking.

### Lint setup side effects

The installed Expo CLI's `lint/ESlintPrerequisite.js` checks configuration and bootstraps ESLint when missing. Interactive use prompts; noninteractive use can configure it automatically, installing `eslint`/`eslint-config-expo` and writing `eslint.config.js`. Therefore `npm run lint` is currently a setup mutation, not an established read-only check. It was not run for this documentation task. Configure lint deliberately in an appropriate tooling task before relying on it in verification or CI.

## Inspection results

Environment: Node 24.10.0, npm 11.16.0, installed TypeScript 6.0.3.

| Check actually run | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | Failed with the two missing CSS declarations below |
| `node node_modules/typescript/bin/tsc --noEmit --types expo/types` | Passed with exit code 0; ambient-type diagnostic only |
| `git diff --check` | Passed for the tracked documentation diff |
| Local Markdown link/whitespace validation (temporary Python script) | Passed for all four engineering instruction/context documents, including new untracked files |

The plain check reported:

- `src/components/animated-icon.web.tsx:5`: TS2307, cannot find `./animated-icon.module.css` or its type declarations.
- `src/constants/theme.ts:6`: TS2882, cannot find module/type declarations for the side-effect import of `@/global.css`.

Expo already supplies these declarations in `expo/types/global.d.ts`. The diagnostic pass is consistent with the missing generated environment reference; no application or configuration fix was made. Lint, automated tests, builds, and device/browser smoke checks were not run. No test libraries were installed.

## Conventions for future tests

No test placement, naming, mocking, or runner convention is established. When testing is introduced, choose an Expo 57-compatible setup for the work at hand and document its actual commands and locations here. Keep test files outside `src/app/` so the route directory remains for screens/layouts. Do not create multiple runners or a framework of helpers for hypothetical coverage.

Follow [AGENTS.md](../../AGENTS.md): favor observable behavior and meaningful domain logic, regression tests when practical, and minimal snapshots. Mock external boundaries where needed rather than internal implementation details. Use synthetic data, not personal journal/reflection contents, in fixtures and diagnostics.

Major coverage gaps:

- **Existing code:** tab navigation on native/web, theme selection and hydration, collapsible interaction/accessibility, external-link behavior, and native splash lifecycle have no application tests.
- **Platform verification:** safe areas, back navigation, common phone sizes, larger text, touch targets, screen-reader semantics, light/dark contrast, and motion behavior have no recorded verification in this repository. Keyboard behavior will need coverage when inputs exist.
- **Planned domain behavior:** day/date boundaries, practice selection, intentions/completion tracking, transformations, and validation need behavior tests when implemented; their precise rules are not established yet.
- **Planned integrations:** authentication lifecycle, Firestore authorization/private journals, persistence and sync conflicts, API.Bible version selection/response handling, and network/error states need tests when implemented. No existing backend behavior can be validated yet.

For a change, run the relevant available checks and report exactly what ran and what did not. TypeScript success alone does not establish visual, accessibility, security, or runtime correctness.
