# Bug investigation and fix

Diagnose and fix the specified defect, unless the user requests investigation only. Read `AGENTS.md` and inspect the failing path, callers, tests, relevant configuration, and local changes. Follow affected platform variants and data boundaries only as far as needed.

Bug, reproduction, expected/actual behavior, and affected platform: `<BUG>`

For a screen, redirect, back, day-state, or completion bug, establish expected behavior from `docs/APP_NAVIGATION_AND_UX.md` before repairing code. Distinguish an observed defect from a planned feature or unresolved decision. A repair that restores the contract needs no invented flow; an intentionally changed material behavior requires a same-change contract update under `AGENTS.md`.

## Diagnose and repair

1. Reproduce the bug or establish the failing path from reliable tests, logs, or source evidence. Separate supported causes from hypotheses.
2. Trace the relevant control/data flow and choose the smallest correction that restores intended behavior. Do not suppress errors, disable checks, or weaken authorization to remove a symptom.
3. Implement the correction and add a regression test when practical. Expand beyond the immediate file only when the cause requires it; explain that connection.
4. Check directly related cases and remove temporary diagnostics.

If the cause cannot be established, stop speculative edits and report the evidence, ranked hypotheses, and next useful diagnostic.

## Verify and finish

Repeat the original reproduction and targeted tests, confirming failure before/fix after when practical without disturbing unrelated work. Complete the checks required by `AGENTS.md`. Distinguish a verified repair from unverified native/provider behavior. Stop after the defect and its direct consequences are addressed; report unrelated findings separately.
