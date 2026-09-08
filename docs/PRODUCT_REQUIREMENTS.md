# 77Faithful product requirements

Settled by the product owner on 2026-09-07. This document records product requirements, not implemented capabilities. [Project context](engineering/project-context.md) and source/configuration establish what exists. The current app has navigation scaffolding; formation behavior and integrations remain planned.

## Authority and scope

This document owns product identity, audience, commercial principles, feature-level release scope, practice semantics, product trust/privacy, theological guardrails, and future repeat-journey requirements.

- [Navigation and UX contract](APP_NAVIGATION_AND_UX.md) owns screens/routes, entry and CTA destinations, redirects, back behavior, daily/journey flows, day access, and navigation states. It applies this product scope without redefining it.
- [Formation content specification](FORMATION_CONTENT_SPEC.md) owns curriculum structure, authored fields, approval/publication, content versions/storage, fixtures, and future variant/group consistency.
- [Architecture decisions](engineering/architecture-decisions.md) owns implementation architecture, backend/curated Scripture, offline/security boundaries, runtime choices, and technical data ownership; this document does not prescribe schemas.
- [Design system](engineering/design-system.md) owns visual primitives; [testing](engineering/testing.md) owns verification; [AGENTS.md](../AGENTS.md) owns agent workflow and engineering guidance.

All known V1 product decisions below are settled. Missing implementation, human-approved production content, and external setup facts are delivery prerequisites, not unresolved V1 product policy. Future items remain excluded until explicitly scoped by the product owner.

## Identity, mission, and commercial principles

**77Faithful** is a Christian spiritual-formation application centered on Scripture, prayer, intentional action, and reflection over a 77-day journey. Scripture stays central. Encourage faithfulness rather than perfection: spiritual practices never imply earning God's favor, measure holiness, or rank participants spiritually. Missing or partially recording a day never invalidates earlier participation.

Avoid guilt, coercion, manipulative engagement, competitive spiritual framing, and unnecessary time or physical-performance demands. Support people with different abilities, schedules, work, caregiving, and household responsibilities.

The product is intended to remain completely free to participants: no advertisements, subscriptions, premium spiritual content, or paid feature tiers. Never sell user data. Voluntary donations/support may be considered in the future only if they never unlock product features or spiritual content. There is no donation UX in V1.

Ship iOS and Android first and architect/test both together even if store release timing later differs. Web remains a development/preview/static-export target in V1, not the primary production product.

## Audience

- Intended age is **13+**; the product is not knowingly directed at children under 13. Do not collect date of birth merely to enforce this positioning.
- Initial product/infrastructure posture is US-first, although the app may be usable internationally. Do not claim legal or regulatory support for jurisdictions where it has not been established.
- V1 UI language is English only. Do not introduce a localization framework prematurely; ordinary code should avoid making later localization unnecessarily difficult.

## Theological and content guardrails

77Faithful is Bible-centered, Christ-centered, and broadly orthodox, non-denominational Christianity consistent with historic Nicene Christianity.

Avoid unnecessary positions on denominational disputes, including baptism mode, charismatic gifts, predestination systems, church polity, and end-times systems. When a passage intersects a disputed issue, focus on what the passage clearly teaches rather than using the app to settle the controversy. This is the intended posture, not authorization to invent a longer doctrinal statement.

