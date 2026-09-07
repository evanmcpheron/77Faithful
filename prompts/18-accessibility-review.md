# Accessibility review

Review only under `AGENTS.md`. Read relevant design/testing guidance and inspect the scoped controls, navigation, forms, and dynamic states. Use available iOS/Android runtimes and current official platform guidance for specific API or numeric recommendations.

Screens, components, or flow: `<TASK>`

## Evaluate barriers

- Check accessible names, roles, necessary hints, icon-only controls, decorative elements, and disabled/selected/expanded states.
- Measure relevant contrast and touch targets; check both themes, non-color cues, text scaling, wrapping, scrolling, and reading order.
- Follow screen-reader focus, movement/restoration, keyboard behavior, and modal/route transitions.
- Examine form labels, error association/announcement, validation recovery, submission feedback, and dynamic/loading announcements.
- Check reduced-motion behavior and whether state changes remain understandable without animation.

## Verify and report

Exercise VoiceOver/TalkBack, larger text, both themes, and reduced motion where tools are available. Use existing non-fixing tests to inspect exposed semantics, while identifying focus, layout, and assistive-technology checks requiring runtime evidence. Report barriers with the affected task, location/state, evidence, practical correction, and verification step. Distinguish measured/observed problems from source-based concerns and browser-only evidence. Stop at the scoped flow; neither source inspection nor automated tests establish accessibility compliance.
