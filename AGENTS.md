# 77Faithful engineering guidance

## Project identity

77Faithful is a free 77-day Christian spiritual formation app for iOS and Android. Scripture reading, prayer, and reflection are foundational daily practices; participants choose two additional practices. Scripture stays central.

- Encourage faithfulness over perfection. Missing or partially completing a day never invalidates prior participation or resets the journey. Complete-day streaks, if introduced, are secondary accountability tools; completion never measures spiritual worth, earns God's favor, or ranks participants.
- Journals and reflections are private by default, including in caches and diagnostics. Sharing requires an explicit participant action and is outside the first release. Future communities should emphasize encouragement, not popularity or competition; community membership must not implicitly share personal reflections.
- Support people with different schedules, responsibilities, and physical abilities. Avoid guilt, manipulative engagement, and unnecessary time or physical-performance requirements.

Follow the selected [architecture and product decisions](docs/engineering/architecture-decisions.md) for exact journey semantics and integration choices. The current checkout is an Expo 57 / React Native / TypeScript starter; Firebase, API.Bible, and formation features are selected but not implemented. Ship iOS/Android first; web is a development preview.

## Engineering priorities

1. Correctness
2. Maintainability
3. Repository consistency
4. Good user experience
5. Minimal unnecessary complexity
6. Useful automated verification

Write code a human can comfortably read, review, debug, and change. Prefer the smallest coherent solution; fewer lines or more abstraction do not by themselves improve it. Optimize performance when evidence shows a material need.

## Context and task scope

- Read applicable directory instructions and inspect adjacent code, callers, contracts, and tests before editing. Extend a suitable existing pattern before creating another. Correctness, security, accessibility, and significant maintainability problems take precedence over copying a poor pattern.
- Use [project context](docs/engineering/project-context.md) for the implementation inventory, [architecture decisions](docs/engineering/architecture-decisions.md) for selected behavior, [design system](docs/engineering/design-system.md) for UI, and [testing](docs/engineering/testing.md) for verification. Read the sections relevant to the task. Source/configuration establishes what exists; planned decisions are not working integrations.
- Before writing code that relies on Expo/React Native behavior or changing Expo configuration, read relevant pages in the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/). Check other library APIs against installed versions and current authoritative documentation. Do not substitute remembered APIs from another release. If research is unavailable, identify the unverified dependency and avoid guessing its contract; unrelated work can continue.
- The user's request sets the scope and whether to plan, review, or implement. Resolve routine local choices using repository evidence. Clarify missing requirements when they materially affect behavior, privacy, a public contract, or the size of the task; do not invent product policy or external account settings.
- Keep focused work focused. Include necessary caller updates, security rules, and tests, but preserve unrelated local work and report unrelated issues separately. A narrow repair does not authorize a screen redesign or repository-wide refactor. Do not run `npm run reset-project` as setup; it moves or deletes source directories.
- Stop when the requested outcome and required verification are addressed. Report incomplete criteria and concrete blockers honestly; do not expand into optional improvements or present fixtures, fake saves, or fabricated credentials as a working integration.

## Repository conventions

- Keep routes/layouts in `src/app/` and tests outside that directory. Native tabs use `src/components/app-tabs.tsx`; web tabs use `app-tabs.web.tsx`. Preserve affected platform variants and keep browser-only behavior out of native modules.
- Use `@/*` for `src/*` and `@/assets/*` for root assets; nearby relative imports are also established. Match local formatting and exports: kebab-case files, PascalCase components/types, camelCase functions/hooks, default route/`AppTabs` exports, and mostly named shared exports. Avoid barrel files without a concrete benefit.
- Keep local UI state local. Add shared state or data-access modules only for a current requirement, following the selected architecture. Do not create empty layers for planned features.
- Use Node 24, npm 11, and the committed npm lockfile for the app/tooling package. The planned Functions package has its own runtime selection in the architecture record.

## Types, boundaries, and reuse

- Retain strict TypeScript and meaningful domain types. Avoid explicit `any`, assertions that hide errors, and elaborate generics for simple problems. Validate unknown external data before treating it as a trusted type.
- Use descriptive domain names and focused functions/modules. Split when responsibilities diverge, not to meet arbitrary line counts. A one-use helper or component should materially clarify its caller or own meaningful behavior.
- Centralize repeated domain calculations, validation rules, service queries, and design primitives when that prevents drift or makes changes safer. Similar-looking code with different responsibilities need not share an abstraction. Client validation for UX does not replace validation at security boundaries.
- Interfaces, factories, dependency injection, generic repositories, wrappers, and custom hooks must solve a present problem that direct code cannot express clearly. A focused service function is often a sufficient data boundary. Avoid infrastructure for hypothetical future providers or consumers.
- Handle realistic failures at boundaries such as user input, stored records, networks, and platform APIs. Do not add fallbacks or repeated defensive checks for impossible internal states or unsupported historical formats. Catch errors to recover, translate them, provide useful context, or clean up; do not silently swallow them or turn failed operations into success.

## Comments and documentation

Prefer clear naming and structure to explanatory narration. Comments belong to non-obvious reasons or constraints: platform limitations, external API behavior, security decisions, unusual workarounds, or behavior that would otherwise look incorrect. Avoid comments that restate operations and verbose JSDoc for obvious internal code.