Human product ownership has final authority over production theological/formation content. AI may assist with drafting and review. AI-generated Scripture references, prayer prompts, reflection questions, application copy, or theological explanation are not production-approved merely because AI generated them. Production content requires human review and approval under the [content workflow](FORMATION_CONTENT_SPEC.md#production-approval-and-publication).

## Feature roadmap

| Release                | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planned — V1**       | Account-required personal journey; verified email/password auth, password reset and account deletion; resumable onboarding; five daily practices from the fixed catalog; English translation selection; private optional intention and reflection writing; calendar progression, editable history and subdued progress; one optional local-device daily reminder; native offline personal records; Privacy Policy, Terms and configured Help/Feedback. Crash reporting is permitted for content-free crash diagnostics, not a required behavioral analytics feature. |
| **V1.x / post-launch** | Maintenance, accessibility/usability refinements, and fixes informed by support and crash evidence. No additional feature commitment or permission to move required V1 behavior out of launch scope is implied.                                                                                                                                                                                                                                                                                                                                                      |
| **V2 / Future**        | Repeat journeys and approved daily content variants; private Community/group journeys; optional biometric/PIN app lock; possible voluntary support that unlocks nothing. These are excluded from initial V1; sequencing beyond V1 is not committed.                                                                                                                                                                                                                                                                                                                  |

### Account and onboarding scope

V1 requires email/password authentication. Email verification is mandatory immediately after sign-up and before onboarding; verified status is required before cloud personal-data writes. Existing signed-in unverified sessions must pass the same verification gate. Password reset and account deletion are included.

There is no guest/local-only mode, anonymous auth, social auth, public profile, or username/display-name requirement. Do not require first name, last name, birthday, gender, denomination, church, location, avatar, or other profile fields. No dedicated change-email feature is required in V1 unless later platform/account requirements establish a concrete need.

Onboarding resumes at the first incomplete step after relaunch. The [navigation contract](APP_NAVIGATION_AND_UX.md#10-detailed-screen-specifications) defines overview → exactly two practices → translation → confirmation → Start Day 1. Notification permission and morning intention are not onboarding requirements. Start Day 1 starts today, with no future scheduling. The journey captures the current IANA timezone at creation and keeps it fixed for that journey; V1 has no manual journey-timezone change.

## Daily practices

Every day has exactly five practice completion states: **Scripture, Prayer, Optional practice A, Optional practice B, Reflection**. A complete day requires all five explicit states complete. Intention is not a sixth requirement. Completion is binary and reversible, including on historical days; passive activity never auto-completes any practice. Participants may complete practices in any order. Exact entry/completion actions and Continue behavior belong to the [daily flow contract](APP_NAVIGATION_AND_UX.md#11-core-daily-user-flow).

- **Scripture:** engage the assigned passage; reading in the participant's own Bible is valid and may be manually recorded. Reader activity and unavailable text never imply completion.
- **Prayer:** the day's prayer prompt, participant prayer, and explicit manual completion. No timer, tracked duration, or required written prayer.
- **Reflection:** intentionally reflect; writing is optional. The participant explicitly saves/marks a written reflection complete or chooses `I reflected without writing`. Typing/autosave alone never completes the practice.
- **Morning intention:** optional, private, outside completion. Current/historical intention can be edited. Intention and reflection drafts autosave when persistence exists; missing persistence must not be represented as a successful save.

### V1 optional-practice catalog

These are the **only ten** selectable practices. Each uses a stable concise definition; the day's Scripture/theme supplies changing context. Do not author 77 unique prompts for every optional practice.

| Practice                       | Meaning and limits                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Movement                       | Intentionally move the body in a manner appropriate to the participant's ability and circumstances. No required duration, distance, calories, performance target, or health/fitness integration. |
| Serve or Encourage             | Intentionally serve, help, encourage, or care for another person.                                                                                                                                |
| Scripture Memorization         | Spend intentional time learning or reviewing Scripture. Completion represents faithful practice, not perfect memorization.                                                                       |
| Gratitude                      | Intentionally recognize or express gratitude to God. A written gratitude entry is not required.                                                                                                  |
| Christian Reading              | Spend intentional time reading Christian formation, theology, devotional, or similar material beyond the assigned Bible passage.                                                                 |
| Worship                        | Spend intentional time worshiping God through an appropriate expression such as singing, listening, prayerful worship, or another personal practice. No media integration is required.           |
| Generosity                     | Intentionally practice generosity with time, attention, possessions, or money. Never require financial giving or track giving totals.                                                            |
| Family Devotion                | Spend intentional spiritual time with family/household through Scripture, prayer, discussion, worship, or a comparable practice.                                                                 |
| Personal Fasting or Discipline | Intentionally abstain from or limit something for spiritual focus. The app must not prescribe unsafe food restriction, duration, medical behavior, or health-risk behavior.                      |
| Intentional Witness            | Intentionally share, discuss, or demonstrate faith in Christ with another person. No quotas, pressure mechanics, ranking, or forced reporting.                                                   |

Exactly two distinct optional practices are active at a time. There are no custom practices or per-practice private note fields in V1. Do not introduce timers, quantities, money totals, distance, points, or scores. Users may change their selections during an active journey; changes take effect on the next journey/calendar day, never retroactively. Historical records permanently preserve that day's applicable practices. The [Settings flow](APP_NAVIGATION_AND_UX.md#1018-practice-settings) owns selection/save UX and effect timing.

## Journey, history, and progress

The calendar period is exactly 77 days; completing a day does not advance the date, and missing a day never resets or extends the journey. History stays editable indefinitely, including after Day 77, and corrections recompute derived progress/statistics. Future daily content cannot be opened; only limited day/theme/date metadata may appear in Journey. The [navigation contract](APP_NAVIGATION_AND_UX.md#13-journey-progression--day-1-through-day-77) owns all current/history/future and ended-state access, including editable historical Day 77.

V1 progress includes current day / 77, count of fully recorded days, count of days with partial participation, and a complete-day streak shown only as subdued accountability information on Journey. The streak is informational, not the primary success measure. No faithfulness/holiness score, grade, XP, levels, badges, public ranking, leaderboard, loss-aversion messaging, or streak pressure on Today. Incomplete-day language is neutral, such as `N of 5 recorded`; never use `failed` as a status. Today may show at most one understated yesterday-incomplete notice, never accumulated missed-day warnings.

After the Day 77 calendar date passes, Today becomes an ended-journey summary/review state. There is no Day 78. If practices remain incomplete, say the participant reached the end of the 77-day period, not that all practices were completed.

One active journey maximum. No manual restart/reset of an active journey, individual journey deletion, auto-start of another journey, or Start another journey action in initial V1. Preserve earlier journeys in the data/architecture so later multiple historical journeys are possible without overwriting them.

### Future repeat journeys

Future repeat journeys should offer a somewhat different experience through multiple human-approved daily content variants. They must preserve the exact selected curriculum for each journey, including history, and avoid repeating an identical full plan where practical when sufficient variants exist. The [content specification](FORMATION_CONTENT_SPEC.md#future-repeat-journey-variants--not-v1) owns passage/prompt alignment, persisted variant plans, and group consistency. This capability is not implemented or exposed in initial V1.

## Bible translations

The product owner selected a curated Scripture architecture on 2026-09-07. Each journey day has a predetermined, human-approved passage assignment, independent of translation. V1 is English and uses the controlled [translation registry](../src/content/scripture/translations.ts). Participants can select only explicitly enabled translations with legally cleared, complete text for the pinned reading plan.

The configured fallback is BSB, usable only after verified source text and the approved reading plan are supplied. If the saved preference is missing, unknown, or unavailable, use the configured fallback when available and identify the translation actually displayed. Do not select an arbitrary replacement if the fallback is unavailable. Onboarding still requires confirmation of an available translation.

Changing translation affects current and historical reader rendering without changing completion, assigned passage identity, or the journey's pinned content version. Unavailable text leaves a known passage reference visible and allows reading in the participant's own Bible; missing text never completes Scripture. Internal licensing details do not belong in normal selection/reader copy.

Keep app-authored formation content separate from translation-specific text. Bundle only the curated text whose verified permissions permit redistribution. Remote storage is allowed only for a concrete licensing/product reason; Scripture must not depend on a third-party Bible API. Do not automatically copy text into journals, diagnostics, or analytics. [Architecture decisions](engineering/architecture-decisions.md#curated-scripture) owns storage, stable preference IDs, attribution, and the data-access boundary.

## Reminders and offline use

V1 includes one configurable daily **local-device** reminder, enabled only by explicit participant choice and an explicitly selected time. Do not silently enable an 8:00 AM or other default reminder. Notification permission is not part of onboarding. Scheduling follows the device's current local time for convenience; journey-day boundaries remain in the fixed journey timezone.

Copy stays generic, for example `Your 77Faithful day is ready`. No reflection/intention/prayer text, missed-practice escalation, streak-loss warnings, or guilt/pressure messaging. No backend push-notification infrastructure in V1 unless a later explicit requirement changes scope. [Notification Settings](APP_NAVIGATION_AND_UX.md#1020-notification-settings--planned--v1) owns permission, configuration, and recovery UX.

After relevant journey data has loaded, native completion toggles, intentions, and reflection drafts must work offline through the selected native persistence architecture. Local application-authored formation content works offline. Enabled bundled Scripture works offline without a network request. Any later remote-only translation follows its verified storage terms; its known passage reference remains available when text cannot load. Login, sign-up, verification, password reset, account deletion, and initial journey creation require connectivity.

Saved / pending sync / failed should be distinguishable when material without dominating the UI. Direct multi-account switching is excluded from V1; fully sign out before another sign-in. Pending private writes must never be silently discarded, and a subsequent account must never see the prior account's cached private data. The [sign-out contract](APP_NAVIGATION_AND_UX.md#1022-account) owns the online sync attempt and explicit cancel-versus-confirmed-discard flow; [architecture decisions](engineering/architecture-decisions.md#offline-persistence-and-account-boundaries) owns implementation and testing dependencies. These are requirements, not a claim of working offline support.

## Privacy, telemetry, and data lifecycle

Reflections, intentions, prayer/journal-like text, and drafts are private by default, including caches and diagnostics. Sharing requires explicit action for the specific supported item and is outside V1. Never place private content in analytics events, crash reports, general application logs, navigation URLs, notification payloads, or generic support diagnostics.

V1 has no behavioral product analytics, advertising integration, or marketing/ad identifiers. Crash reporting may be used for diagnostics only when private content is neither attached nor logged. Optional biometric/PIN app lock is Future. In-app personal-data export is not required for V1.

Account deletion must remove the authentication identity and all related personal application data through the appropriate authenticated backend operation. Do not promise exact backup-erasure timing without verified provider/infrastructure policy. Technical deletion and cache boundaries belong to [architecture decisions](engineering/architecture-decisions.md#aws-amplify-gen-2).

### Data not collected in V1

Do not collect as product data: date of birth, gender, denomination, church, street address, precise GPS location, contacts, health/fitness data, financial giving totals, prayer duration, movement metrics, or behavioral-advertising identifiers. Email is collected for email/password authentication; no additional profile fields are required.

### Legal and support launch prerequisites

V1 must expose Privacy Policy, Terms of Service, and a Help/Feedback contact path. Help/Feedback uses the configured support contact destination; do not build a support-ticket system. There is no marketing/newsletter/devotional-email program in V1; authentication/service emails only.

The support email, website/domain, Privacy Policy URL, Terms URL, and legal entity/business name are external launch facts. Their current supplied/TBD status is maintained with the other [external setup prerequisites](engineering/project-context.md#external-setup-and-release-prerequisites). Do not fabricate destinations or legal identities.

## Community — intentional Future scope

Community is absent from V1, including disabled tabs, teasers, badges, placeholder cards, routes, and other navigation entry points.

Future communities are private, intended for friends, families, Bible studies, small groups, and churches. They emphasize encouragement, prayer, accountability, discussion, and shared growth; no public social feed, popularity mechanics, or competitive leaderboards. High-level group progress, prayer requests, and weekly-theme discussion may eventually exist.

Personal journals, reflections, and intentions remain private unless the participant explicitly shares a specific supported item. Community membership never grants access to private journal content. Group curriculum must follow the [shared variant-plan requirement](FORMATION_CONTENT_SPEC.md#future-group-curriculum-consistency).

Intentionally unresolved until Community work begins: exact member/admin roles, group size limits, multiple-community rules, synchronized start-date mechanics, join-in-progress behavior, moderation/reporting, display-name/profile requirements, invite expiry, and exact group-progress formulas. These are Future decisions, not V1 gaps. Existing Future navigation sketches do not settle these mechanics.

## Branding and platform requirements

The current blue **77 / path / cross** identity direction is approved. Platform-specific icon/splash derivatives are allowed. Use system typography and automatic system light/dark mode; no manual theme setting is required in V1. [Design-system guidance](engineering/design-system.md) owns tokens and production asset work.

Production bundle/package identifiers, domain/organization identity, developer/store accounts, backend environment identifiers, EAS ownership, and translation distribution permissions are external configuration facts, not values a coding agent may invent. Track them in [project context](engineering/project-context.md#external-setup-and-release-prerequisites).

## Explicit V1 exclusions

Alongside the limits above, initial V1 excludes Community/sharing, repeat journeys and content variants, active-journey restart/reset, individual journey deletion, future journey scheduling, manual journey-timezone changes, guest/anonymous/social auth, public profiles, custom practices, per-practice notes, timers/performance/financial tracking, behavioral analytics, donation UX, paid tiers/ads, a CMS, backend push infrastructure, a support-ticket system, marketing email programs, a localization framework, and a primary production web product. App lock is Future; in-app personal-data export and a dedicated change-email feature are not required V1 features.
