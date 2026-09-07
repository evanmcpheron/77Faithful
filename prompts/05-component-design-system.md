# Component and design-system work

Implement a focused shared primitive. Read `AGENTS.md` and `docs/engineering/design-system.md`; inspect actual usages, comparable components, tokens, and tests before choosing an API.

Component or design-system problem: `<TASK>`

Required behavior, example consumers, and migration scope: `<REQUIREMENTS>`

## Implement

- Establish the responsibility from current consumers or the requested primitive's concrete use case. Extend an adequate existing component before adding another; do not invent consumers or variants to justify an abstraction.
- For navigating controls, headers, tabs, editors, or modal/sheet behavior, read the relevant specifications in `docs/APP_NAVIGATION_AND_UX.md`. Preserve caller destinations, back/dismissal behavior, and screen responsibilities; extracting a component does not justify a new screen. Keep route/state decisions with the existing navigation owner and use shared helpers where available.
- Apply the extraction criteria in `AGENTS.md`. Prefer composition and a small semantic API; forward useful native props without exposing unrelated implementation options.
- Reuse shared styling conventions and add tokens only for this primitive's needs. Preserve applicable accessibility semantics, caller props, focus, text scaling, interaction feedback, and platform behavior.
- Update callers directly affected by a changed contract and the explicitly included usages. Keep broader adoption separate; do not leave broken consumers or add compatibility layers merely to avoid a necessary local update.
- Update the design-system inventory when its shared contract or tokens change. A real scoped usage or behavioral test can demonstrate the API; a separate demo system is unnecessary.

## Verify and finish

Test meaningful interactions, important supported variants, and changed contracts; inspect affected consumers for regressions. Complete `AGENTS.md` checks and available native/theme verification. Finish with the requested primitive and bounded caller updates, not an expanded component suite.
