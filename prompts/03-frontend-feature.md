# Frontend feature or screen

Implement the specified screen, interaction, or bounded flow. Read `AGENTS.md`, `docs/APP_NAVIGATION_AND_UX.md`, `docs/engineering/design-system.md`, and relevant feature requirements. Inspect similar screens, actual shared primitives/tokens, affected routes, data contracts, and tests before designing or coding.

Feature/screen and optional design reference: `<FEATURE>`

Content, behavior, and acceptance criteria: `<REQUIREMENTS>`

## Before implementation

1. Identify the existing route and applicable screen specification in the navigation contract. Distinguish current starter code from Planned — V1, Future, and Optional / undecided behavior; inspect open decisions that affect the task.
2. Map legitimate entry points, every CTA destination, expected back/dismissal behavior, and auth/onboarding requirements. Verify current, previous, future, and ended-journey states where relevant.
3. Decide whether this belongs on an existing screen, a pushed screen, a modal, a bottom sheet, or inline. Do not create a screen merely to organize code.
4. Reuse existing route-group, stack/tab, and navigation-helper patterns under `AGENTS.md`. Identify any intentional material departure and update the contract in the same change; do not independently invent a competing flow.

## Implement

- Reuse the existing design system and apply the component-extraction criteria in `AGENTS.md`. Add a missing primitive only for a current need. Explain material deviations from a supplied design when accessibility or platform behavior requires them.
- Establish clear reading order, hierarchy, and primary/secondary actions. Connect entry, back, and completion paths through the existing navigation, preserving affected native/web variants.
- Implement the states the flow can actually reach: loading, empty, error/recovery, and relevant pressed, disabled, submitting, and success feedback. Keep user input when recovery permits it.
- For forms, provide labels, validation feedback, suitable keyboard/input settings, focus progression, and protection against duplicate submission where needed.
- Account for scrolling, safe areas, actual navigation insets, keyboard overlap, both themes, text scaling, and accessible controls. Keep Scripture readable and central when the screen displays it.
- In daily work, preserve the contract's Scripture-first flow, explicit completion, and access to unrelated practices during API.Bible failure. Keep reflection/prayer/intention content private and missed-day copy non-punitive. Do not expose Community entry points, badges, or placeholders in V1.
- Use service contracts that keep SDK and provider details out of UI components. If an integration prerequisite is missing, identify the incomplete contract and complete independent scoped UI work without fabricating successful saves or live data. Keep synthetic fixtures in tests and designated development previews/prototypes, including the selected web preview; they do not satisfy a required native integration.

## Verify and finish

Test meaningful rendered states and user interactions using the applicable user-flow cases in `docs/engineering/testing.md`, then run the implementation checks required by `AGENTS.md`. Exercise the affected flow on available iOS/Android runtimes, at small phone sizes, larger text, and both themes; include web preview checks where affected. Report unavailable platform checks and incomplete criteria. Finish when the specified flow is implemented and verification is accounted for; leave other screens outside scope.
