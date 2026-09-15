# Community MVP v1 — QA Seed Execution Report

## 1. Executive Summary

Execution: **Partial**. Started 2026-09-15T20:08:34.673Z; finished
2026-09-15T20:10:13.584Z. Target: hosted Firebase **faithful-4325a**,
us-central1, explicitly identified by the repository owner as a non-production
test project. Branch: **community**; application source commit:
**9252dbe2ba56bbf23a1f49436772ca9b484ae82b**. This report describes API
observations, not a deployment or release certification.

**10/10 accounts provisioned/authenticated; 6/10 fully verified.** 5/5
communities verified as present. Current run: 1 warning, 12 recoverable, 0
blocking. 0 newly checkpointed callable mutations; 0 checkpoint reuses; 105
callable requests.

**Feed UI limitation:** post APIs return SDK timestamp field names that the
current client parser rejects. Seeded content is present, but feed/post screens
may display an error. See the reproduction notes below.

**Enrollment limitation:** 49 of 77 configured course days have theme IDs
incompatible with this branch. Accounts 2, 3, 6, and 10 have saved setup choices
but no confirmed enrollment or seeded progress consent.

No product behavior, shared components, domain types, dependencies, Security
Rules, or deployed functions were changed. Profiles and enrollment choices use
authenticated Firestore client transactions, as the app does. Community
resources use callable APIs. Admin Auth is used only for these ten accounts’
email verification and account 5’s test reviewer claim, following the existing
integration-test provisioning approach. The existing notification fan-out
service processes only events belonging to the seeded communities; no
notification documents or Community records are inserted directly.

## 2. How to Run the Seeder

Prerequisites: existing root and functions dependencies, Node compatible with
the repository, and Firebase administrative access through Application Default
Credentials or the already installed, signed-in Firebase CLI. No service-account
keys are copied into this repository. Run from the community branch.

```sh
npm --prefix functions run build
export GCLOUD_PROJECT=faithful-4325a
export COMMUNITY_QA_ENVIRONMENT=non-production
# Set COMMUNITY_QA_PASSWORD securely to the shared password supplied by the task owner.
node scripts/seed-community-qa.cjs
# Read-back only; does not seed or reconcile application data:
node scripts/seed-community-qa.cjs --verify-only
node --test tests/community-qa-seed.test.cjs
```

The password is the same for all ten accounts. Obtain it from the original task
owner; it is never included in this file. The app already targets this Firebase
project. Ensure EXPO_PUBLIC_COMMUNITIES_ENABLED=true in the local Expo
environment, restart Expo after changing build-time flags, and use normal
email/password sign-in. Accounts have verified email. Membership does not
require starting a personal journey.

Reruns authenticate existing accounts and reuse deterministic server operation
IDs plus .community-qa/checkpoint.json. Keep this ignored checkpoint: it binds
generated IDs to the project, account UIDs, and fixture definition hash. A
successful checkpoint does not substitute for verification; every run reads
final state again. Existing profile edits, manual membership changes,
completed/deleted content, or expired schedules are reported as drift rather
than forcibly overwritten. After interruption, rerun the same command. After
RateLimited, allow the server’s ten-minute submission window to pass before
rerunning. Do not delete the checkpoint to “reset” existing hosted data. No
wipe/reset command is provided.

The script rejects NODE_ENV=production, a production classification, other
projects, mixed emulator settings, and missing required environment variables.
There is no production override. The pinned project approval must be removed if
this project is ever repurposed as production. A local exclusive lock prevents
concurrent seed runs; if a process was killed, first confirm no seeder is
running before removing only .community-qa/seed.lock.

## 3. Community MVP Feature Inventory

| Feature                                                                        | Implemented | Verified dataset coverage | Accounts / notes                                      |
| ------------------------------------------------------------------------------ | ----------- | ------------------------- | ----------------------------------------------------- |
| Email/password, verified identities, preferred names                           | Yes         | Yes                       | 1–10                                                  |
| Empty community list                                                           | Yes         | Yes                       | 1, 5                                                  |
| Private invitation-only communities; Organizer and Member                      | Yes         | Yes                       | 2–4, 6–10                                             |
| Reusable code, outsider preview, explicit acceptance                           | Yes         | Yes                       | 1, 4 and members                                      |
| Ownership transfer                                                             | Yes         | Yes                       | 6, 10                                                 |
| Left and removed membership; own contributions retained                        | Yes         | Yes                       | 7, 9                                                  |
| Closed community archive                                                       | Yes         | Yes                       | 4, 6, 9, 10                                           |
| Empty / one-post / dense feeds                                                 | Yes         | Yes                       | 6 / 10 / 4, 8                                         |
| Four post types; author edit/delete; moderation tombstone                      | Yes         | Yes                       | 2–4, 8                                                |
| One-level replies; reply edit and delete                                       | Yes         | Yes                       | 2–4, 6–10                                             |
| Feed/reply pagination (actual page size 20)                                    | Yes         | Yes                       | 4, 8, 10                                              |
| Three prayer statuses; reversible acknowledgments                              | Yes         | Yes                       | 2, 3, 6, 8, 10                                        |
| Blocking, filtered feeds, notification controls                                | Yes         | Yes                       | 6 blocks 8                                            |
| In-app inbox; read/unread states                                               | Yes         | Yes                       | 3, 10                                                 |
| Safety reviewer queue; submitted/claimed/resolved cases                        | Yes         | Yes                       | 5; reporters 3, 10                                    |
| Future schedule, frozen enrollment, withdrawal, cancellation                   | Yes         | No / see gaps             | 2, 3, 4, 6, 10                                        |
| Independent progress consent; aggregate suppression                            | Yes         | No / see gaps             | 3, 6, 10                                              |
| Scheduled activation and visible personal progress stages                      | Yes         | No / see gaps             | Time-dependent; not backdated                         |
| Invitation rotation/revocation/expiry and rejoining                            | Yes         | No / see gaps             | Manual actions; current membership fixtures preserved |
| Native push device delivery                                                    | Yes         | No / see gaps             | Requires device installation and Expo configuration   |
| Public discovery, pending membership approval, admin/moderator membership role | No          | No / see gaps             | Not implemented                                       |
| Avatars, biography, attachments, generic likes, nested replies, chat/DM        | No          | No / see gaps             | Not implemented in Community MVP                      |

