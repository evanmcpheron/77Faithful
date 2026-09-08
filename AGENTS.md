# 77Faithful engineering guidance

## Project identity

77Faithful is a free 77-day Christian spiritual formation app for iOS and Android. Scripture reading, prayer, and reflection are foundational daily practices; participants choose two additional practices. Scripture stays central.

- Encourage faithfulness over perfection. Missing or partially completing a day never invalidates prior participation or resets the journey. The V1 complete-day streak is subdued Journey accountability information; completion never measures spiritual worth, earns God's favor, or ranks participants.
- Journals, reflections, prayer content, and intentions are private by default, including in caches and diagnostics. Sharing requires an explicit action for the specific item and is outside the first release. Future communities should emphasize encouragement, not popularity or competition; community membership never implies consent to share personal content.
- Support people with different schedules, responsibilities, and physical abilities. Avoid guilt, manipulative engagement, and unnecessary time or physical-performance requirements.

Follow [product requirements](docs/PRODUCT_REQUIREMENTS.md) for settled product policy and release scope, the [formation content specification](docs/FORMATION_CONTENT_SPEC.md) for curriculum and approval, and the concern owners below. The current Expo 57 / React Native / TypeScript checkout has a navigation scaffold, shared UI, a curated Scripture data boundary, and a local Auth-only AWS Amplify Gen 2 foundation. Application authentication, Data/persistence, production content, and formation behavior remain unimplemented; native acceptance and application Auth lifecycle verification remain outstanding. Ship iOS/Android first; web is a development preview.

## Documentation ownership

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md): identity/mission, audience, commercial principles, feature-level V1/V1.x/V2/Future scope, practice catalog/semantics, product trust/privacy, theological guardrails, repeat-journey requirements, and V1 exclusions.
- [Navigation and UX contract](docs/APP_NAVIGATION_AND_UX.md): screens/routes, relationships, redirects, daily/journey flows, current/history/future-day access, back behavior, navigation states, and route-level release exposure.
- [Formation content specification](docs/FORMATION_CONTENT_SPEC.md): curriculum/themes, authored fields, human production approval, content versions/storage, fixtures, future variants, and group curriculum consistency.
- [Architecture decisions](docs/engineering/architecture-decisions.md): application/integration architecture, AWS Amplify Gen 2/curated Scripture, offline/security boundaries, backend/runtime choices, and technical data ownership.
- [Project context](docs/engineering/project-context.md): current implementation versus planned work and external setup prerequisites; source/configuration establishes what exists.
- [Design system](docs/engineering/design-system.md): visual primitives and identity application. [Testing](docs/engineering/testing.md): verification requirements and evidence limits.

Read the relevant product/content authority before feature planning, implementation, or review. Keep each requirement with its concern owner and link from other documents; do not copy the PRD or curriculum into prompts. Settled V1 policy is not reopened by missing implementation. Future decisions and external setup facts remain distinctly labeled. Coding tasks must follow the content approval/fixture rules and must not silently create production theological content.

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
- Use the documentation ownership map above; feature-specific work stays within the product, content, and navigation authorities. Source/configuration establishes what exists; planned decisions are not working integrations.
- Before writing code that relies on Expo/React Native behavior or changing Expo configuration, read relevant pages in the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/). Check other library APIs against installed versions and current authoritative documentation. Do not substitute remembered APIs from another release. If research is unavailable, identify the unverified dependency and avoid guessing its contract; unrelated work can continue.
- The user's request sets the scope and whether to plan, review, or implement. Resolve routine local choices using repository evidence. Clarify missing requirements when they materially affect behavior, privacy, a public contract, or the size of the task; do not invent product policy or external account settings.
- Keep focused work focused. Include necessary caller updates, authorization rules, and tests, but preserve unrelated local work and report unrelated issues separately. A narrow repair does not authorize a screen redesign or repository-wide refactor. Do not run `npm run reset-project` as setup; it moves or deletes source directories.
- Stop when the requested outcome and required verification are addressed. Report incomplete criteria and concrete blockers honestly; do not expand into optional improvements or present fixtures, fake saves, or fabricated credentials as a working integration.

## Navigation and UX contract

