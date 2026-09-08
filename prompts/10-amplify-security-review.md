# Amplify and AWS security review

Review only under `AGENTS.md`. Read `docs/PRODUCT_REQUIREMENTS.md` for account/data/privacy policy. Inspect relevant architecture decisions, Amplify Auth/Cognito configuration, Data/AppSync model and field authorization, client calls, privileged handlers/IAM roles, indexes, integration tests, and configuration. Inspect Amplify Storage/S3 permissions only when storage is in scope. Use current official Amplify Gen 2 and AWS documentation for enforcement details in question.

Amplify feature, authorization, or access boundary: `<TASK>`

## Trace access

- Walk unauthenticated, unconfirmed/unverified, ordinary-user, and privileged operations through each scoped entry point. Apply the authorization/field-protection rules in `AGENTS.md`; check both legitimate operations and attempted bypasses. Verify Cognito Lite is explicit unless a documented requirement needs Essentials; no incidental SMS, passkeys, or advanced auth features.
- Where access affects user flows, compare restoration, auth/onboarding redirects, protected deep links, sign-out, and revocation with `docs/APP_NAVIGATION_AND_UX.md`. Check mandatory verification before onboarding against independently enforced verified cloud writes; client route guards do not establish backend authorization.
- Inspect create/update/delete, get/list, relationships, and subscriptions. Check OR-combined broad allow rules, owner reassignment, injected fields, cross-owner relationship IDs, and client-controlled authorization data. Owner rules do not check email verification; inspect Cognito confirmation and any required server-side enforcement. Check handler authorization separately from Data rules and scope service IAM permissions. Generated operations must not bypass protected custom mutations.
- If future community access exists or is part of the reviewed change, test non-members, members, permitted roles, revoked members, and cross-community requests. Membership alone must not expose private journals, reflections, intentions, or prayer content; sharing requires an explicit action for the item.
- For scoped Amplify Storage/S3 access, inspect identity-scoped paths/permissions, metadata, upload limits, and download/share mechanisms that may expose private files. Data authorization does not automatically protect S3 objects.
- Check generated outputs and mobile builds for the correct environment and absence of static AWS keys, deployment credentials, and backend secrets. Verify backend secret configuration and content-free diagnostics; client configuration is not authorization.
- Separate missing future infrastructure from defects in an implemented or shipping data path. Repository configuration does not establish what is deployed.

## Verify and report

Run existing relevant local/security tests and inspect their allow/deny assertions. When an isolated AWS test backend and scoped authorization to use it exist, verify enforcement with synthetic accounts; do not provision or deploy during review or test cross-user access against real personal records. Report concrete attack paths or access failures with location, impact, correction, and a regression case; label hypotheses and missing evidence. Stop after the specified boundaries. Missing sandbox/deployment evidence is a verification limit, not proof of secure access.
