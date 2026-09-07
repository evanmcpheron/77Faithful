# Behavior-preserving refactor

Refactor the specified scope. Read `AGENTS.md` and inspect target modules, callers, contracts, platform variants, tests, and local changes before editing.

Scope and maintainability problem: `<TASK>`

Behavior/contracts to preserve: `<REQUIREMENTS>`

## Establish and make the change

- Identify a specific maintenance burden in the current code and explain how the proposed change reduces it. If the request only says “refactor this screen,” establish that reason from the code first; if no material problem is evident, report that no refactor is warranted.
- Protect important existing behavior with relevant tests; add narrow characterization cases first where that protection is missing.
- For screen, routing, or journey-state work, read `docs/APP_NAVIGATION_AND_UX.md` and map existing routes, responsibilities, CTA destinations, gates, and back/day behavior before moving code. Preserve route paths and user-facing screen boundaries; component extraction does not authorize new screens, groups, modals, or redirects. Report existing contract mismatches separately; authorized material behavior changes require the contract update in the same change.
- Make the smallest coherent change that resolves the burden. Preserve observable behavior, data contracts, accessibility, and platform semantics. Do not combine feature additions or behavior-changing bug fixes unless the user's scope includes them; report discovered defects separately.
- Preserve public contracts. If a local internal API change is necessary, update its affected consumers together rather than adding an unused compatibility layer or leaving them broken.
- Update engineering documentation only when documented facts or conventions change.

## Verify and finish

Run relevant tests before and after, followed by required `AGENTS.md` checks. Inspect the diff for behavioral changes, unnecessary scope expansion, and assertions weakened to accommodate the rewrite. Report the concrete maintenance improvement and preservation evidence. Stop when the identified burden is resolved; do not continue restructuring surrounding code.
