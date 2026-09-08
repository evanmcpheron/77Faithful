# 77Faithful engineering prompts

Choose one prompt for a bounded task, replace its placeholders, and supply the relevant paths, expected behavior, reproduction steps, or acceptance criteria. Paste it into Codex or ask Codex to read the named file. Paths inside prompts are relative to the repository root. No template tooling is required.

[AGENTS.md](../AGENTS.md) owns shared engineering/workflow rules and the documentation ownership map. Prompts add task-specific guidance; they are not a sequence to run on every change. Implementation includes necessary verification. Planning/review stays analysis-only unless your request also includes changes.

Every prompt inherits the documentation-ownership and **Navigation and UX contract** rules in `AGENTS.md`; `CLAUDE.md` imports that same file. [docs/PRODUCT_REQUIREMENTS.md](../docs/PRODUCT_REQUIREMENTS.md) owns settled product policy and feature-level release scope. [docs/FORMATION_CONTENT_SPEC.md](../docs/FORMATION_CONTENT_SPEC.md) owns curriculum structure, human production approval, content versions/storage, fixtures, and future variants/group consistency. [docs/APP_NAVIGATION_AND_UX.md](../docs/APP_NAVIGATION_AND_UX.md) owns routes, screen relationships, flow/state behavior, and route-level release exposure. Read its applicable specifications before frontend or flow work and use it as the baseline for relevant reviews/tests. Material navigation changes require a contract update in the same change; reviews propose that update without editing. Keep settled V1 policy, deferred Future questions, and external setup prerequisites distinct; follow the documentation-ownership/conflict rule in `AGENTS.md`.

Use the live files in this directory. `Archive.zip` is a historical snapshot containing superseded prompts, not an instruction source or prompt generator. There is no generated prompt layer to update.

## Choose a prompt

| Prompt                                                           | Use for                                                         | Mode          |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ------------- |
| [01 Feature planning](01-feature-planning.md)                    | Scope, reuse, acceptance criteria, and implementation steps     | Plan          |
| [02 Technical research](02-technical-research.md)                | A concrete uncertain technical decision                         | Research      |
| [03 Frontend feature or screen](03-frontend-feature.md)          | A screen, interaction, or bounded mobile flow                   | Implement     |
| [05 Component/design system](05-component-design-system.md)      | One shared primitive and scoped caller updates                  | Implement     |
| [06 UI/UX audit](06-ui-ux-audit.md)                              | Obstacles to understanding or completing a flow                 | Review        |
| [07 UI consistency](07-ui-consistency-review.md)                 | Accidental visual drift and duplicated primitives               | Review        |
| [08 Firebase feature](08-backend-firebase-feature.md)            | Data access with authorization, rules, and tests                | Implement     |
| [09 Firestore data model](09-firestore-data-model.md)            | Paths, access patterns, queries, and data lifecycle             | Design/review |
| [10 Firebase security](10-firebase-security-review.md)           | Rules, handlers, and allow/deny boundaries                      | Review        |
| [11 API.Bible](11-api-bible-integration.md)                      | Licensed Scripture access through the selected gateway          | Implement     |
| [12 Unit tests](12-unit-tests.md)                                | Meaningful service/domain/hook behavior                         | Tests only    |
| [13 Component tests](13-component-tests.md)                      | Rendered states and user interactions                           | Tests only    |
| [14 Bug investigation and fix](14-bug-investigation.md)          | Evidence-based diagnosis and focused repair                     | Diagnose/fix  |
| [15 Code quality and maintainability](15-code-quality-review.md) | Correctness and concrete human editing/debugging cost           | Review        |
| [16 Refactor](16-refactor.md)                                    | A demonstrated maintenance burden; preserve behavior            | Refactor      |
| [17 Performance](17-performance-review.md)                       | Measurements and diagnosis of a suspected bottleneck            | Investigate   |
| [18 Accessibility](18-accessibility-review.md)                   | Barriers to operating a mobile flow                             | Review        |
| [19 Security/privacy](19-security-privacy-review.md)             | Sensitive-data lifecycle and provider boundaries                | Review        |
| [20 Pull request](20-pull-request-review.md)                     | A specified diff and merge recommendation                       | Review        |
| [21 Release readiness](21-release-readiness.md)                  | Evidence and blockers for a defined milestone                   | Review        |
| [22 Architecture](22-architecture-review.md)                     | Boundaries and ownership against current needs                  | Review        |
| [23 Feature completion](23-feature-completion-review.md)         | Acceptance criteria versus implementation/evidence              | Review        |
| [25 Product experience](25-product-experience-review.md)         | Formation principles, participant agency, and trust             | Review        |
| [26 Navigation foundation](26-navigation-foundation.md)          | Scaffold or extend V1 routes with honest integration boundaries | Implement     |

A small bug may need only 14. For a feature, use planning/research when uncertainty warrants it, choose the relevant implementation prompt, and review the completed scope. Add specialized reviews when their risks are involved; no review quota is expected.

Screen prompt 04 was merged into 03; human maintainability prompt 24 was merged into 15. Remaining numbers are unchanged. Prompt 11 now focuses on implementation; for an API.Bible review, use 19 and include the provider contract checks from 11. Specify “investigate only” with 14 when you want diagnosis without a fix.

Consult the relevant [project context](../docs/engineering/project-context.md), [integration/architecture decisions](../docs/engineering/architecture-decisions.md), [design inventory](../docs/engineering/design-system.md), and [testing guide](../docs/engineering/testing.md) as needed. When maintaining this library, keep shared rules in `AGENTS.md`, link to the product/content authorities and navigation contract rather than copying their policies, curriculum, routes, or screen specifications, retain task-specific verification and stopping conditions, and check prompts against actual repository changes rather than duplicating a version inventory.
