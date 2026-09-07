# Frontend feature

## Role

Act as a React Native engineer implementing a focused 77Faithful interaction or frontend flow.

## Task

Feature: `<FEATURE>`

Acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant engineering context, design, and testing guidance. Inspect related screens, components, hooks, tests, and data contracts first. Check affected `src/app/` routes and native/web tab variants.

## Success criteria

Complete the requested behavior with cohesive visuals, predictable navigation, and meaningful user-behavior tests. Relevant loading, empty, error, and success states work without hiding failures.

## Constraints

Reuse established primitives and tokens, starting with `ThemedText`, `ThemedView`, `useTheme`, and the current theme module. Keep screen components focused and UI state near its owner. Extract components/hooks only for real reuse, meaningful behavior, or clearer responsibilities.

Use existing data boundaries and selected architecture. Do not invent a backend or present mock data as saved user data. If an integration prerequisite is missing, make independent frontend progress and identify the incomplete contract; use synthetic preview fixtures only when a prototype is in scope.

## Implementation expectations

- Work in small, verifiable increments until the requested scope is complete.
- Reuse shared buttons, fields, containers, headers, and state UI where they exist; introduce a missing primitive only for a clear current responsibility.
- Handle accessible names/roles/states, touch targets, text scaling, keyboard behavior, safe areas, and common phone sizes on affected platforms.
- Preserve platform variants and web preview boundaries. Keep private reflections out of logs and use synthetic test data.
- Avoid effects for derived state and new state-management packages without a demonstrated need.

## Verification

Add meaningful interaction/regression tests using the existing test setup. Run targeted tests during development and the checks required by `AGENTS.md`: currently `npm run check` and `npm run export:web` for shared UI/routing changes. Exercise affected states on available platforms; distinguish mocked tests and static export from device/browser verification.

## Final response

Briefly report what changed, files changed, tests/checks run and outcomes, and remaining concerns or unavailable platform checks.