Implementation sources: docs/community-implementation-plan.md;
docs/community-api-contract.md; functions/src/index.ts;
functions/src/community/; src/features/communities/; src/types/community/;
firestore.rules; firestore.indexes.json. Existing test references include
tests/community-workflow.ticket40.emulator.test.cjs and the Community emulator
suites. The manifest’s referenced product/ directory is absent from this branch;
the adopted community implementation plan and actual implementation were
inspected instead. No relational migrations exist; Firestore document contracts,
native timestamps, revisions, indexes, and validators define persistence.

## 4. Account Overview

| Account                   | Purpose                                                        | Observed active communities | Observed posts / replies | Verified     |
| ------------------------- | -------------------------------------------------------------- | --------------------------- | ------------------------ | ------------ |
| 77faithful_1@yopmail.com  | New verified account; no memberships or contributions          | 0                           | 0 / 0                    | Yes          |
| 77faithful_2@yopmail.com  | Light activity; prayer support and unread activity             | 2                           | 1 / 4                    | No / partial |
| 77faithful_3@yopmail.com  | Active conversation participant; edited writing                | 2                           | 5 / 4                    | No / partial |
| 77faithful_4@yopmail.com  | Organizer of the main circle and closed archive                | 2                           | 2 / 4                    | Yes          |
| 77faithful_5@yopmail.com  | Platform safety reviewer; no community memberships             | 0                           | 0 / 0                    | Yes          |
| 77faithful_6@yopmail.com  | Several communities; empty circle and transferred ownership    | 5                           | 4 / 4                    | No / partial |
| 77faithful_7@yopmail.com  | Left the main circle; retains access to own contributions      | 0                           | 1 / 3                    | Yes          |
| 77faithful_8@yopmail.com  | Dense feed, long writing, and busy thread                      | 2                           | 9 / 0                    | Yes          |
| 77faithful_9@yopmail.com  | Removed from the main circle; member of a closed archive       | 1                           | 2 / 3                    | Yes          |
| 77faithful_10@yopmail.com | Reference member; prayer-circle Organizer and former Organizer | 4                           | 5 / 3                    | No / partial |

## 5. Detailed Accounts

### 77faithful_1@yopmail.com

Purpose: New verified account; no memberships or contributions.

Profile: expected preferred name **(absent)**; observed **(absent)**. Community
profiles have no avatar or biography fields. Authentication: fresh password
login succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |

Expected no memberships or owned communities.

Intended contributions: none; 0 replies. Observed own-contribution API counts: 0
posts and 0 replies. Contributions include retained deletion/moderation
tombstones.

Observed notifications: 0 total, 0 unread, 1 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Open Communities for the empty list; obtain a current code from
account 4 to preview joining without a personal journey.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_2@yopmail.com

Purpose: Light activity; prayer support and unread activity.

Profile: expected preferred name **Anna**; observed **Anna**. Community profiles
have no avatar or biography fields. Authentication: fresh password login
succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Active            | Member / Active            |
| prayer    | Member / Active            | Member / Active            |

Intended contributions: prayer-answered; 4 replies. Observed own-contribution
API counts: 1 posts and 4 replies. Contributions include retained
deletion/moderation tombstones.

Observed notifications: 21 total, 21 unread, 2 page(s). Blocked accounts: none.
Enrollment: Missing.

Manual review: Read the answered request and prayer support; review saved setup
and reproduce unavailable enrollment.

Account-specific warnings/errors this run: recoverable: Scheduled enrollment
(QA/StateDiscrepancy/Unspecified). Global and cross-account checks also apply.

### 77faithful_3@yopmail.com

Purpose: Active conversation participant; edited writing.

Profile: expected preferred name **Caleb**; observed **Caleb**. Community
profiles have no avatar or biography fields. Authentication: fresh password
login succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Active            | Member / Active            |
| handoff   | Member / Active            | Member / Active            |

Intended contributions: prayer-current, shared-copy, conversation-2,
conversation-7, conversation-12; 4 replies. Observed own-contribution API
counts: 5 posts and 4 replies. Contributions include retained
deletion/moderation tombstones.

Observed notifications: 20 total, 19 unread, 2 page(s). Blocked accounts: none.
Enrollment: Missing.

Manual review: Inspect the edited shared reflection, busy thread, and
read/unread inbox; enrollment is currently unavailable.

Account-specific warnings/errors this run: recoverable: Scheduled enrollment
(QA/StateDiscrepancy/Unspecified); recoverable: Independent progress consent
(QA/StateDiscrepancy/Unspecified). Global and cross-account checks also apply.

### 77faithful_4@yopmail.com

Purpose: Organizer of the main circle and closed archive.

Profile: expected preferred name **Miriam Brooks**; observed **Miriam Brooks**.
Community profiles have no avatar or biography fields. Authentication: fresh
password login succeeded; email verification: confirmed by Auth. Reviewer claim:
false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Organizer / Active         | Organizer / Active         |
| archive   | Organizer / Active         | Organizer / Active         |

Intended contributions: welcome, archive-welcome; 4 replies. Observed
own-contribution API counts: 2 posts and 4 replies. Contributions include
retained deletion/moderation tombstones.

