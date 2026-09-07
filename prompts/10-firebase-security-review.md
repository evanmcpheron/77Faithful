# Firebase security review

## Role

Act as an engineer reviewing Firebase authorization, validation, and private-data boundaries.

## Task

Firebase feature, rules, or security scope: `<TASK>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions, relevant architecture decisions, and testing guidance. Inspect actual Auth assumptions, client calls, Firestore/Storage rules, privileged handlers, indexes, emulator tests, and environment configuration where present. Distinguish selected design from deployed-state evidence.

## Success criteria

Find evidence-backed authorization or validation defects and provide concrete fixes and tests that preserve intended access.

## Constraints

Review only; do not edit code, rules, tests, configuration, documentation, or cloud resources unless explicitly asked. Never weaken rules for development convenience. Use synthetic emulator data; do not test cross-user access against real personal records.

## Review expectations

- Trace unauthenticated, unverified, ordinary-user, and administrative operations across every relevant entry point.
- Check document/file ownership, mutable owner IDs, allowed fields/types, privilege escalation, and client-controlled roles or authorization data.
- Examine cross-user reads/writes, queries, broad rule matches, and administrative operations. Backend Admin SDK access bypasses rules and needs its own authorization; App Check is not a permission system.
- Treat journals and reflections as private. If community membership or prayer requests actually exist, check visibility, membership changes, and cross-community access; do not invent those features.
- For Storage, inspect object paths, metadata validation, upload constraints, and download/share mechanisms that may expose private files.
- Rank findings as Critical, High, Medium, or Low. Include exact location, evidence or attack path, impact, recommended correction, and a concrete allow/deny regression test. Separate confirmed vulnerabilities from hypotheses.

## Verification

Run existing relevant emulator/security tests where available and inspect both allowed and denied operations. Repository rules do not prove production deployment; mocked client tests do not prove enforcement. Report absent rules, deployment evidence, or test tooling without installing or deploying anything.

## Final response

Provide prioritized findings and fixes/tests, or state no confirmed issue within the reviewed scope. Report changes/files changed (normally none), checks performed and outcomes, and remaining concerns or unverified boundaries.
