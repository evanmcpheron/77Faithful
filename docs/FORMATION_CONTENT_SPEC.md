# 77Faithful formation content specification

Settled by the product owner on 2026-09-07. This is the curriculum structure and workflow specification, not a published 77-day curriculum. No full production curriculum or content integration exists in the current checkout; [project context](engineering/project-context.md) owns that inventory.

## Authority

This document owns the 77-day curriculum, theme sequence, authored fields, production approval, versioning/publication, V1 content storage, development fixtures, future daily variants, and group curriculum consistency. [Product requirements](PRODUCT_REQUIREMENTS.md) owns practice semantics and theological/product guardrails. [Navigation and UX](APP_NAVIGATION_AND_UX.md) owns placement, screen flows, and day access; [architecture decisions](engineering/architecture-decisions.md) owns technical data and Scripture storage boundaries. Do not create a second content specification in code comments or task prompts.

## V1 curriculum structure

The sequence below is settled. Each theme is exactly seven days, for 11 themes and 77 days total.

| Week |  Days | Theme               |
| ---: | ----: | ------------------- |
|    1 |   1–7 | Abiding in Christ   |
|    2 |  8–14 | Scripture           |
|    3 | 15–21 | Prayer              |
|    4 | 22–28 | Renewal             |
|    5 | 29–35 | Identity in Christ  |
|    6 | 36–42 | Love                |
|    7 | 43–49 | Service             |
|    8 | 50–56 | Stewardship         |
|    9 | 57–63 | Christian Community |
|   10 | 64–70 | Mission             |
|   11 | 71–77 | Perseverance        |

Changing the sequence for actual production content requires an explicit product/content-version change, never an incidental code edit. Navigation renders the pinned content's mapping rather than maintaining another theme table. The Christian Community curriculum theme does not enable Community product features in V1.

## Authored data for each V1 day

Each approved production day includes at minimum:

| Field                            | Requirement                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Day number                       | One unique integer from 1 through 77 within the published content version.                                                                                                                 |
| Week/theme identifier            | Stable reference to the appropriate theme in the sequence above.                                                                                                                           |
| Scripture passage reference      | A canonical passage identity and display reference, independent of translation. Verify the assigned range during review; translated text lives separately under the architecture boundary. |
| Focused prayer prompt            | Primarily a prompt guiding participant prayer, not a fully written prayer.                                                                                                                 |
| Reflection question              | Aligned with the day's Scripture and theme; writing remains optional under product practice semantics.                                                                                     |
| Short theme/application sentence | Optional; aligned with the passage when present.                                                                                                                                           |

Normal assigned reading should target roughly **5–15 minutes** where the passage naturally supports that range. This is an authoring target, not a participant timer/completion requirement. Do not enforce an arbitrary verse-count rule.

The first day of each weekly theme includes a concise explanation of that week's theme, inline in the normal daily experience rather than on a separate required screen. The explanation can be stored with the theme and referenced by its first day; no duplicate weekly prose is required in each day record.

Morning intention uses one stable prompt in V1, such as:

> How will you respond to what God is teaching you today?