[docs/APP_NAVIGATION_AND_UX.md](docs/APP_NAVIGATION_AND_UX.md) is the single source of truth for screens, routes, screen relationships, authentication/onboarding redirects, daily flows, journey progression and completion, missed days, back behavior, navigation-related UX states, and route-level V1/Future exposure within product scope.

- Read the applicable sections before creating/deleting screens, renaming routes, changing navigation or tabs, adding a navigating CTA, changing auth/onboarding gates, adding modals/bottom sheets, changing current/historical/future-day or Day 77 behavior, implementing deep links, or working on future Community navigation.
- Before frontend implementation, identify the existing route and screen specification, legitimate entry points, every CTA destination, back behavior, auth/onboarding requirements, and relevant day states. Decide whether the task belongs on an existing screen, a pushed screen, a modal, a bottom sheet, or inline. Screen boundaries are UX decisions; do not create a screen to organize code.
- Do not invent conflicting routes, screen responsibilities, redirects, or flows. Intentional material changes require updating the contract in the same change, including its affected screen specifications, relationships, registry, and state rules. This includes screen/route removal or renaming, tabs, major CTAs, auth/onboarding, progression/completion, history/future days, Day 77, settings flows, deep links, and enabling Community. Visual changes need no contract update unless behavior changes. Link to the contract instead of copying its specification into other documents.
- When documents disagree, identify the conflict and the owner of the concern, follow that authority, and update stale guidance within an authorized change; reviews report the needed correction. Do not introduce a third behavior. Inspect the contract's **Settled V1 Decisions and Deferred Future Decisions** and **Architecture / Product Conflicts**, then current code. Follow settled V1 rules; record an explicit product decision for intentional policy changes. A navigation rule does not waive backend authorization or privacy requirements; surface unresolved implementation dependencies before implementing the affected flow.
- Distinguish Existing, Planned — V1, V1.x / post-launch, Future, and external setup prerequisites. Home/Explore have been replaced by the Today/Journey scaffold; feature behavior remains planned. Community remains Future: no V1 tab, route entry point, badge, placeholder card, or CTA unless explicitly enabled in product documentation.

## Repository conventions

- Keep routes/layouts in `src/app/` and tests outside that directory. Native tabs use `src/components/app-tabs.tsx`; web tabs use `app-tabs.web.tsx`. Preserve affected platform variants and keep browser-only behavior out of native modules.
- Preserve Expo Router conventions and established route groups; add groups only for a navigation/state need in the contract. Reuse existing navigation helpers, including shared day validation, avoid duplicate paths and scattered redirect logic, and keep protected-route gates consistent. Prefer standard stack/tab behavior with Android hardware back and iOS back gestures. Preserve normal push/pop history; use `router.replace` intentionally for state gates or contract-specified canonical redirects. A router rewrite requires a documented problem.
- Use `@/*` for `src/*` and `@/assets/*` for root assets; nearby relative imports are also established. Match local formatting and exports: kebab-case files, PascalCase components/types, camelCase functions/hooks, default route/`AppTabs` exports, and mostly named shared exports. Avoid barrel files without a concrete benefit.
- Keep local UI state local. Add shared state or data-access modules only for a current requirement, following the selected architecture. Do not create empty layers for planned features.
- Use Node 24, npm 11, and the committed npm lockfile for the app/tooling package. Select any required Lambda runtime against Amplify/AWS support during implementation under the architecture record.

## Types, boundaries, and reuse

- Retain strict TypeScript and meaningful domain types. Avoid explicit `any`, assertions that hide errors, and elaborate generics for simple problems. Validate unknown external data before treating it as a trusted type.
- Use descriptive domain names and focused functions/modules. Split when responsibilities diverge, not to meet arbitrary line counts. A one-use helper or component should materially clarify its caller or own meaningful behavior.
- Centralize repeated domain calculations, validation rules, service queries, and design primitives when that prevents drift or makes changes safer. Similar-looking code with different responsibilities need not share an abstraction. Client validation for UX does not replace validation at security boundaries.
- Interfaces, factories, dependency injection, generic repositories, wrappers, and custom hooks must solve a present problem that direct code cannot express clearly. A focused service function is often a sufficient data boundary. Avoid infrastructure for hypothetical future providers or consumers.
- Handle realistic failures at boundaries such as user input, stored records, networks, and platform APIs. Do not add fallbacks or repeated defensive checks for impossible internal states or unsupported historical formats. Catch errors to recover, translate them, provide useful context, or clean up; do not silently swallow them or turn failed operations into success.

