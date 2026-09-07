# Firestore data-model design or review

Design/review only under `AGENTS.md`. Read the selected architecture and inspect existing paths, types, services, rules, indexes, and tests. Consult current official Firebase documentation for capabilities affecting this model.

Feature or query problem: `<TASK>`

Required reads, writes, and behavior: `<REQUIREMENTS>`

## Model

- Identify owners, permitted readers/writers, document paths/IDs, references, and mutable versus protected fields. Extend the selected user-owned paths where suitable; distinguish existing and proposed records.
- For auth/onboarding, journey/day state, settings, or Community data, derive supported transitions from `docs/APP_NAVIGATION_AND_UX.md`; do not let schema convenience invent screens, progression, or sharing policy. Preserve private reflection, journal, intention, and prayer records separately from explicitly shared items; membership is not consent.
- Map required operations to filters/order, pagination, indexes, and authorization. Apply the access boundaries in `AGENTS.md`; a private field cannot be hidden inside a document readable by others, and rules do not filter query results.
- Consider bounded document/list growth, listener scope, contention, and read amplification. Denormalize only for actual access needs and identify who keeps copies consistent.
- Explain relevant offline/conflict behavior, partial updates, and required atomic operations. Trace deletion through nested records and affected copies/files.
- Address migration/versioning for existing data or an explicit requirement, not hypothetical future formats. Community models belong only to an explicitly included feature.

## Verify and report

Walk representative allowed and denied operations through the proposal. Return concise synthetic document examples and a query/access matrix where useful, with required indexes, rule constraints, emulator test cases, and material tradeoffs. Label unverified provider limits and cost estimates. Stop at a model that supports the stated access patterns; do not implement it or modify cloud data.