Observed notifications: 19 total, 19 unread, 1 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Review invitation controls, member management, safety-access
denial, and the closed archive.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_5@yopmail.com

Purpose: Platform safety reviewer; no community memberships.

Profile: expected preferred name **Jordan**; observed **Jordan**. Community
profiles have no avatar or biography fields. Authentication: fresh password
login succeeded; email verification: confirmed by Auth. Reviewer claim: true.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |

Expected no memberships or owned communities.

Intended contributions: none; 0 replies. Observed own-contribution API counts: 0
posts and 0 replies. Contributions include retained deletion/moderation
tombstones.

Observed notifications: 0 total, 0 unread, 1 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Open Settings → Platform safety → Safety reports; inspect
submitted, claimed, removed-content, and no-action reports.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_6@yopmail.com

Purpose: Several communities; empty circle and transferred ownership.

Profile: expected preferred name **Grace Park**; observed **Grace Park**.
Community profiles have no avatar or biography fields. Authentication: fresh
password login succeeded; email verification: confirmed by Auth. Reviewer claim:
false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Active            | Member / Active            |
| quiet     | Organizer / Active         | Organizer / Active         |
| prayer    | Member / Active            | Member / Active            |
| archive   | Member / Active            | Member / Active            |
| handoff   | Organizer / Active         | Organizer / Active         |

Intended contributions: prayer-past, conversation-4, conversation-9,
conversation-14; 4 replies. Observed own-contribution API counts: 4 posts and 4
replies. Contributions include retained deletion/moderation tombstones.

Observed notifications: 2 total, 2 unread, 2 page(s). Blocked accounts: 8.
Enrollment: Missing.

Manual review: Compare empty and transferred communities, blocked members, and
muted replies; progress remains private because enrollment is unavailable.

Account-specific warnings/errors this run: recoverable: Scheduled enrollment
(QA/StateDiscrepancy/Unspecified); recoverable: Independent progress consent
(QA/StateDiscrepancy/Unspecified). Global and cross-account checks also apply.

### 77faithful_7@yopmail.com

Purpose: Left the main circle; retains access to own contributions.

Profile: expected preferred name **Sam**; observed **Sam**. Community profiles
have no avatar or biography fields. Authentication: fresh password login
succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Left              | Member / Left              |

Intended contributions: left-contribution; 3 replies. Observed own-contribution
API counts: 1 posts and 3 replies. Contributions include retained
deletion/moderation tombstones.

Observed notifications: 0 total, 0 unread, 1 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Confirm the main circle is absent; open Settings → shared
contributions to manage retained writing.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_8@yopmail.com

Purpose: Dense feed, long writing, and busy thread.

Profile: expected preferred name **Alexandria Catherine Montgomery**; observed
**Alexandria Catherine Montgomery**. Community profiles have no avatar or
biography fields. Authentication: fresh password login succeeded; email
verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Active            | Member / Active            |
| prayer    | Member / Active            | Member / Active            |

Intended contributions: long-reading, author-deleted, safety-removed,
conversation-1, conversation-5, conversation-6, conversation-10,
conversation-11, conversation-15; 0 replies. Observed own-contribution API
counts: 9 posts and 0 replies. Contributions include retained
deletion/moderation tombstones.

Observed notifications: 21 total, 21 unread, 2 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Scroll through the long conversation and load the second
feed/reply pages; compare author deletion and moderation placeholders.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_9@yopmail.com

Purpose: Removed from the main circle; member of a closed archive.

Profile: expected preferred name **Noah**; observed **Noah**. Community profiles
have no avatar or biography fields. Authentication: fresh password login
succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Removed           | Member / Removed           |
| archive   | Member / Active            | Member / Active            |

Intended contributions: removed-contribution, archive-thanks; 3 replies.
Observed own-contribution API counts: 2 posts and 3 replies. Contributions
include retained deletion/moderation tombstones.

Observed notifications: 0 total, 0 unread, 1 page(s). Blocked accounts: none.
Enrollment: not enrolled by this fixture / unverified if dependent step failed.

Manual review: Confirm the main circle is unavailable and the archive is
read-only; inspect own contributions.

Account-specific warnings/errors this run: none recorded. Global and
cross-account checks also apply.

### 77faithful_10@yopmail.com

Purpose: Reference member; prayer-circle Organizer and former Organizer.

Profile: expected preferred name **Elias**; observed **Elias**. Community
profiles have no avatar or biography fields. Authentication: fresh password
login succeeded; email verification: confirmed by Auth. Reviewer claim: false.

| Community | Intended role / membership | Observed role / membership |
| --------- | -------------------------- | -------------------------- |
| circle    | Member / Active            | Member / Active            |
| prayer    | Organizer / Active         | Organizer / Active         |
| archive   | Member / Active            | Member / Active            |
| handoff   | Member / Active            | Member / Active            |

Intended contributions: conversation-3, conversation-8, conversation-13,
single-prayer, handoff-note; 3 replies. Observed own-contribution API counts: 5
posts and 3 replies. Contributions include retained deletion/moderation
tombstones.

Observed notifications: 17 total, 16 unread, 1 page(s). Blocked accounts: none.
Enrollment: Missing.

Manual review: Inspect the one-request circle, former Organizer membership, and
read/unread inbox; enrollment is unavailable and progress remains private.

Account-specific warnings/errors this run: recoverable: Scheduled enrollment
(QA/StateDiscrepancy/Unspecified); recoverable: Independent progress consent
(QA/StateDiscrepancy/Unspecified). Global and cross-account checks also apply.

## 6. Seeded Community Overview