## Comments and documentation

Prefer clear naming and structure to explanatory narration. Comments belong to non-obvious reasons or constraints: platform limitations, external API behavior, security decisions, unusual workarounds, or behavior that would otherwise look incorrect. Avoid comments that restate operations and verbose JSDoc for obvious internal code.

Keep lasting decisions and changed setup/shared contracts in the document that owns the concern. Update affected documentation when those facts change; do not create a report or document every helper for routine implementation work.

## React and reusable UI

- Use functional components and appropriate hooks. Keep dependencies correct and clean up subscriptions/resources. Prefer derived values and event-driven logic over effects that mirror state; retain real external synchronization such as web hydration handling. React Compiler is enabled in `app.json`; do not add memoization without a demonstrated benefit.
- Before building UI, read the design guide and inspect existing typography, buttons, inputs, cards, containers, navigation, icons, and state UI. Start with `ThemedText`, `ThemedView`, `useTheme`, and `src/constants/theme.ts`. Reuse established tokens and colocated `StyleSheet.create` with dynamic style arrays. The token system is partial; extend it deliberately with current product needs.
- Extract a component when a pattern repeats, it establishes a design-system primitive, it owns meaningful reusable behavior, or it materially improves clarity. A JSX fragment alone is not a reason. Use composition and a small semantic API; avoid unrelated variants and collections of boolean props. Do not independently recreate the same Button, Card, typography, or spacing system across screens.
- Provide clear hierarchy, readable content, obvious actions, predictable navigation, and relevant loading, empty, error, recovery, and success states. Forms need labels, usable validation feedback, appropriate input/keyboard behavior, and submission feedback.
- Check accessible names/roles/states, contrast, non-color cues, touch targets, text scaling, scrolling, focus, reduced motion, safe areas, and keyboard overlap where affected. Respect iOS/Android navigation and actual insets; the starter's fixed tab inset is not a universal layout solution.
- Use the selected blue 77/path/cross identity and system typography. Replace starter visuals within relevant product work, without turning a focused UI task into general rebranding.
- Keep Scripture central in daily flows rather than reducing it to a decorative habit card. Follow the contract's Scripture entry/completion and failure states: Scripture text unavailability never completes the practice or blocks unrelated available practices. Avoid punitive streaks, shame, artificial urgency, manipulative engagement, excessive achievement animation, and popularity metrics; progress is not spiritual worth.

## AWS backend and Scripture content

Apply these rules when integrations are in scope; they do not authorize scaffolding future services. Keep SDK objects and transport details behind focused service/backend modules, out of screens.

- **Backend selection:** use AWS Amplify Gen 2, Amplify Auth backed by Amazon Cognito, and Amplify Data backed by AWS AppSync and Amazon DynamoDB. Explicitly use **Cognito Lite** unless a documented requirement needs an Essentials feature; no SMS authentication/MFA, passkeys, or advanced auth by default. Use Amplify Storage/Amazon S3 only for a concrete file-storage need and AWS Lambda only for required trusted logic, preferably provisioned through Amplify. Keep EAS for mobile builds/distribution. Favor bounded, usage-based operations, minimal idle cost, and no unnecessary subscriptions or functions.
- **AWS authorization:** client checks are not user authorization. Enforce private data access with Cognito-authenticated owner-based Amplify Data rules; authenticated access alone is not ownership. Protect ownership fields from reassignment, allowlist mutable fields/types, and prevent clients from granting themselves roles, membership, or privileges. Rules combine with OR, so a broad allow rule can defeat a private boundary. Enforce verified cloud writes under the architecture record; owner rules alone do not check email verification. Authorize privileged handlers independently and grant backend IAM roles only required access; direct service access does not inherit Amplify Data rules.
- For community access when implemented, validate membership and permitted roles for the operation, including membership changes/revocation. Keep private models separate from explicitly shared ones; membership never grants access to personal content. Check model/field authorization on reads, writes, relationships, and subscriptions. Design queries and authorization together; client filters are not access control. Bound queries/subscriptions and record growth, provide required indexes, and account for actual cost, offline behavior, and synchronization. Amplify Data is the client interface, not direct DynamoDB access. Gen 2 Data does not supply durable offline storage or a pending-write queue; implement and verify the required account-scoped local persistence boundary with the relevant feature.
- **Scripture content:** use the versioned curated reading plan, canonical passage identities, translation registry, and focused data-access boundary in the architecture record. Bundle only verified, legally usable text needed by the plan. Remote storage requires a concrete licensing/product reason and stays behind that boundary; no third-party Bible API is required. Keep application-authored content separate from translation text. Verify source provenance, required attribution, and translation-specific numbering/coverage before importing; do not scrape sources, fabricate text/notices, or silently relabel a fallback. Keep Scripture out of private journals, logs, and diagnostics unless an explicitly scoped product action requires otherwise.

