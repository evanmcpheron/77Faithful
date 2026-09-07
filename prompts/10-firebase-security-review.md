# Firebase security review

Review only under `AGENTS.md`. Inspect relevant architecture decisions, actual Auth assumptions, client calls, Firestore/Storage rules, privileged handlers, indexes, emulator tests, and configuration. Use current official documentation for enforcement details in question.

Firebase feature, rules, or access boundary: `<TASK>`

## Trace access

- Walk unauthenticated, unverified, ordinary-user, and privileged operations through each scoped entry point. Apply the authorization/field-protection rules in `AGENTS.md`; check both legitimate operations and attempted bypasses.
- Inspect create/update/delete and get/list access, overlapping broad rule matches, ownership changes, injected fields, and client-controlled authorization data. Check handler authorization separately from Firestore enforcement.
- If community access exists or is part of the reviewed change, test non-members, members, permitted roles, revoked members, and cross-community requests. Membership alone must not expose private journals.
- For scoped Storage access, inspect paths, metadata, upload limits, and download/share mechanisms that may expose private files.
- Separate missing future infrastructure from defects in an implemented or shipping data path. Repository configuration does not establish what is deployed.

## Verify and report

Run existing relevant emulator/security tests with synthetic data and inspect their allow/deny assertions. Do not test cross-user access against real personal records. Report concrete attack paths or access failures with location, impact, correction, and a regression case; label hypotheses and missing evidence. Stop after the specified boundaries. An absent emulator or deployment evidence is a verification limit, not proof of secure access.