| Key / name                              | Verified ID          | Purpose                                                                                                         | Observed members / posts / pages |
| --------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| circle: Scripture and Everyday Faith    | N1nD6wkAvsNjsFVGWXMy | A QA circle for reading Scripture, asking thoughtful questions, and encouraging one another in following Jesus. | 6 / 25 / 2                       |
| quiet: A Quiet Beginning                | K0an1XO7KKNMyZgDQTlt | An empty QA community for reviewing the first invitation and conversation.                                      | 1 / 0 / 1                        |
| prayer: Neighbors in Prayer             | bx3rGEdjnUvTcGtmTktB | A small QA prayer circle with a single request and space to respond.                                            | 4 / 1 / 1                        |
| archive: Summer Reading Archive         | 5zf7J5fl26dI3Yj84D6S | A closed QA archive whose members can still read their shared conversation.                                     | 4 / 2 / 1                        |
| handoff: Serving Our Neighbors Together | S2siPxXdb4QGAsBMMxNR | A QA circle for reviewing a handoff to another Organizer and a shared journey schedule.                         | 3 / 1 / 1                        |

Community names carry [COMMUNITY-QA]. circle contains all four post types, 25
posts, three prayer states, one edited shared copy, author and moderator
tombstones, and a 25-reply thread. quiet is empty; prayer has one request;
archive has two entries and is closed; handoff has one announcement, a
transferred Organizer, and canceled schedule history. These are intended counts;
the table above and verification results establish actual state.

## 7. Social / Relationship Matrix

| Relationship          | Intended state                                  | Verification evidence                          |
| --------------------- | ----------------------------------------------- | ---------------------------------------------- |
| 4 → circle            | Organizer; 2, 3, 6, 8, 10 active members        | Verified                                       |
| 7 → circle            | Left; own shared writing retained               | Verified                                       |
| 9 → circle / archive  | Removed from circle; active archive member      | Verified                                       |
| 6 → 8                 | Blocks account 8; hides its published writing   | Verified                                       |
| 2, 6, 8 → 3           | Praying on current request; 10 withdrew support | Verified                                       |
| 10 → 6                | Organizer handoff; 10 remains Member            | Verified                                       |
| 5 → safety reports    | Independent platform reviewer; no memberships   | Verified                                       |
| 3 / 6 / 10 → progress | Both consent / aggregate only / individual only | Suppression verified; per-account checks below |

## 8. Error and Warning Log

Historical implementation issues: the initial credential adapter could
authenticate but was incompatible with Admin Firestore; it was corrected to use
the installed Google Firestore client with the same CLI identity in memory. The
initial verifier incorrectly attempted client reads of protected membership
indexes and expected a community ID in invitation previews; both verifier
assumptions were corrected. Those earlier errors remain in execution history for
auditability and are separate from the product defects below.

| Severity    | Account                   | Operation                           | Endpoint / service                        | Code / reason                        | Impact                                                                                                                                            | Continued |
| ----------- | ------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| recoverable | Environment / dataset     | Post timestamp API contract circle  | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. | Yes       |
| recoverable | Environment / dataset     | Post timestamp API contract prayer  | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. | Yes       |
| recoverable | Environment / dataset     | Post timestamp API contract archive | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. | Yes       |
| recoverable | Environment / dataset     | Post timestamp API contract handoff | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. | Yes       |
| recoverable | 77faithful_2@yopmail.com  | Scheduled enrollment                | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Observed Missing; original start date 2026-09-29.                                                                                                 | Yes       |
| recoverable | 77faithful_3@yopmail.com  | Scheduled enrollment                | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Observed Missing; original start date 2026-09-29.                                                                                                 | Yes       |
| recoverable | 77faithful_3@yopmail.com  | Independent progress consent        | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Individual and aggregate settings match the deliberate consent matrix.                                                                            | Yes       |
| recoverable | 77faithful_6@yopmail.com  | Scheduled enrollment                | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Observed Missing; original start date 2026-09-29.                                                                                                 | Yes       |
| recoverable | 77faithful_6@yopmail.com  | Independent progress consent        | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Individual and aggregate settings match the deliberate consent matrix.                                                                            | Yes       |
| recoverable | 77faithful_10@yopmail.com | Scheduled enrollment                | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Observed Missing; original start date 2026-09-29.                                                                                                 | Yes       |
| recoverable | 77faithful_10@yopmail.com | Independent progress consent        | API read-back verification                | QA/StateDiscrepancy / Unspecified    | Individual and aggregate settings match the deliberate consent matrix.                                                                            | Yes       |
| recoverable | Environment / dataset     | Frozen future schedule              | API read-back verification                | QA/StateDiscrepancy / Unspecified    | First enrollment freezes the schedule.                                                                                                            | Yes       |
| warning     | Environment / dataset     | Configured course theme contract    | requirePublishedCourse / formationCourses | QA/CourseThemeMismatch / Unspecified | 49/77 day theme IDs differ from the branch contract. Enrollment is blocked; no course data changed.                                               | Yes       |

### Earlier executions retained in the local checkpoint

| Time                     | Status  | Provisioned / verified | Mutations / checkpoint reuses | Warnings / errors |
| ------------------------ | ------- | ---------------------- | ----------------------------- | ----------------- |
| 2026-09-15T19:57:14.953Z | Blocked | 0 / 0                  | 0 / 0                         | 1                 |
| 2026-09-15T19:58:08.669Z | Partial | 10 / 1                 | 103 / 0                       | 23                |
| 2026-09-15T20:05:06.355Z | Partial | 10 / 6                 | 0 / 82                        | 16                |

