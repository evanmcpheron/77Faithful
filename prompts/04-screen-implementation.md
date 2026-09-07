# Screen implementation

## Role

Act as a mobile UI engineer building a coherent, accessible 77Faithful screen.

## Task

Screen and design reference, if any: `<SCREEN>`

Content, behavior, and acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and `docs/engineering/design-system.md`. Inspect similar implemented screens before designing the layout, then relevant routes, shared primitives, tokens, and tests. Consult selected product decisions when the screen involves practices or personal data.

## Success criteria

The screen meets its requirements, fits the existing visual system, and supports the full user flow across relevant states and common phone sizes.

## Constraints

Do not give the screen its own competing button, card, header, typography, or spacing conventions. A missing shared primitive may be added when it has a clearly reusable responsibility; do not turn every fragment into a component. Follow the repository's partial token system and extend it deliberately only where needed.

Use existing data contracts; do not invent backend behavior or fabricate successful saves. Adapt a design reference where platform behavior or accessibility requires it, explaining material deviations.

## Implementation expectations

- Establish clear reading order, hierarchy, and primary/secondary actions. Keep Scripture and reflection content readable and visual density intentional.
- Use shared colors, typography, spacing, and available radius/sizing tokens; preserve light/dark behavior.
- Implement relevant pressed, disabled, submitting, success, loading, empty, and recoverable error states.
- For forms, provide labels, validation feedback, suitable keyboard/input settings, focus progression, and duplicate-submission protection where needed.
- Account for scrolling, safe areas, actual navigation insets, keyboard overlap, text scaling, and accessible controls. Do not assume the starter's fixed tab inset solves every layout.
- Integrate the route into the existing native/web navigation where applicable.

## Verification

Test meaningful rendered states and interactions with the established setup. Run `npm run check` and the relevant static export required by `AGENTS.md`. Inspect the screen in available runtimes at small/large phone sizes, larger text, and both themes; report unavailable visual/device checks.

## Final response

Summarize the screen behavior, files changed, reused/new primitives, tests/checks and results, and remaining concerns or design deviations.
