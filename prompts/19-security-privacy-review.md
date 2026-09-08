# Application security and privacy review

Review only under `AGENTS.md`. Read `docs/PRODUCT_REQUIREMENTS.md` for data collection, telemetry, account lifecycle, and trust policy, plus relevant architecture decisions and trace the specified data flow through UI, local storage, transport, services, authorization, diagnostics, and deletion. Use current official documentation/advisories for uncertain security or provider behavior.

Feature, data flow, diff, or bounded application scope: `<TASK>`

## Trace risks

- Check authentication, session lifetime, account switching, and access boundaries against `AGENTS.md`. Distinguish repository configuration from deployed-state evidence; use the Firebase security prompt's specific access cases when relevant.
- Read `docs/APP_NAVIGATION_AND_UX.md` for affected gates, deep links, sign-out, and future invitations. Check that redirects cannot bypass onboarding or membership, that Back cannot reveal protected content after sign-out/revocation, and that route/query parameters never carry private text.
- Distinguish public client configuration from provider/Admin secrets. Inspect environment handling, transport, local caches/backups, and residual personal data after sign-out or deletion.
- Examine collection, logging, analytics, crash reporting, third-party payloads, and sharing defaults for unintended disclosure. Follow deletion through affected nested records, files, caches, and copies.
- Reflections, journals, intentions, and personal prayer content remain private by default. For implemented future community flows, inspect membership, visibility, and revocation; sharing requires an explicit item-specific action, never membership consent. Do not claim encryption or privacy properties absent from the implementation.
- For Scripture integration, read `docs/FORMATION_CONTENT_SPEC.md` for authored-content/fixture boundaries and check the curated content boundary, source provenance and verified translation permissions, centralized attribution, storage strategy, and pinned content versions. Inspect installed dependencies against relevant authoritative advisories rather than treating every version lag as a vulnerability.

## Verify and report

Use existing non-fixing local/emulator checks and synthetic accounts/data; redact findings and do not inspect real personal records. Return concrete exploit or disclosure paths, impact, corrections, and meaningful validation. Separate confirmed problems from hypotheses, unavailable evidence, and absent future features. Stop at the stated data flow; report verification limits instead of inferring production security.
