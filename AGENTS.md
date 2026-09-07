# 77Faithful engineering guidance

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. Consult the relevant SDK 57 pages; do not substitute remembered APIs from earlier releases.

## Project identity

77Faithful is a free 77-day Christian spiritual formation app for iOS and Android. Scripture reading, prayer, and reflection are foundational daily practices; participants choose two additional practices. Scripture is central to the experience. Encourage faithfulness rather than perfection: never imply that disciplines earn God's favor, rank spirituality, or make formation competitive, manipulative, or transactional. Journals and reflections are private unless the user explicitly shares something.

The repository currently contains an Expo 57 / React Native / TypeScript starter, including web support. Firebase Authentication, Firestore/backend services, API.Bible licensed Scripture access, and the formation experience are planned, not implemented.

## Engineering priorities

1. Correctness
2. User experience
3. Maintainability
4. Consistency with existing code
5. Simplicity
6. Testability
7. Performance where materially relevant

Write the smallest amount of good code that solves the actual problem and is easy for a human to read and modify. Do not optimize prematurely.

## Follow the repository

- Inspect adjacent code before changing it. Extend a good existing component, hook, utility, service, or pattern before creating a competing implementation. When patterns differ, prefer the dominant maintainable one. Correctness, security, accessibility, and significant maintainability problems take precedence over copying a bad pattern.
- Keep routes and layouts in `src/app/`. Native tabs live in `src/components/app-tabs.tsx`; web tabs use `app-tabs.web.tsx`. Preserve platform variants when changing shared behavior.
- Use the existing `@/*` alias for `src/*` and `@/assets/*` for root assets; nearby relative imports are also established. Match local formatting: source generally uses two spaces, single quotes, and semicolons. Files use kebab-case, components/types PascalCase, and functions/hooks camelCase (`use...` for hooks). Routes and `AppTabs` use default exports; most shared components/hooks use named exports. Avoid new barrel files without a concrete benefit.
- Keep local UI state local. No global application store or data-access architecture exists yet; introduce either only for a current requirement.
- See [project context](docs/engineering/project-context.md), [design system](docs/engineering/design-system.md), and [testing](docs/engineering/testing.md) for observed details and gaps. Update these when work changes the documented conventions or setup.

## Types, names, and module boundaries

- Use meaningful TypeScript types and retain strict checking. Avoid unnecessary `any` and assertions that merely silence compiler errors. Use domain types and explicit public interfaces where they improve correctness; rely on inference when annotations add no value. Avoid elaborate generics for simple problems.
- Use descriptive names that express domain meaning. Avoid abbreviations unless universally understood in context.
- Favor focused functions, components, and reasonably sized modules. Split when responsibilities diverge, not to meet line counts. A one-use helper should materially improve readability or testability.
- Avoid speculative layers, unnecessary wrappers/custom hooks, ownerless generic helper modules, duplicated types/constants, placeholder architecture, and excessive configuration. An interface with one implementation, factory, or dependency injection framework must solve a present problem that direct code cannot express clearly.
- Avoid deeply nested ternaries, component APIs dominated by boolean flags, giant components with unrelated responsibilities, unsupported "just in case" paths, and backward compatibility for code that has never shipped.

## Comments

Comments should be uncommon. Improve names and structure before explaining unclear code. Do not restate operations with comments such as "Set loading to true," "Fetch the user," "Handle error," "Render component," or "Return result"; avoid obvious section dividers, large explanatory blocks, and excessive JSDoc on self-explanatory internal functions.

Comment only information code cannot communicate well: a non-obvious decision and its reason, platform limitation, external API constraint, unusual workaround, security consideration, necessary compatibility constraint, or behavior that would otherwise look incorrect.

## React and React Native