- 2026-09-15T19:57:14.953Z: blocking; dataset; Seeder execution; startup /
  runtime; firestore/invalid-credential/Unspecified; Dependent operations
  stopped. Already-created resources remain checkpointed for a safe rerun..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_2@yopmail.com; enroll-2;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_3@yopmail.com; enroll-3;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_6@yopmail.com; enroll-6;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_10@yopmail.com; enroll-10;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_2@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_3@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_4@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_6@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_7@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_8@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_9@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_10@yopmail.com; Verify
  account and relationships; Auth / Firestore client / Community read callables;
  permission-denied/Unspecified; Dependent state may be missing; independent
  operations continue.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; dataset; Chronological ordering circle;
  API read-back verification; QA/StateDiscrepancy/Unspecified; Newest first
  across every fetched page.. Earlier failure, not evidence of a current failure
  if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; dataset; Chronological ordering
  archive; API read-back verification; QA/StateDiscrepancy/Unspecified; Newest
  first across every fetched page.. Earlier failure, not evidence of a current
  failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_1@yopmail.com; Invitation
  preview; API read-back verification; QA/StateDiscrepancy/Unspecified; Outsider
  preview includes community context without the member list or feed.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_2@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_3@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_3@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_6@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_6@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_10@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T19:58:08.669Z: recoverable; 77faithful_10@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T19:58:08.669Z: recoverable; dataset; Frozen future schedule; API
  read-back verification; QA/StateDiscrepancy/Unspecified; First enrollment
  freezes the schedule.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_2@yopmail.com; enroll-2;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_3@yopmail.com; enroll-3;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_6@yopmail.com; enroll-6;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_10@yopmail.com; enroll-10;
  enrollCommunityJourney; functions/failed-precondition/ContentUnavailable;
  Dependent state may be missing; independent operations continue.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; dataset; Post timestamp API contract
  circle; API read-back verification; QA/StateDiscrepancy/Unspecified; Client
  parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected
  only to diagnose ordering; they remain a failed API contract.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; dataset; Post timestamp API contract
  prayer; API read-back verification; QA/StateDiscrepancy/Unspecified; Client
  parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected
  only to diagnose ordering; they remain a failed API contract.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; dataset; Post timestamp API contract
  archive; API read-back verification; QA/StateDiscrepancy/Unspecified; Client
  parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected
  only to diagnose ordering; they remain a failed API contract.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; dataset; Post timestamp API contract
  handoff; API read-back verification; QA/StateDiscrepancy/Unspecified; Client
  parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected
  only to diagnose ordering; they remain a failed API contract.. Earlier
  failure, not evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_2@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_3@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_3@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_6@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_6@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_10@yopmail.com; Scheduled
  enrollment; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Observed Missing; original start date 2026-09-29.. Earlier failure, not
  evidence of a current failure if the latest verification passes.

- 2026-09-15T20:05:06.355Z: recoverable; 77faithful_10@yopmail.com; Independent
  progress consent; API read-back verification; QA/StateDiscrepancy/Unspecified;
  Individual and aggregate settings match the deliberate consent matrix..
  Earlier failure, not evidence of a current failure if the latest verification
  passes.

- 2026-09-15T20:05:06.355Z: recoverable; dataset; Frozen future schedule; API
  read-back verification; QA/StateDiscrepancy/Unspecified; First enrollment
  freezes the schedule.. Earlier failure, not evidence of a current failure if
  the latest verification passes.

## 9. Verification Results

Verified checks: 216. Failed checks: 12. Account verification means all recorded
account checks passed with no account-level recoverable/blocking errors;
cross-account and dataset checks are reported separately. A partial run is never
marked complete.