Keep lasting product/architecture decisions and changed setup or shared contracts in the relevant engineering document. Update affected documentation when those facts change; do not create a report or document every helper for routine implementation work.

## React and reusable UI

- Use functional components and appropriate hooks. Keep dependencies correct and clean up subscriptions/resources. Prefer derived values and event-driven logic over effects that mirror state; retain real external synchronization such as web hydration handling. React Compiler is enabled in `app.json`; do not add memoization without a demonstrated benefit.
- Before building UI, read the design guide and inspect existing typography, buttons, inputs, cards, containers, navigation, icons, and state UI. Start with `ThemedText`, `ThemedView`, `useTheme`, and `src/constants/theme.ts`. Reuse established tokens and colocated `StyleSheet.create` with dynamic style arrays. The token system is partial; extend it deliberately with current product needs.
- Extract a component when a pattern repeats, it establishes a design-system primitive, it owns meaningful reusable behavior, or it materially improves clarity. A JSX fragment alone is not a reason. Use composition and a small semantic API; avoid unrelated variants and collections of boolean props. Do not independently recreate the same Button, Card, typography, or spacing system across screens.
- Provide clear hierarchy, readable content, obvious actions, predictable navigation, and relevant loading, empty, error, recovery, and success states. Forms need labels, usable validation feedback, appropriate input/keyboard behavior, and submission feedback.
- Check accessible names/roles/states, contrast, non-color cues, touch targets, text scaling, scrolling, focus, reduced motion, safe areas, and keyboard overlap where affected. Respect iOS/Android navigation and actual insets; the starter's fixed tab inset is not a universal layout solution.
- Use the selected blue 77/path/cross identity and system typography. Replace starter visuals within relevant product work, without turning a focused UI task into general rebranding.

## Firebase and API.Bible

Apply these rules when integrations are in scope; they do not authorize scaffolding future services. Keep SDK objects and transport details behind focused service/backend modules, out of screens.

- **Firebase authorization:** client checks and App Check are not user authorization. Enforce client access with Firestore rules and authorize privileged handlers separately; Admin SDK access bypasses rules. Each private user-owned path needs explicit read/write ownership boundaries. Allowlist fields/types on creation and update, preserve ownership, and prevent clients from granting themselves roles, membership, or other privileges.
- For community access when implemented, validate membership and permitted roles for the operation, including membership changes/revocation. Keep private documents separate from shared ones; rules cannot hide individual fields in a readable document. Design queries and rules together: rules are not result filters. Bound reads/listeners and document growth, provide required indexes, and account for actual cost, offline behavior, and synchronization.
- **API.Bible:** verify current official API behavior and applicable account/translation terms during integration. Follow the selected backend gateway, explicit version identifiers, attribution, and session-memory-only caching policy in the architecture record. Keep application-authored content distinct from licensed text; do not embed provider text in source/bundles, persist it in app storage, or automatically copy it into journals. Do not assume identical translation coverage/numbering or silently substitute versions.
- Keep true secrets, including provider and Admin credentials, on the backend and out of committed files and diagnostics. Client environment variables are public; Firebase client configuration does not itself grant access. Use synthetic personal data and provider responses in tests, previews, and reviews, never real journals or credentials.

## Dependencies and verification

- Before adding a dependency, check existing repository and platform/standard-library solutions, maintenance status, and compatibility. Explain the concrete benefit and maintenance cost. Do not add a package for a trivial utility or an unneeded testing/architecture layer.
- Test useful behavior and realistic failures, especially domain rules, services, validation, user interactions, and authorization. Add a regression test for a bug fix when practical. Avoid coverage-only tests, assertions that mirror implementation, and large snapshots. Mock external/native boundaries as needed while exercising the real behavior under test.
- Run `npm run check` for code/tooling changes. Run `npm run export:web` when routing, shared UI, or build configuration changes. Add applicable backend/rules checks with integrations; the root suite does not cover the future separate Functions package. Use targeted tests while iterating and do not disable checks to obtain a pass.
- Markdown-only edits need formatting and link checks; see the testing guide. Do not install tooling merely to report a check as passed. Mocked tests and static export do not establish native runtime behavior or deployed security.
- Report what changed and why, relevant files, checks actually run and outcomes, and material limits or incomplete requirements. Never claim a pass based on inspection alone.

## Planning and review work

Planning, research, and reviews are analysis-only unless the user also requests changes. Do not edit source, tests, documentation, configuration, dependencies, or external resources as a side effect of reviewing. Existing non-fixing checks may create ignored generated outputs; inspect commands that might rewrite source/configuration and use a non-mutating alternative or report them unrun. A review verdict does not authorize merge or deployment.

Keep review findings bounded by the supplied scope and supported by evidence. Order them by impact; give the location/state, evidence, user or maintenance consequence, smallest useful correction, and a verification step. Separate confirmed problems, hypotheses, and optional preferences. Distinguish pre-existing issues from introduced ones, and missing planned features from defects in current scope. No material findings is a valid result; do not recommend redesign merely to produce findings. Report the reviewed scope, checks, and evidence limits without repetitive “files changed: none” boilerplate.
