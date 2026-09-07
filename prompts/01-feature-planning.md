# Feature planning

Plan only. Read `AGENTS.md` and relevant architecture decisions; inspect the affected code and tests before proposing work.

Feature and intended user outcome: `<FEATURE>`

Acceptance criteria and constraints: `<REQUIREMENTS>`

## Plan

- Define observable success and the boundaries of this feature. Distinguish selected decisions from implemented capabilities; identify material missing requirements rather than inventing product policy.
- Name affected routes, components, services, domain behavior, and data. Identify existing pieces to reuse and a concrete reason for any new boundary. Consult the design guide for UI work.
- Include authorization, privacy, offline behavior, and data lifecycle only where affected. Use the documented journey semantics for date/progress behavior.
- Order the necessary work into small, verifiable increments that together deliver the requested outcome. Separate external prerequisites and optional improvements from required implementation.

## Verification and result

Check that every acceptance criterion maps to proposed work and a useful test or runtime check from `docs/engineering/testing.md`. Do not run implementation checks merely to validate a plan.

Return the bounded plan, reuse/affected files, verification approach, and material assumptions or blockers. Stop at the plan; do not implement it.