| Account | Check                                   | Result   | Evidence                                                                                                                                          |
| ------- | --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 1       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 1       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 1       | Exact active community count            | verified | Observed 0 active memberships.                                                                                                                    |
| 1       | Own contributions                       | verified | Observed 0 posts and 0 replies, including tombstones.                                                                                             |
| 1       | Empty notification inbox                | verified | Observed 0 visible notifications.                                                                                                                 |
| 1       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 2       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 2       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 2       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 2       | Membership circle                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 2       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 2       | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 2       | Membership prayer                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 2       | List access prayer                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 2       | Capabilities prayer                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 2       | Exact active community count            | verified | Observed 2 active memberships.                                                                                                                    |
| 2       | Own contributions                       | verified | Observed 1 posts and 4 replies, including tombstones.                                                                                             |
| 2       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 3       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 3       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 3       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 3       | Membership circle                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 3       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 3       | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 3       | Membership handoff                      | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 3       | List access handoff                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 3       | Capabilities handoff                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 3       | Exact active community count            | verified | Observed 2 active memberships.                                                                                                                    |
| 3       | Own contributions                       | verified | Observed 5 posts and 4 replies, including tombstones.                                                                                             |
| 3       | Read and unread activity                | verified | Observed 19 unread of 20 notifications.                                                                                                           |
| 3       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 4       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 4       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 4       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 4       | Membership circle                       | verified | Expected Active/Organizer; observed Active/Organizer.                                                                                             |
| 4       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 4       | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 4       | Membership archive                      | verified | Expected Active/Organizer; observed Active/Organizer.                                                                                             |
| 4       | List access archive                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 4       | Capabilities archive                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 4       | Exact active community count            | verified | Observed 2 active memberships.                                                                                                                    |
| 4       | Own contributions                       | verified | Observed 2 posts and 4 replies, including tombstones.                                                                                             |
| 4       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 5       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 5       | Safety authority                        | verified | Platform safety reviewer claim required.                                                                                                          |
| 5       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 5       | Exact active community count            | verified | Observed 0 active memberships.                                                                                                                    |
| 5       | Own contributions                       | verified | Observed 0 posts and 0 replies, including tombstones.                                                                                             |
| 5       | Empty notification inbox                | verified | Observed 0 visible notifications.                                                                                                                 |
| 5       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 6       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 6       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 6       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 6       | Membership circle                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 6       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 6       | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 6       | Membership quiet                        | verified | Expected Active/Organizer; observed Active/Organizer.                                                                                             |
| 6       | List access quiet                       | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 6       | Capabilities quiet                      | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 6       | Membership prayer                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 6       | List access prayer                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 6       | Capabilities prayer                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 6       | Membership archive                      | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 6       | List access archive                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 6       | Capabilities archive                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 6       | Membership handoff                      | verified | Expected Active/Organizer; observed Active/Organizer.                                                                                             |
| 6       | List access handoff                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 6       | Capabilities handoff                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 6       | Exact active community count            | verified | Observed 5 active memberships.                                                                                                                    |
| 6       | Own contributions                       | verified | Observed 4 posts and 4 replies, including tombstones.                                                                                             |
| 6       | Blocked members                         | verified | Only account 8 is blocked.                                                                                                                        |
| 6       | Notification preferences                | verified | Replies and push are muted for the main circle.                                                                                                   |
| 6       | Blocked-author feed filtering           | verified | Published writing by blocked account 8 is filtered.                                                                                               |
| 7       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 7       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 7       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 7       | Membership circle                       | verified | Expected Left/Member; observed Left/Member.                                                                                                       |
| 7       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 7       | getCommunityContext restriction         | verified | Observed functions/permission-denied, CommunityUnavailable.                                                                                       |
| 7       | Exact active community count            | verified | Observed 0 active memberships.                                                                                                                    |
| 7       | Own contributions                       | verified | Observed 1 posts and 3 replies, including tombstones.                                                                                             |
| 7       | Empty notification inbox                | verified | Observed 0 visible notifications.                                                                                                                 |
| 7       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 8       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 8       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 8       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 8       | Membership circle                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 8       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 8       | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 8       | Membership prayer                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 8       | List access prayer                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 8       | Capabilities prayer                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 8       | Exact active community count            | verified | Observed 2 active memberships.                                                                                                                    |
| 8       | Own contributions                       | verified | Observed 9 posts and 0 replies, including tombstones.                                                                                             |
| 8       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 9       | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 9       | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 9       | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 9       | Membership circle                       | verified | Expected Removed/Member; observed Removed/Member.                                                                                                 |
| 9       | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 9       | getCommunityContext restriction         | verified | Observed functions/permission-denied, CommunityUnavailable.                                                                                       |
| 9       | Membership archive                      | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 9       | List access archive                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 9       | Capabilities archive                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 9       | Exact active community count            | verified | Observed 1 active memberships.                                                                                                                    |
| 9       | Own contributions                       | verified | Observed 2 posts and 3 replies, including tombstones.                                                                                             |
| 9       | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| 10      | Fresh password login and verified email | verified | Fresh Firebase Auth password login; no cached creation response used.                                                                             |
| 10      | Safety authority                        | verified | No platform safety reviewer claim expected.                                                                                                       |
| 10      | Profile name                            | verified | Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.                                            |
| 10      | Membership circle                       | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 10      | List access circle                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 10      | Capabilities circle                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 10      | Membership prayer                       | verified | Expected Active/Organizer; observed Active/Organizer.                                                                                             |
| 10      | List access prayer                      | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 10      | Capabilities prayer                     | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 10      | Membership archive                      | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 10      | List access archive                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 10      | Capabilities archive                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 10      | Membership handoff                      | verified | Expected Active/Member; observed Active/Member.                                                                                                   |
| 10      | List access handoff                     | verified | Only active memberships, including closed archives, appear in the community list.                                                                 |
| 10      | Capabilities handoff                    | verified | Member/Organizer capabilities and closed-archive write restrictions match.                                                                        |
| 10      | Exact active community count            | verified | Observed 4 active memberships.                                                                                                                    |
| 10      | Own contributions                       | verified | Observed 5 posts and 3 replies, including tombstones.                                                                                             |
| 10      | Read and unread activity                | verified | Observed 16 unread of 17 notifications.                                                                                                           |
| 10      | Blocked members                         | verified | No blocked accounts expected.                                                                                                                     |
| Dataset | Ownership and lifecycle circle          | verified | Expected Organizer 4, Active.                                                                                                                     |
| Dataset | Member roster circle                    | verified | Expected and observed 6/6 members.                                                                                                                |
| Dataset | Post count circle                       | verified | Expected 25, observed 25 posts.                                                                                                                   |
| Dataset | Post timestamp API contract circle      | failed   | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. |
| Dataset | Chronological ordering circle           | verified | Newest first across every fetched page.                                                                                                           |
| Dataset | Post welcome                            | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post prayer-current                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post prayer-answered                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post prayer-past                        | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post shared-copy                        | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post long-reading                       | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post author-deleted                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post safety-removed                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post left-contribution                  | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post removed-contribution               | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-1                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-2                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-3                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-4                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-5                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-6                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-7                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-8                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-9                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-10                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-11                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-12                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-13                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-14                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post conversation-15                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Feed pagination                         | verified | 2 pages with 25 unique, mixed-author entries.                                                                                                     |
| Dataset | Ownership and lifecycle quiet           | verified | Expected Organizer 6, Active.                                                                                                                     |
| Dataset | Member roster quiet                     | verified | Expected and observed 1/1 members.                                                                                                                |
| Dataset | Post count quiet                        | verified | Expected 0, observed 0 posts.                                                                                                                     |
| Dataset | Post timestamp API contract quiet       | verified | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. |
| Dataset | Chronological ordering quiet            | verified | Newest first across every fetched page.                                                                                                           |
| Dataset | Ownership and lifecycle prayer          | verified | Expected Organizer 10, Active.                                                                                                                    |
| Dataset | Member roster prayer                    | verified | Expected and observed 4/4 members.                                                                                                                |
| Dataset | Post count prayer                       | verified | Expected 1, observed 1 posts.                                                                                                                     |
| Dataset | Post timestamp API contract prayer      | failed   | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. |
| Dataset | Chronological ordering prayer           | verified | Newest first across every fetched page.                                                                                                           |
| Dataset | Post single-prayer                      | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Ownership and lifecycle archive         | verified | Expected Organizer 4, Closed.                                                                                                                     |
| Dataset | Member roster archive                   | verified | Expected and observed 4/4 members.                                                                                                                |
| Dataset | Post count archive                      | verified | Expected 2, observed 2 posts.                                                                                                                     |
| Dataset | Post timestamp API contract archive     | failed   | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. |
| Dataset | Chronological ordering archive          | verified | Newest first across every fetched page.                                                                                                           |
| Dataset | Post archive-welcome                    | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Post archive-thanks                     | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Ownership and lifecycle handoff         | verified | Expected Organizer 6, Active.                                                                                                                     |
| Dataset | Member roster handoff                   | verified | Expected and observed 3/3 members.                                                                                                                |
| Dataset | Post count handoff                      | verified | Expected 1, observed 1 posts.                                                                                                                     |
| Dataset | Post timestamp API contract handoff     | failed   | Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract. |
| Dataset | Chronological ordering handoff          | verified | Newest first across every fetched page.                                                                                                           |
| Dataset | Post handoff-note                       | verified | Author, content/type or text-free tombstone, and prayer status match the fixture.                                                                 |
| Dataset | Reply pagination                        | verified | Observed 25 replies across 2 pages.                                                                                                               |
| Dataset | Reply chronological ordering            | verified | Replies are oldest first across pages.                                                                                                            |
| Dataset | Reply busy-thread-1                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-2                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-3                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-4                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-5                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-6                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-7                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-8                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-9                     | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-10                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-11                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-12                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-13                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-14                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-15                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-16                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-17                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-18                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-19                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-20                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-21                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-22                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-23                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-24                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Reply busy-thread-25                    | verified | Reply authorship, edits, and deletion state match.                                                                                                |
| Dataset | Prayer acknowledgments                  | verified | Three supporters (2, 6, 8); account 10 withdrew its acknowledgment.                                                                               |
| 1       | getCommunityContext restriction         | verified | Observed functions/permission-denied, CommunityUnavailable.                                                                                       |
| 5       | getCommunityContext restriction         | verified | Observed functions/permission-denied, CommunityUnavailable.                                                                                       |
| 4       | listCommunitySafetyReports restriction  | verified | Observed functions/permission-denied, ReviewerRequired.                                                                                           |
| 1       | Invitation preview                      | verified | Outsider preview includes community context without the member list or feed.                                                                      |
| 5       | Report submitted                        | verified | Expected Submitted; observed Submitted.                                                                                                           |
| 5       | Report under-review                     | verified | Expected UnderReview; observed UnderReview.                                                                                                       |
| 5       | Report removed                          | verified | Expected Resolved; observed Resolved.                                                                                                             |
| 5       | Report no-action                        | verified | Expected Resolved; observed Resolved.                                                                                                             |
| 2       | Scheduled enrollment                    | failed   | Observed Missing; original start date 2026-09-29.                                                                                                 |
| 3       | Scheduled enrollment                    | failed   | Observed Missing; original start date 2026-09-29.                                                                                                 |
| 3       | Independent progress consent            | failed   | Individual and aggregate settings match the deliberate consent matrix.                                                                            |
| 6       | Scheduled enrollment                    | failed   | Observed Missing; original start date 2026-09-29.                                                                                                 |
| 6       | Independent progress consent            | failed   | Individual and aggregate settings match the deliberate consent matrix.                                                                            |
| 10      | Scheduled enrollment                    | failed   | Observed Missing; original start date 2026-09-29.                                                                                                 |
| 10      | Independent progress consent            | failed   | Individual and aggregate settings match the deliberate consent matrix.                                                                            |
| Dataset | Frozen future schedule                  | failed   | First enrollment freezes the schedule.                                                                                                            |
| Dataset | Aggregate suppression                   | verified | Small groups do not expose aggregate counts.                                                                                                      |
| Dataset | Canceled schedule                       | verified | Canceled schedule remains in history after ownership transfer.                                                                                    |

