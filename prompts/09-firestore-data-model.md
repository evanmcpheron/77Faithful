# Firestore data-model design or review

## Role

Act as an engineer designing or reviewing a Firestore model for a concrete feature.

## Task

Feature, model, or query problem: `<TASK>`

Required reads, writes, and behavior: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant architecture/project context. Inspect existing document types, paths, services, queries, rules, indexes, and tests where present. Consult current official Firebase documentation for capabilities that affect the decision.

## Success criteria

Propose a model that supports the required access patterns, bounded data growth, enforceable ownership, and private-data lifecycle with understandable tradeoffs.

## Constraints

Design/review only: do not implement the model or edit repository/cloud resources unless explicitly asked. Extend the selected user-owned paths where suitable. Distinguish existing documents from proposed shapes.

Match Firestore's strengths; do not emulate relational joins or build speculative collections. Community features are outside the selected first release: analyze membership and shared visibility only if present or explicitly in scope.

## Design/review expectations

- Identify owners, readers/writers, collections/subcollections, references, document IDs, and mutable versus immutable fields.
- Map each required query/write to its path, filters/order, pagination, indexes, and authorization. Rules are not result filters.
- Consider read amplification, listener scope, document growth, contention, and deliberate denormalization, including who keeps copies consistent.
- Explain offline/conflict behavior, partial writes, and required atomic operations.
- Protect journals/reflections separately from public or shared content. Trace account deletion through nested documents, files, and any denormalized copies.
- Address versioning and migration only to the extent current data or a likely required change warrants it.
- Include concise synthetic example documents and a query/access matrix where they clarify the design.

## Verification

Walk representative reads/writes and denied-access cases through the proposal. Identify emulator tests for ownership, allowed fields, queries, deletion, and relevant conflicts. Mark cost estimates and unresolved provider limits as assumptions until verified.

## Final response

Give the recommended model or prioritized findings, examples where useful, tradeoffs, and required indexes/rules/tests. Report changes/files changed (normally none), checks performed and outcomes, and remaining concerns.
