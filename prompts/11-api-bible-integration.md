# API.Bible integration

## Role

Act as an engineer implementing or reviewing licensed Scripture access.

## Task

Task, explicitly saying “implement” or “review”: `<TASK>`

Required passages, selection behavior, and acceptance criteria: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant architecture, project, and testing guidance. Inspect existing Scripture UI, services, gateway code, configuration, and tests where present. Research current official API.Bible authentication, identifiers, version capabilities, licensing/attribution, caching, and usage documentation when network access is available.

## Success criteria

The implementation or review accounts for correct passage/version selection, protected credentials, applicable content rights, and useful network/error states.

## Constraints

If the task does not specify implementation, review only. Do not modify code, tests, configuration, documentation, or external resources in review mode unless explicitly asked.

Follow the selected authenticated, App Check-protected backend gateway; enforce user authorization in the handler and keep provider secrets server-side. Keep API-specific networking behind services. Do not duplicate licensed Bible text in source, bundles, or journal records. Follow the selected session-memory-only caching policy unless a separately authorized decision changes it.

## Implementation or review expectations

- Verify authentication/configuration and explicit allowed Bible/version, book, chapter, and passage identifiers. Do not guess account entitlements or assume translations support identical content, numbering, or endpoints.
- Keep application-authored prompts/references separate from licensed text. Preserve required reference, version, and attribution in rendering; check applicable native/web licensing obligations.
- Handle invalid identifiers, unavailable versions, parsing, timeouts, network loss, quotas, and rate/cost limits deliberately. Bound requests/retries according to the decision record.
- Key caches by version and passage. Prevent stale responses during translation switching and avoid silent translation substitution.
- Keep passage references and other practices usable when text is unavailable. Never report a live integration as configured using fabricated credentials or entitlement assumptions.
- If current documentation or account terms cannot be checked, state the limitation and complete independent work without assuming permission to display or persist content.

## Verification

For implementation, add service/gateway/state tests with synthetic responses covering authorization, input validation, attribution, selection, and failures. Avoid live provider calls in routine tests. Run `npm run check`, applicable backend checks, and web export when shared UI changes. For review, use existing non-fixing checks and cited evidence; label unverified provider/runtime behavior.

## Final response

Report changes or prioritized review findings, files changed, tests/checks and outcomes, authoritative sources used, and remaining concerns, including licensing or configuration gaps.
