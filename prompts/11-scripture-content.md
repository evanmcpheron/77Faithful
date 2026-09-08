# Curated Scripture content

Implement the specified Scripture content work. Read `AGENTS.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/FORMATION_CONTENT_SPEC.md`, the Scripture Reader, translation, day-access, and unavailable-content specifications in `docs/APP_NAVIGATION_AND_UX.md`, the curated Scripture decisions in `docs/engineering/architecture-decisions.md`, and testing guidance. Inspect the existing content files, service boundary, UI, and tests first. Apply the frontend preflight in `AGENTS.md` when UI/flow behavior is affected.

Content/integration task: `<TASK>`

Approved passages, verified source/permissions, and acceptance criteria: `<REQUIREMENTS>`

## Establish content authority

Verify human approval for the pinned curriculum and permission for the exact translation/source edition and intended storage/distribution. Obtain exact required attribution from the rights holder or supplied authorization; record unresolved notices as internal TODOs. An available dataset, familiar translation name, or remote storage location does not establish redistribution permission. Do not scrape Bible sites/APIs or import uncleared text. If evidence is missing, keep that translation unavailable and complete independent architecture work.

## Implement

- Keep day/theme/passage assignments independent of translation. Extend canonical ranges only as the approved plan requires; preserve published versions and historical identity.
- Use the centralized translation registry and focused Scripture service. Persist stable internal IDs when preference persistence is in scope. Resolve missing/unavailable preferences to the configured available fallback and label the text actually displayed.
- Store only required, verified passage/translation text. Bundle when permitted; introduce remote storage only for a concrete licensing/product requirement behind the same boundary.
- Include verified attribution and source provenance centrally. Never silently generate production formation content, substitute another translation's text, or use synthetic fixtures as production fallback.
- Preserve Scripture prominence, known references, explicit completion, unrelated practices, current/historical entry/back behavior, and future-day locks. Local content needs no network spinner; retry belongs only to a recoverable operation.

## Verify and finish

Run structural validation and the reproducible verse audit, covering duplicate/missing days, passage/translation references, complete enabled translation coverage, exact verse ranges, and overlapping text consistency. Use obvious non-Scripture fixtures for selection/fallback/lookup tests. Run `npm run scripture:audit -- --release` when publication readiness is in scope, plus applicable `AGENTS.md` checks. Report source/permission/approval gaps separately from completed architecture, and stop at the requested scope.