The creation response is not the verification source. Checks use fresh Auth
login, server-only client profile reads, callable community/context/member
readers, full bounded cursor traversal, exact authors/content/status
comparisons, private own-contribution reads, notification and block readers,
reviewer reads, and journey/consent readers. Membership indexes intentionally
deny client reads; narrowly scoped administrative reads confirm the Left/Removed
lifecycle while callables independently verify actual access. Formation metadata
reads diagnose enrollment failures. These administrative diagnostics do not
mutate data. Protected-read denials are verified without creating unauthorized
resources.

### Product findings and reproduction

- **Post response timestamp contract:** log in as account 4 or 8 and open the
  main circle; the same issue affects nonempty archives.
  listCommunityPosts/getCommunityPost expose native Firestore timestamp
  serialization (_seconds/_nanoseconds), while
  src/features/communities/community-post.service.ts requires
  seconds/nanoseconds. functions/src/community/community-post.ts returns native
  timestamps from postProjection. API records and cursor ordering are verified,
  but UI compatibility fails. This seed does not repair or deploy a product
  change.

- **Configured course mismatch:** provisional-77-days/draft-268256b3f2ad266b;
  affected days 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 43, 44, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63. Log in as 2, 3, 6, or
  10, open the main circle’s shared schedule, review the saved
  Movement/Gratitude and WEB setup, and attempt enrollment.
  enrollCommunityJourney returns failed-precondition / ContentUnavailable.
  requirePublishedCourse in functions/src/journey/start-journey.ts rejects day
  theme IDs that differ from FormationThemeOrder. No Scripture, course metadata,
  private journey, or progress record was changed to bypass this check.

