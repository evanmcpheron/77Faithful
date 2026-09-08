# UI/UX audit

Review only under `AGENTS.md`. Read `docs/PRODUCT_REQUIREMENTS.md` for scope and practice/trust policy, `docs/FORMATION_CONTENT_SPEC.md` when reviewing authored formation content, and `docs/APP_NAVIGATION_AND_UX.md` for the scoped screen/flow specifications, relationships, states, settled V1 decisions, and deferred Future questions, and the design guide for visuals. Inspect comparable UI and observe the selected flow in available runtimes or supplied captures.

Screens or flow: `<TASK>`

Intended user outcome and requirements: `<REQUIREMENTS>`

## Evaluate

- Assess visual hierarchy, reading order, terminology, readability, spacing/density, primary actions, discoverability, and design consistency.
- Compare entries, CTA destinations, back/dismissal, completion, and recovery with the contract. Check dead ends, inconsistent back behavior, duplicate or misnamed routes, redundant/fragmented screens, excessive taps, unclear primary CTAs, and inappropriate modals. Respect iOS/Android conventions.
- Check auth flashes, onboarding bypasses, current-day/history inconsistencies, and future-day accessibility semantics and locks, including direct-link bypasses. Future rows must remain understandable without enabling forbidden content access. Verify Settings returns to its actual source and preserves intended preference effects.
- Examine forms, validation, submission feedback, keyboard behavior, touch targets, accessibility, scrolling, safe areas, and relevant loading, empty, and error states.
- Check destructive actions for clear consequences and proportionate protection. Flag Community UI leaking into V1, private spiritual content treated as social by default, punitive missed-day messaging, and gamification implying spiritual worth. Verify Scripture remains central and failures preserve unrelated daily actions.
- Separate observable usability problems from visual preference. Support findings with a blocked/confusing task, measured contrast/target/layout issue, inconsistent control behavior, or other concrete evidence. Do not recommend a redesign simply to produce findings.

## Verify and report

Reproduce important issues where possible in the affected themes, text sizes, and platforms. Label source-only concerns and untested states; a desktop screenshot cannot establish mobile usability. Return prioritized findings using the review format in `AGENTS.md`, with bounded corrections. A warranted architectural proposal must identify the required navigation-contract update; aesthetics alone do not justify changing the architecture. Keep the review analysis-only. Stop after the requested flow; no material findings is an acceptable result.
