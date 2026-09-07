# Application security and privacy review

## Role

Act as an engineer reviewing end-to-end application security and sensitive-data handling.

## Task

Feature, data flow, diff, or application scope: `<TASK>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant architecture, project, and testing guides. Trace data from UI input through local storage, transport, services, backend authorization, diagnostics, and deletion. Inspect actual configuration/dependencies and current official security advisories where relevant.

## Success criteria

Identify confirmed vulnerabilities separately from plausible risks, with concrete evidence, practical fixes, and appropriate verification.

## Constraints

Review only; do not edit source, tests, configuration, documentation, cloud resources, or dependencies unless explicitly asked. Use synthetic accounts/data and redact findings. Do not expose secrets or real journals/reflections in reports, logs, fixtures, or external tools.

Apply conservative privacy treatment to spiritual reflections. Do not claim encryption or privacy guarantees that the implementation does not establish.

## Review expectations

- Trace authentication, authorization, session lifetime, account switching, Firebase rules, and privileged handlers. Client checks and App Check do not establish user permissions.
- Distinguish public client configuration from true secrets such as provider/Admin credentials; inspect API-key exposure, environment handling, and transport protection.
- Examine secure local storage, offline caches, backups, device/session access, and stale personal data after sign-out or deletion.
- Review journals, reflections, and any implemented prayer-request/community flows for ownership, membership, visibility, and unintended sharing.
- Inspect logs, analytics, crash/error reporting, and third-party payloads for unnecessary collection or sensitive content.
- Follow data deletion through Auth, nested records, files, caches, and copies. Assess dependency risk using installed versions and relevant authoritative evidence.
- Rank findings as Critical, High, Medium, or Low, labeling confirmed vulnerabilities versus possible risks. Give location/path, evidence, impact, correction, and a meaningful test or validation step.

## Verification

Use existing non-fixing checks and bounded emulator/local tests where available. Distinguish source configuration from deployed settings and missing future features from current vulnerabilities. Report unverified storage, platform, provider, or production boundaries explicitly.

## Final response

Give prioritized findings, confidence/evidence, and recommended fixes/tests. Report changes/files changed (normally none), checks actually run and outcomes, and remaining concerns.