Exact copy can be refined later without changing the mechanic. Do not author 77 separately required intention questions. Optional practices likewise use the [ten stable catalog definitions](PRODUCT_REQUIREMENTS.md#v1-optional-practice-catalog), with the day's Scripture/theme providing context; do not create 77 unique prompts for every optional practice.

## Production approval and publication

Production formation content follows this workflow:

1. AI-assisted or human drafting.
2. Scripture-reference and theological consistency review against the [product guardrails](PRODUCT_REQUIREMENTS.md#theological-and-content-guardrails), including passage/prompt alignment.
3. Human product-owner approval of the production content.
4. Versioned publication in source control, with approval attributable to the reviewed version/change.

Human product ownership has final authority. AI drafting or AI review alone is never production approval. A coding task must not silently generate production Scripture references, prayers/prompts, reflection questions, application copy, or theological explanation because content or a fixture is missing. Content changes after approval require review/approval and a new publication version when they change published content. Do not generate the full 77-day curriculum as part of documenting this specification.

## V1 storage and versioning

Application-authored formation content is **version-controlled structured local content in the repository**. It contains themes, passage references, prayer prompts, reflection questions, practice definitions, and other app-authored formation copy. Translation-specific Scripture is stored separately from these authored fields, keyed by canonical passage and stable internal translation ID. The curated text may be bundled when verified rights permit; see the [Scripture architecture](engineering/architecture-decisions.md#curated-scripture). No CMS in V1.

Each published content version identifies a complete, approved 77-day curriculum. Every journey stores/pins the version it started with. Published older versions remain available to render historical journeys correctly. Do not silently switch an active or historical journey to a newer version or replace a missing older version with the latest curriculum. Changes in the participant's reader translation do not change the authored passage reference or the pinned version.

Structured content must be validated for unique Day 1–77 coverage, correct seven-day theme membership/order, required fields, and valid theme references when publication tooling/content is introduced. Human review still establishes theological approval; a passing schema check does not. The [testing guide](engineering/testing.md) owns verification methods, and [architecture decisions](engineering/architecture-decisions.md) owns how journey records reference immutable content versions.

## Current curated Scripture content and audit

The settled themes are represented in [`reading-plans.ts`](../src/content/scripture/reading-plans.ts). Its `v1-draft` has **zero passage assignments**. [`passages.ts`](../src/content/scripture/passages.ts) and [`texts.ts`](../src/content/scripture/texts.ts) are empty until reviewed content is supplied. These empty arrays are an explicit unpublished state, never a 77-day production plan or fallback text. Prayer/reflection production content remains unimplemented.

Before publishing a plan, supply all 77 day/theme/passage assignments and canonical ranges, review passage/prompt alignment, and record human approval against the immutable version/change. Add only referenced books' verified chapter counts, with their source, for range and complete-book validation. Review display references and translation numbering/omissions against the source; structural tests do not establish those facts.

Before enabling a translation, supply the exact authorized text for every unique required passage in every retained published plan. Record source edition/revision, verified distribution terms, and the exact required attribution centrally in the registry. Include only the required text; do not commit a full Bible or automatically generate missing verses. The source import review must verify authenticity as well as redistribution rights.

`npm run scripture:audit` validates the dataset and reports reading days, unique passages, unique verse coverage (deduplicating repeated/overlapping ranges), and any complete books. `npm run scripture:audit -- --release` additionally requires a published plan and enabled fallback. The current final verse count and complete-book inclusion **cannot yet be calculated** because the 77 assignments are not finalized; the audit returns null for those fields. It must be rerun when the plan changes, with translation-specific differences reviewed for publisher permissions. No publisher verse limits are enforced in the app.

## Development fixtures before production approval

Development/test UI may use clearly identified **synthetic fixture formation data** before the approved curriculum exists. Keep fixture content isolated from production content and recognizable as development/test data. Fixture Scripture-like text must never be represented as an actual Bible translation.

Use fixtures only through deliberate development/test paths. Production code must never silently fall back to fake integration responses, synthetic curriculum, or fabricated credentials when required configuration or approved content is missing. Report the unavailable content/integration honestly. Fixtures do not fulfill production-content approval or native integration acceptance criteria.

## Future repeat-journey variants — not V1

Eventually, repeat journeys should support multiple human-approved daily content variants to provide a somewhat different experience:

- A day may have several approved variants, at minimum allowing different approved Scripture passage assignments.
- Passage-specific prayer, reflection, and application content must remain aligned with the selected passage. Do not mix unrelated prompts from another variant.
- Each new personal journey pins its selected variant plan for its lifetime. Selection is deterministic/persisted once chosen; content must not randomly change per render, device, or session.
- Historical journeys always render the exact variants they originally used.
- When sufficient variants exist, repeat selection should avoid reproducing the exact same full plan where practical.

This capability is not implemented or exposed in initial V1. Preserve the version boundary now; do not build a variant selector, randomization service, or repeat-journey flow speculatively.

## Future group curriculum consistency

A future group journey pins **one shared curriculum/content variant plan**. Every participant receives the same Scripture assignment for the same group journey day. Personal variation must never cause group members to receive different Scripture for that shared plan.

This requirement does not decide group roles, size, synchronized starts, joining in progress, or moderation. Those remain intentionally Future under [product requirements](PRODUCT_REQUIREMENTS.md#community--intentional-future-scope).