- Keep static AWS access keys, deployment credentials, and backend secrets out of the Expo application, committed files, and diagnostics. Client environment variables and generated Amplify outputs are public configuration, not authorization; Cognito/Amplify handle authenticated application access. Use backend secret configuration for needed secrets and scoped IAM roles for services. Use synthetic personal data and obvious non-Scripture fixtures in tests, previews, and reviews, never real journals or credentials.

## Dependencies and verification

- Before adding a dependency, check existing repository and platform/standard-library solutions, maintenance status, and compatibility. Explain the concrete benefit and maintenance cost. Do not add a package for a trivial utility or an unneeded testing/architecture layer.
- Test useful behavior and realistic failures, especially domain rules, services, validation, user interactions, and authorization. Add a regression test for a bug fix when practical. Avoid coverage-only tests, assertions that mirror implementation, and large snapshots. Mock external/native boundaries as needed while exercising the real behavior under test.
- Run `npm run check` for code/tooling changes. Run `npm run export:web` when routing, shared UI, or build configuration changes. Add applicable Amplify backend/authorization checks with integrations; root Jest only discovers `src/` tests and does not cover future `amplify/` definitions or Lambda handlers. Use isolated AWS sandboxes for enforcement tests, with synthetic data; mocks do not prove deployed authorization. Use targeted tests while iterating and do not disable checks to obtain a pass.
- Markdown-only edits need formatting and link checks; see the testing guide. Do not install tooling merely to report a check as passed. Mocked tests and static export do not establish native runtime behavior or deployed security.
- Report what changed and why, relevant files, checks actually run and outcomes, and material limits or incomplete requirements. Never claim a pass based on inspection alone.

## Planning and review work

Planning, research, and reviews are analysis-only unless the user also requests changes. Do not edit source, tests, documentation, configuration, dependencies, or external resources as a side effect of reviewing. Existing non-fixing checks may create ignored generated outputs; inspect commands that might rewrite source/configuration and use a non-mutating alternative or report them unrun. A review verdict does not authorize merge or deployment.

Keep review findings bounded by the supplied scope and supported by evidence. Order them by impact; give the location/state, evidence, user or maintenance consequence, smallest useful correction, and a verification step. Separate confirmed problems, hypotheses, and optional preferences. Distinguish pre-existing issues from introduced ones, and missing planned features from defects in current scope. No material findings is a valid result; do not recommend redesign merely to produce findings. Report the reviewed scope, checks, and evidence limits without repetitive “files changed: none” boilerplate.

For navigation-related reviews, compare the change with the contract: added/altered/removed routes or screens, changed responsibilities, CTA destinations, back behavior, auth/onboarding gates, current/history/future-day semantics, progression/completion, settings, deep links, and Future UI exposed in V1. Check duplicated navigation logic and bypassed existing helpers. Verify material changes include the corresponding contract update; a documentation edit does not itself justify a conflicting product change. UI/UX reviews must ground architectural proposals in observed flow problems, not aesthetic preference, and specify the contract update for any proposed change without editing during review.
