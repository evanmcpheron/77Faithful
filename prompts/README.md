# 77Faithful engineering prompts

Reusable task prompts for implementing, testing, and reviewing code that the repository's owner can read and maintain. They complement [AGENTS.md](../AGENTS.md); they do not replace its engineering, product, privacy, or verification guidance.

## Use

Choose one prompt, copy its contents into Codex, and replace the obvious placeholders such as `<TASK>`, `<FEATURE>`, or `<REQUIREMENTS>`. Include the relevant paths, expected behavior, reproduction steps, design reference, or acceptance criteria. Remove an optional placeholder when it is not useful. No template engine or tooling setup is required.

Each prompt reads root and applicable directory instructions and targeted repository context. Paths in prompt instructions are relative to the repository root. Current source/configuration establishes what exists; engineering decision records establish selected behavior and architecture. Recheck both as the app evolves instead of treating this library as a frozen stack inventory.

Implementation prompts authorize the specified work and its necessary tests. Planning, research, and review prompts are analysis-only unless you explicitly request changes. API.Bible defaults to review if the task does not name a mode. Review checks may create ignored temporary/generated outputs; if a command would rewrite source or configuration, use a non-mutating alternative or report it unrun. A review verdict does not authorize merging, deployment, or publication.

Keep tasks bounded by a user outcome. Use small, verifiable implementation increments, then review the completed scope. Make reasonable low-risk assumptions explicit; account credentials, deployed settings, and licensing entitlements require evidence.

## Choose a prompt

“No” means no code changes unless explicitly authorized. “Yes” is limited to the stated task.

| Prompt                                                                   | Purpose                                                 | Changes code?                   | Typical lifecycle point                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------- | ---------------------------------------- |
| [01-feature-planning.md](01-feature-planning.md)                         | Map behavior, reuse, risks, and implementation steps    | No                              | Before implementation                    |
| [02-technical-research.md](02-technical-research.md)                     | Compare technical options using current evidence        | No                              | Before an uncertain decision             |
| [03-frontend-feature.md](03-frontend-feature.md)                         | Implement an interaction or frontend flow               | Yes                             | Feature implementation                   |
| [04-screen-implementation.md](04-screen-implementation.md)               | Build a screen from requirements/design                 | Yes                             | Screen implementation                    |
| [05-component-design-system.md](05-component-design-system.md)           | Create or improve a focused shared primitive            | Yes; migration only if scoped   | When UI reuse is needed                  |
| [06-ui-ux-audit.md](06-ui-ux-audit.md)                                   | Review usability and complete mobile flows              | No                              | After UI is usable                       |
| [07-ui-consistency-review.md](07-ui-consistency-review.md)               | Find accidental visual/component drift                  | No                              | After related screens grow               |
| [08-backend-firebase-feature.md](08-backend-firebase-feature.md)         | Implement data access and authorization together        | Yes                             | Backend integration                      |
| [09-firestore-data-model.md](09-firestore-data-model.md)                 | Design/review paths, queries, ownership, and growth     | No                              | Before schema work or migration          |
| [10-firebase-security-review.md](10-firebase-security-review.md)         | Review rules and privileged access boundaries           | No                              | After Firebase access changes            |
| [11-api-bible-integration.md](11-api-bible-integration.md)               | Implement/review licensed Scripture access              | Only in explicit implement mode | Scripture integration                    |
| [12-unit-tests.md](12-unit-tests.md)                                     | Test meaningful rules and unit behavior                 | Yes; tests                      | During implementation or regression work |
| [13-component-tests.md](13-component-tests.md)                           | Test user-visible states and interactions               | Yes; tests                      | During UI implementation                 |
| [14-bug-investigation.md](14-bug-investigation.md)                       | Establish a cause, fix it, and prevent recurrence       | Yes; evidence-based fix         | When a defect appears                    |
| [15-code-quality-review.md](15-code-quality-review.md)                   | Review correctness and maintainability                  | No                              | After a focused implementation           |
| [16-refactor.md](16-refactor.md)                                         | Resolve a maintenance problem while preserving behavior | Yes                             | When a specific design burden emerges    |
| [17-performance-review.md](17-performance-review.md)                     | Measure and investigate a suspected bottleneck          | No                              | When performance is a concern            |
| [18-accessibility-review.md](18-accessibility-review.md)                 | Find barriers to operating the mobile UI                | No                              | After UI changes                         |
| [19-security-privacy-review.md](19-security-privacy-review.md)           | Trace sensitive data and application security           | No                              | After sensitive-data/integration changes |
| [20-pull-request-review.md](20-pull-request-review.md)                   | Review the actual diff and give a merge verdict         | No                              | Before merging                           |
| [21-release-readiness.md](21-release-readiness.md)                       | Identify release blockers and missing evidence          | No                              | Before a milestone/release               |
| [22-architecture-review.md](22-architecture-review.md)                   | Assess boundaries against actual application size       | No                              | After meaningful growth                  |
| [23-feature-completion-review.md](23-feature-completion-review.md)       | Check every acceptance criterion for completeness       | No                              | After feature implementation             |
| [24-human-maintainability-review.md](24-human-maintainability-review.md) | Examine the cost of future manual edits/debugging       | No                              | After complex AI-assisted work           |
| [25-product-experience-review.md](25-product-experience-review.md)       | Check formation goals, agency, and participant trust    | No                              | After a participant-facing feature       |

## Suggested workflow

Feature idea → technical research if necessary → feature planning → implementation prompt → testing → feature completion review → code quality / UI/UX review where appropriate → pull request review.

You do not need every prompt for every change. A small bug may need only investigation, its regression test, and a diff review. Choose frontend, screen, component, Firebase, or API.Bible implementation according to the actual work. Add accessibility, privacy, product, performance, or architecture reviews when the change warrants them; use release readiness at the milestone boundary.

## Repository fit

- [Project context](../docs/engineering/project-context.md) records the Expo/React Native/TypeScript setup, `src/app/` routes, platform variants, and local state. Prompts defer exact versions to current configuration and follow the versioned Expo documentation instruction in `AGENTS.md`.
- [Design system](../docs/engineering/design-system.md) inventories the existing themed primitives and partial token system. Frontend prompts reuse those foundations and add missing primitives only for current needs.
- [Testing](../docs/engineering/testing.md) defines Jest/React Native Testing Library conventions, async interactions, tests outside routes, and project checks. Code changes currently require `npm run check`; relevant shared UI/routing/build changes also require `npm run export:web`. Static export and mocked tests do not prove native runtime behavior.
- [Architecture decisions](../docs/engineering/architecture-decisions.md) selects native Firebase, private personal records, an authenticated API.Bible gateway, session-memory Scripture caching, and calendar-day journey semantics. These integrations were planned when the library was authored; prompts require checking their implementation status. Community/sharing checks apply only when present or explicitly in scope.

The goal/context/boundaries/verification structure also follows the [official OpenAI prompting guidance](https://learn.chatgpt.com/docs/prompting#prompting-codex). General code-quality and comment rules remain in `AGENTS.md` instead of being repeated throughout the library.
