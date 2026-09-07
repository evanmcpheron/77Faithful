# Architecture review

Review only under `AGENTS.md`. Read relevant architecture decisions and trace representative user actions through modules, state, services, backend code, and tests in scope. Inspect actual dependencies rather than judging folder names.

Area of growth or architectural concern: `<TASK>`

Current requirements and demonstrated pain: `<REQUIREMENTS>`

## Assess fit

- Evaluate ownership, dependency direction/cycles, data flow, state ownership, and feature boundaries against current requirements. Use `docs/APP_NAVIGATION_AND_UX.md` as the authority for navigation and screen responsibilities, architecture decisions for integration boundaries, and source for implementation facts.
- Apply the shared navigation-review checklist in `AGENTS.md`, including duplicate paths/redirect logic, unnecessary screen fragmentation, helper bypasses, and undocumented material changes. Preserve existing Expo Router conventions; a proposed router or flow change needs a documented problem and corresponding contract revision. Keep open product decisions and V1/Future scope explicit.
- Check whether SDK objects or transport details leak into presentation, or domain/date rules depend unnecessarily on React/Firebase.
- Follow a concrete routine change to assess how many responsibilities must change together. Identify duplicated behavior, unclear ownership, or difficult testing with actual examples.
- Examine whether state, caching, or generic infrastructure introduces more complexity than the current need warrants. Selected future integrations are not a reason to scaffold unused layers.
- Identify boundaries worth retaining. Recommend incremental corrections for demonstrated problems, not a rewrite toward a theoretical enterprise architecture.

## Verify and report

Trace representative flows and maintenance edits through proposed corrections. Use existing non-fixing checks only when they help confirm a concern. Return a judgment of current fit and prioritized, bounded corrections with migration/testing implications. Separate observed coupling from hypothetical future risk. Stop after the scoped architectural question is answered; retaining the current design may be the appropriate result.