- Use functional components with clear responsibilities and appropriate hooks. Keep dependency lists correct and clean up subscriptions/resources when necessary.
- Prefer derived values and event-driven logic over effects that mirror or synchronize state. Use `useEffect` for a real external synchronization need, not as a general-purpose mechanism; preserve justified behavior such as web hydration handling.
- Avoid unnecessary re-renders through sensible state ownership and composition. Do not add memoization without a demonstrated benefit; React Compiler is enabled in `app.json`.
- Keep interactive controls accessible and behavior safe for each affected platform. Use platform-specific modules when needed rather than allowing browser-only behavior into native code.

## Reusable UI and experience

- Before building a screen, inspect existing typography, buttons, inputs, cards, containers, icons, headers/navigation, and loading/empty/error states. Start with `ThemedText`, `ThemedView`, `useTheme`, and `src/constants/theme.ts`; many other primitives do not exist yet.
- Reuse established spacing, typography, colors, radius, elevation/shadows, and sizing tokens where available. Use colocated `StyleSheet.create` for static styles and style arrays for dynamic values. Avoid copying and slightly modifying components or repeating styles that belong in a shared primitive.
- Extract UI when it repeats, establishes an important design primitive, encapsulates meaningful behavior, or materially clarifies a screen. Do not extract every visual fragment or generalize prematurely. The starter has only a partial token system; expand it deliberately during relevant design work instead of scattering new constants.
- Prioritize clear hierarchy, obvious primary actions, readable text, predictable navigation, appropriate touch targets, accessible contrast/labels, useful loading/empty/error states, keyboard and safe-area behavior, and layouts that work across common phone sizes and text scaling settings.
- Keep the experience calm, intentional, focused, and trustworthy without feeling sterile. Avoid visual complexity that does not aid comprehension. Starter branding and animations are examples, not an approved product design.

## Data integrations and errors

These integration rules apply when the planned services are introduced; do not scaffold them without a task that needs them.

- **Firebase:** keep SDK-specific code behind appropriately sized service/data-access boundaries. Validate authentication assumptions, enforce client data access with Firestore security rules, and validate authorization in backend handlers. Client checks are never authorization; rules are part of application security, not optional configuration. Keep journals/reflections private by default, including in logs and diagnostics.
- Design Firestore queries for its actual capabilities, minimize unnecessary reads/writes, and account for offline behavior and synchronization where relevant. Keep secrets out of client code and committed files; client environment variables are not secret storage.
- **API.Bible:** isolate API-specific networking, verify current behavior against authoritative documentation, and follow applicable licensing and attribution requirements. Avoid unnecessary persistence of licensed text. Keep application-authored content distinct from licensed Bible text; make translation/version identifiers explicit instead of hard-coding translation assumptions. Handle network/API failures deliberately.
- Handle expected failures with useful application states. Catch only to recover, add meaningful context, translate to a domain/application error, present an appropriate user state, or perform required cleanup. Avoid redundant try/catch blocks and never silently swallow errors.

## Tests, dependencies, scope, and verification

- Test behavior and meaningful business logic: domain rules, important hooks, transformations, services, validation, user-visible component behavior, regressions, and security-sensitive behavior where testable. Add a regression test for each bug fix when practical. Avoid tests that mirror implementation and excessive snapshots.
- Before adding a dependency, check for an adequate repository solution, then platform/standard-library capabilities, then maintenance status and Expo compatibility. Add it only when its value exceeds the maintenance cost; never for a trivial utility.
- For focused work, inspect adjacent code, change only what is required, and fix directly related problems when correctness requires it. Avoid unrelated cleanup, architecture redesign, and rewriting working modules because another pattern is preferred. Do not use `npm run reset-project` as routine setup; it moves or deletes source directories.
- Run relevant available TypeScript, lint, unit/integration, and targeted checks before declaring implementation complete. Follow [testing setup and limitations](docs/engineering/testing.md): plain TypeScript needs Expo-generated types, lint is not configured, and no test runner exists yet. Do not silently install tooling just to report a check as passed.
- Report checks actually run, their outcomes, and any checks unavailable or skipped. Never claim a pass based on inspection alone.