- **Line-break validation:** src/features/communities/community-post.ts rejects
  control characters including newline. A two-line Discussion is rejected by
  parseCreateCommunityPostRequest. Seeded writing uses single-paragraph text to
  follow the current contract; long text still wraps naturally. This is a
  documented implementation constraint, not a deliberately invalid seeded post.

## 10. Manual QA Suggestions

| Scenario                                                                                                                                   | Login as account | Expected state (subject to verification above)                 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------------------- |
| Open Communities for the empty list; obtain a current code from account 4 to preview joining without a personal journey                    | 1                | New verified account; no memberships or contributions          |
| Read the answered request and prayer support; review saved setup and reproduce unavailable enrollment                                      | 2                | Light activity; prayer support and unread activity             |
| Inspect the edited shared reflection, busy thread, and read/unread inbox; enrollment is currently unavailable                              | 3                | Active conversation participant; edited writing                |
| Review invitation controls, member management, safety-access denial, and the closed archive                                                | 4                | Organizer of the main circle and closed archive                |
| Open Settings → Platform safety → Safety reports; inspect submitted, claimed, removed-content, and no-action reports                       | 5                | Platform safety reviewer; no community memberships             |
| Compare empty and transferred communities, blocked members, and muted replies; progress remains private because enrollment is unavailable  | 6                | Several communities; empty circle and transferred ownership    |
| Confirm the main circle is absent; open Settings → shared contributions to manage retained writing                                         | 7                | Left the main circle; retains access to own contributions      |
| Scroll through the long conversation and load the second feed/reply pages; compare author deletion and moderation placeholders             | 8                | Dense feed, long writing, and busy thread                      |
| Confirm the main circle is unavailable and the archive is read-only; inspect own contributions                                             | 9                | Removed from the main circle; member of a closed archive       |
| Inspect the one-request circle, former Organizer membership, and read/unread inbox; enrollment is unavailable and progress remains private | 10               | Reference member; prayer-circle Organizer and former Organizer |

## 11. Known Coverage Gaps

The hosted Functions inventory does not include
`registerCommunityPushInstallation`. Push implementation exists in source, but
its deployment and device delivery are not verified in this project.

- Native push, OS permissions, delivery receipts, and device taps require a
  configured real device. No device registrations or fake push tokens are
  seeded.
- There are no pending join approvals, public communities, moderator
  memberships, avatars, biographies, attachments, nested replies, generic likes,
  or direct messages in this MVP.
- Ten identities cannot cross the 20-member roster page boundary. Five useful
  communities do not cross the community-list page boundary. Feed and replies
  intentionally cross their real 20-item boundaries.
- Dates are server-owned. Content was created during this execution; no
  historical audit timestamps were forged. Future enrollment remains scheduled
  until the actual date, and later reruns report time-dependent drift. No
  personal journeys, private reflections, completion marks, or holiness/progress
  scores were fabricated.
- Published course availability is read from the existing API. No course import
  or global formation configuration change is made. If course access or private
  setup is unavailable, schedule/enrollment gaps appear in the error log.
- The dataset shows aggregate suppression, not an available aggregate with five
  qualifying started participants.
- Invitation rotation, revocation, expiration, rejoining, and unblocking are
  manual scenarios; the seed preserves stable reviewable final states. Removed
  users cannot be reinstated through an ordinary invitation.
- Transient network, loading, offline, and concurrent-edit conflicts are not
  persistent fixture states. Use manual network controls or existing integration
  tests.
- No cleanup/reset is provided because closure, removal, reviewer decisions, and
  content deletion have terminal semantics. Reconciliation preserves successful
  resources and reports manual drift.
- The initial sandbox network probe failed; the authenticated read-only
  inventory succeeded when network access was granted. No product bug is
  inferred from a sandbox connectivity failure.

## 12. Handoff Validation and Final Audit

These checks were run on 2026-09-15 after implementing this utility. They are
separate from the API verification above and are not a release certification.

| Check                                            | Actual result                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node --test tests/community-qa-seed.test.cjs`   | 8 passed, 0 failed                                                                                                                                                             |
| Scoped ESLint for all seven new JavaScript files | Passed, no lint findings                                                                                                                                                       |
| `npm run format:check`                           | Passed across the repository                                                                                                                                                   |
| `npm run lint`                                   | Passed with 7 existing warnings in application/component files                                                                                                                 |
| `npm --prefix functions run build`               | Passed                                                                                                                                                                         |
| `npm --prefix functions run lint`                | Passed                                                                                                                                                                         |
| `tsc --noEmit`                                   | Failed in unchanged components and utility code; examples include form component optional-property types and object/string indexing                                            |
| `npm test -- --runInBand --watch=false`          | 78 suites passed, 6 failed; 603 tests passed, 2 failed. Existing failures include journey setup expectations, TypeScript diagnostics, and Jest parsing Expo/Reanimated modules |
| Hosted seed rerun                                | 0 new checkpointed mutations; 82 operations reused; all 29 posts and 25 replies remained at intended counts                                                                    |
| Final `--verify-only` run                        | 216 checks passed; 12 failed for the documented course/enrollment and post timestamp issues; 1 diagnostic warning                                                              |
| Account scope                                    | Exactly the ten requested email addresses; all authenticate with the shared environment-provided password                                                                      |
| Change scope                                     | Six QA script modules, one Node test file, this report, and the local-checkpoint ignore entry                                                                                  |
| Protected paths                                  | No changes to `src/component/**`, `src/components/**`, `src/types/**`, or existing documentation                                                                               |
| Credential audit                                 | No supplied password, access/refresh token, private key, invitation code, or session cookie in the committed deliverables                                                      |

No application, backend implementation, dependency, course content, or
deployment was changed to hide the existing failures. The working tree was clean
before this task. The full diff was reviewed; only the nine authorized QA files
are included in the commit.
