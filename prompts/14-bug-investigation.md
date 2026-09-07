# Bug investigation and fix

## Role

Act as an engineer diagnosing and fixing a specific defect.

## Task

Bug, reproduction steps, expected/actual behavior, and affected platform if known: `<BUG>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions, relevant engineering guidance, and the affected implementation/callers/tests. Check local changes and configuration that could explain the symptom. Inspect platform variants and data boundaries only where the failing path reaches them.

## Success criteria

Establish the cause with evidence, apply the smallest correct fix, and verify that the reported path works without a related regression.

## Constraints

Do not claim a root cause without evidence or patch a plausible symptom speculatively. If the failing path cannot be established, report the evidence, ranked hypotheses, and smallest next diagnostic.

Do not broadly refactor a narrow bug. Expand scope only if the architecture causes the defect and cannot safely be repaired locally; explain the causal connection. Do not suppress errors, disable checks, or weaken security to remove a symptom.

## Investigation and implementation expectations

1. Reproduce the bug or establish the failing path from reliable logs, tests, or source evidence.
2. Trace relevant control/data flow and separate the root cause from secondary symptoms.
3. Choose and implement the smallest fix that restores intended behavior.
4. Add a regression test when practical, derived from the failing behavior.
5. Check closely related cases and remove temporary diagnostics.

Use synthetic data and redact diagnostics; private journals, reflections, tokens, and credentials do not belong in logs or test fixtures.

## Verification

Re-run the original reproduction and targeted regression tests; confirm failure before/fix after when practical without disturbing unrelated work. Run `npm run check` and any additional checks required by `AGENTS.md` for affected routing, shared UI, backend, or configuration. Distinguish unavailable native/provider reproduction from a verified fix.

## Final response

State the supported cause and correction, files changed, tests/checks and outcomes, and remaining concerns. If evidence is insufficient, state that no speculative fix was made and name the unresolved diagnostic.
