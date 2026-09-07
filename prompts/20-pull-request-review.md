# Pull request review

Review only under `AGENTS.md`. Establish the intended base/head or worktree comparison, inspect the actual diff, and follow changed contracts into callers and tests. State which revision and local changes the review covers.

Branch/diff and intended base: `<TASK>`

Original requirements and acceptance criteria: `<REQUIREMENTS>`

## Review the change

- Check that the diff solves the stated behavior without unrelated refactors or deleted functionality. Distinguish new issues from pre-existing ones.
- Evaluate correctness, error paths, async lifetimes, platform behavior, UX/accessibility, and security/privacy where affected.
- Apply the navigation-review checklist in `AGENTS.md` against `docs/APP_NAVIGATION_AND_UX.md`: route/screen additions, removals or alterations, responsibilities, CTA destinations, back behavior, auth/onboarding redirects, day/progression/completion semantics, settings, deep links, duplicated logic or bypassed helpers, and Future features exposed in V1. Verify each material change includes the corresponding contract update; report omissions without editing during review.
- Apply the reuse and human-maintainability guidance in `AGENTS.md`; justify concerns with concrete behavior or maintenance cost, not stylistic preference.
- Inspect test assertions/mocks and important missing cases. Include affected dependencies, configuration, rules/indexes, and documentation claims in the review.

## Verify and conclude

Run relevant existing non-fixing checks when available. Confirm that cited CI results apply to the reviewed revision; a workflow file is not a passing run. Report findings and unavailable essential evidence.

Give one verdict: **Ready to merge** when no blocking defect or essential evidence gap remains; **Changes required** for concrete blockers; or **Needs verification** when missing evidence prevents a judgment. Nonblocking suggestions can accompany a ready verdict. Stop at the review; the verdict does not merge or modify the change.
