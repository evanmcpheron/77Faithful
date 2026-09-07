# Frontend feature or screen

Implement the specified screen, interaction, or bounded flow. Read `AGENTS.md`, `docs/engineering/design-system.md`, and relevant product decisions. Inspect similar screens, actual shared primitives/tokens, affected routes, data contracts, and tests before designing or coding.

Feature/screen and optional design reference: `<FEATURE>`

Content, behavior, and acceptance criteria: `<REQUIREMENTS>`

## Implement

- Reuse the existing design system and apply the component-extraction criteria in `AGENTS.md`. Add a missing primitive only for a current need. Explain material deviations from a supplied design when accessibility or platform behavior requires them.
- Establish clear reading order, hierarchy, and primary/secondary actions. Connect entry, back, and completion paths through the existing navigation, preserving affected native/web variants.
- Implement the states the flow can actually reach: loading, empty, error/recovery, and relevant pressed, disabled, submitting, and success feedback. Keep user input when recovery permits it.
- For forms, provide labels, validation feedback, suitable keyboard/input settings, focus progression, and protection against duplicate submission where needed.
- Account for scrolling, safe areas, actual navigation insets, keyboard overlap, both themes, text scaling, and accessible controls. Keep Scripture readable and central when the screen displays it.
- Use service contracts that keep SDK and provider details out of UI components. If an integration prerequisite is missing, identify the incomplete contract and complete independent scoped UI work without fabricating successful saves or live data. Keep synthetic fixtures in tests and designated development previews/prototypes, including the selected web preview; they do not satisfy a required native integration.

## Verify and finish

Test meaningful rendered states and user interactions, then run the implementation checks required by `AGENTS.md`. Exercise the affected flow on available iOS/Android runtimes, at small phone sizes, larger text, and both themes; include web preview checks where affected. Report unavailable platform checks and incomplete criteria. Finish when the specified flow is implemented and verification is accounted for; leave other screens outside scope.
