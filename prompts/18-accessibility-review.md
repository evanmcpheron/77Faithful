# Accessibility review

Review only under `AGENTS.md`. Read relevant design/testing guidance and inspect the scoped controls, navigation, forms, and dynamic states. Use available iOS/Android runtimes and current official platform guidance for specific API or numeric recommendations.

Screens, components, or flow: `<TASK>`

## Evaluate barriers

- Check accessible names, roles, necessary hints, icon-only controls, decorative elements, and disabled/selected/expanded states.
- Measure relevant contrast and touch targets; check both themes, non-color cues, text scaling, wrapping, scrolling, and reading order.
- Follow screen-reader focus, movement/restoration, keyboard behavior, and modal/route transitions.
- Compare controls and transitions with `docs/APP_NAVIGATION_AND_UX.md`: named navigation actions, understandable future-day locks, reachable Scripture/reflection actions, source-aware back behavior, and safe modal dismissal. Evaluate actual navigation barriers without changing screen boundaries for preference; any necessary architectural proposal includes a proposed contract update.
- Examine form labels, error association/announcement, validation recovery, submission feedback, and dynamic/loading announcements.
- Check reduced-motion behavior and whether state changes remain understandable without animation.

## Verify and report

Exercise VoiceOver/TalkBack, larger text, both themes, and reduced motion where tools are available. Use existing non-fixing tests to inspect exposed semantics, while identifying focus, layout, and assistive-technology checks requiring runtime evidence. Report barriers with the affected task, location/state, evidence, practical correction, and verification step. Distinguish measured/observed problems from source-based concerns and browser-only evidence. Stop at the scoped flow; neither source inspection nor automated tests establish accessibility compliance.
