# Amplify Data model design or review

Design/review only under `AGENTS.md`. Read `docs/PRODUCT_REQUIREMENTS.md`, `docs/FORMATION_CONTENT_SPEC.md` for journey/content ownership, and the selected architecture and inspect existing models, types, services, authorization, indexes, and tests. Consult current official Amplify Gen 2 and AWS documentation for capabilities affecting this model. Amplify Data is the application interface to AppSync/DynamoDB; follow the architecture's Cognito Lite authentication boundary.

Feature or query problem: `<TASK>`

Required reads, writes, and behavior: `<REQUIREMENTS>`

## Model

- Identify owners, permitted readers/writers, model IDs, relationship fields, and mutable versus protected fields. Extend the selected private domain models where suitable; distinguish existing and proposed records. Do not couple the React Native client to physical DynamoDB tables.
- For auth/onboarding, journey/day state, settings, or Community data, derive supported transitions from `docs/APP_NAVIGATION_AND_UX.md`; do not let schema convenience invent screens, progression, or sharing policy. Preserve private reflection, journal, intention, and prayer records separately from explicitly shared items; membership is not consent.
- Map required operations to supported filters/order, pagination, secondary indexes, and model/field authorization. Apply the access boundaries in `AGENTS.md`: broad authenticated access is not ownership, rules combine with OR, and client filters cannot protect private records. Protect owner fields from reassignment and authorize relationships independently; field-level rules do not justify mixing private and shared records.
- Consider bounded record/list growth, subscription scope, contention, and read amplification. Denormalize only for actual access needs and identify who keeps copies consistent. Add subscriptions or Lambda only when the requirement needs them.
- Explain the application-owned offline queue, conflict behavior, partial updates, and required atomic operations; do not assume Gen 2 Data provides durable offline persistence. Trace deletion through related records and affected copies/files; relationships do not imply cascade deletion. Identify invariants requiring a server operation and prevent generated mutations from bypassing it.
- Address data versioning for a current requirement, not hypothetical future formats. Pin immutable local content versions and preserve historical journeys/day practice definitions as required; future variants/group plans do not authorize speculative V1 models. Community models belong only to an explicitly included feature.

## Verify and report

Walk representative allowed and denied operations through the proposal. Return concise synthetic model/record examples and a query/access matrix where useful, with required indexes, authorization constraints, isolated AWS sandbox test cases, and material tradeoffs. Label unverified service limits and cost estimates. Stop at a model that supports the stated access patterns; do not implement it, provision a sandbox, or modify cloud data.
