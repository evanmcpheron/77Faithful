# Community implementation plan

## Status and authority

This document records the adopted community workflow and implementation
boundaries. It is a plan, not evidence that a screen, API, rule, scheduled job,
notification, moderation tool, deployment, or production configuration exists.
Backend tickets must register real operations in
`docs/community-api-contract.md`; frontend tickets must consume those contracts
instead of creating parallel request or response shapes.

The decisions here are approved for the community workstream. They supersede the
older “communities are outside V1” boundary only for scoped community work; they
do not authorize a production launch. The permanent product principles still
apply: Scripture and Jesus Christ remain central, practices do not earn God's
favor, missed days do not reset a journey, progress is factual rather than a
measure of holiness, the product remains free and ad-free, and private writing
stays private unless a participant deliberately submits a separate community
copy.

Inspection basis (2026-09-14):

- Original reviewed SHA (the documentation review tree recorded by the
  manifest): `943ea3390312af0f766e45cffd352cc640203fe0`, as recorded in
  `DOCUMENTATION_MANIFEST.md`.
- Actual local `HEAD`: `b349cf0df67292db4e9f24dc8db6bd5ff3d52040`.
- Local branch: `community`; local `main` and the merge base were the same SHA.
- The worktree was clean before this ticket's documentation edits.
- No `product/` directory or product documents were present in this checkout.
  This source gap does not turn planned behavior into implemented behavior.

## Accepted defaults and pre-existing behavior

### Accepted defaults

The following are adopted requirements, whether or not current code supports
them:

1. Membership never shares private writing, private practice choices or
   completion, contact information, or a personal journey. Joining does not
   enroll or start a journey. A community post is a deliberately submitted copy.
   Current members, including later joiners, can read submitted reflections,
   prayer requests, discussions, announcements, and replies while they have
   access. Membership and progress-sharing consent are separate.
2. Roles remain Organizer and Member. Organizer administration covers
   invitations, members, community details, participation expectations,
   scheduled journeys, ownership transfer, and closure—never private participant
   data.
3. Each community has one active reusable invitation, expiring after 30 days by
   default. It supplies both a copyable code and a native-share link and is
   recoverable by an authorized organizer on another session or device. Codes
   are cryptographically random, unambiguous, and contain at least 80 bits of
   randomness. Lookup uses a backend-only digest; recovery uses authenticated
   encryption with a server-managed secret. Plaintext is never stored in
   member-readable data or response caches. Rotation or revocation blocks old
   redemption without affecting members.
4. Join is code or link, authentication, verified preview, explicit
   confirmation, then community home. A verified account without a personal
   journey may join. Preview shows name, purpose, organizer, participation
   expectations, any group schedule, sharing boundaries, and later-member
   access, but no member list or posts. A person who left may rejoin with a
   valid invitation. A removed member may not use an ordinary invitation to
   return, and this release has no automatic reinstatement.
5. Creation continues to redirect to community home. An empty organizer home
   prominently offers **Invite people** without opening a modal automatically.
   Invitation access also remains on Members and home. A UI must not show an
   action until its real operation is available.
6. Home centers chronological conversation, a simple composer, and replies—not
   completion monitoring. The four post types are PrayerRequest, Discussion,
   OrganizerAnnouncement, and SharedReflectionCopy. Reflection sharing is an
   explicit preview, edit, choose-one-community, and submit workflow. Saving,
   sharing, editing, or deleting text never completes Reflect.
7. Prayer requests use Current, NoLongerCurrent, and Answered. Each member may
   add one idempotent, reversible “I'm praying” acknowledgment per request and
   may reply. This release has no generic reaction, popularity ordering, streak,
   rank, or leaderboard.
8. Personal and shared copies have independent edit and delete controls. After
   leaving, removal, or closure, an authenticated author may list and delete
   only their own shared contributions through an owner-only surface, without
   reading other member content. Leaving or removal immediately ends community
   access and progress visibility. Shared posts remain until author deletion or
   authorized moderation. Participant copy must explain that already viewed or
   copied content cannot be recalled.
9. A closed community is a read-only archive for members whose membership
   remains active. It permits no join, invitation, new content, edits,
   acknowledgments, or new enrollments. Author deletion, reporting, notification
   controls, leaving, and necessary safety administration remain available.
   Closure is terminal; there is no reopen. A sole organizer must transfer
   ownership or close before leaving. Closure, leaving, and removal never end or
   reschedule private journeys.
10. A shared journey coordinates a named course and calendar start date, not
    private answers. Scheduling, enrollment, and membership are independent.
    Course and schedule freeze when the first enrollment is accepted; changes
    use cancel-and-create. Enrollment closes when the named date begins in the
    community time zone, with no late enrollment. Scheduling never creates a
    future-dated personal journey.
11. Enrollment privately records a participant-confirmed starting IANA zone.
    Actual activation occurs on the scheduled calendar date in that participant
    zone, never earlier, and records real audit timestamps. The public schedule
    retains its community zone and the UI explains possible displayed-day
    differences. At activation, the backend rechecks confirmed account,
    membership, released content, and the one-active-journey invariant.
    Enrollment expressly consents to automatic activation. Retries are allowed
    only during that participant's Day 1; a missed window becomes an explicit
    blocked state, never a later backdated start. Existing personal journeys
    keep their current date semantics.
12. Individual and aggregate progress consent are independent, revocable, and
    Private by default. Only a high-level journey stage for consenting active
    members may be shared. Aggregate cells count only consenters and must be
    suppressed when fewer than five contribute or when a displayed total could
    reveal a suppressed cell; do not display zero or opted-out counts.
    Individual voluntary disclosure is not promised to be anonymous.
13. Private in-app notifications cover replies to one's posts or participated
    threads, prayer acknowledgments on one's requests, and organizer
    announcements—not every post. Provide per-community and per-category
    controls plus push mute. Push is optional and generic on the lock screen; it
    contains no written body, invitation, community name, or sensitive actor
    detail. Recheck access, blocks, and preferences at send and open. Delivery
    is neither exactly-once nor guaranteed by the OS.
14. Reports, including reports about organizers, feed a small queue/detail
    workflow for separately provisioned platform safety reviewers. Organizer is
    not reviewer authority. Evidence is restricted; decisions are audited;
    member blocking/unblocking and server-side safeguards apply to community
    submissions only. Private journals are never scanned. Do not promise an SLA
    or emergency service.
15. Implementation uses current route, screen, layout, and service patterns.
    Consent, audience, and deletion explanations are required. There is no new
    UI kit, broad refactor, automatic branch work, chat, direct messaging,
    attachments, public discovery, AI analysis, or speculative analytics.

### Pre-existing behavior observed in code

- `createCommunity`, `getCommunity`, and `listCommunities` callable functions
  and matching client services exist. They require an authenticated,
  email-verified account; reads recheck an active membership. Creation
  transactionally creates an active community, Organizer membership, account
  membership index, and an idempotency record.
- Creation accepts a name, optional purpose, and settings, then replaces the
  route with `/communities/[communityId]`. This is the redirect to preserve.
- The community list implements loading, empty, unavailable, recoverable-error,
  and ready states. Community home implements summary loading and retry. The
  join, members, composer, post-detail, and settings screens are placeholders.
- Community routes exist under the application tabs and the Communities tab is
  gated by `EXPO_PUBLIC_COMMUNITIES_ENABLED`. The root navigator mounts the
  whole authenticated app only when a journey record exists, so a verified
  account without a personal journey cannot currently reach join. That guard
  must change in an authorized navigation ticket.
- Firestore rules contain no community collection match. Direct client community
  access is therefore not enabled; current community access goes through Admin
  SDK Cloud Functions.
- Existing shared types describe roles, membership lifecycle, communities, four
  post types, replies, reports, progress consent, coordinated schedules, and
  enrollments. Types are contracts, not proof of services or persistence.
- Current invitation types describe a single-use Pending-to-Accepted invitation
  and a return-once token. They are incompatible with the adopted reusable,
  organizer-recoverable invitation and require a separately authorized contract
  change and explicit data migration before invitation rollout.
- Current enrollment types do not store the participant-confirmed starting zone,
  and their blocked-reason union does not express every activation failure
  above. Prayer acknowledgments, community notification preferences/events,
  member blocks, safety-reviewer provisioning, and owner-only contribution
  access also lack complete shared contracts. Those are exact prerequisite
  contract gaps; this ticket does not change protected types.
- Messaging types include future community conversations and moderation includes
  a Message report target. They do not authorize chat or direct messaging in
  this release and must not be surfaced by community implementation.

## Lifecycle and workflow

### Community and membership

- Community: Active -> Closed. Closed is terminal.
- Membership: Active -> Leaving -> Left, or Active -> Removed. Access and
  progress visibility end as soon as leave/removal is authoritative, not after
  local cache cleanup.
- Left may return only through a new valid invitation acceptance. Removed
  remains denied during ordinary acceptance. Transfer is an atomic
  Organizer-to-Member and Member-to-Organizer change with exactly one resulting
  Organizer.
- A sole Organizer may leave only after a successful transfer or terminal close.
  Closure does not mutate membership to Left and does not affect personal
  journeys.

### Invitation and join

1. An authorized Organizer retrieves the current active invitation or creates it
   when none exists. Retrieval decrypts only for that authorized response and
   must not be cached as plaintext.
2. Rotation creates the new reusable secret and atomically invalidates the old
   digest. Revocation leaves no redeemable invitation. Expiry defaults to 30
   days.
3. A code or link resolves on the backend. Authentication and email verification
   precede preview; resolution returns only the approved preview projection.
4. The participant reviews the disclosed audience and schedule, then explicitly
   confirms. Acceptance rechecks invitation state, community state, verified
   identity, active/left/removed membership history, and idempotency.
5. Acceptance creates or reactivates only membership. Enrollment and journey
   start require their own later consent.

Migration gate: discover and classify any persisted invitation documents before
deployment. Single-use Pending invitations cannot be silently reinterpreted as
reusable. Choose and test one compatible path: revoke them and require Organizer
rotation, or migrate only records whose plaintext can be securely recovered into
the new encrypted/digested form. Never derive a reusable code from a stored
digest, mark an Accepted record reusable, or expose plaintext during migration.

### Conversation and ownership

- Home queries published/tombstoned posts in chronological order with stable
  pagination; no engagement ranking. Replies are bounded, separately paginated
  records with no arbitrary nesting.
- Post creation validates the active membership, Active community, post type,
  role for announcements, text bounds, blocks, and server safeguards. Shared
  reflections contain copied text only—no private journey, day, writing,
  revision, or practice reference.
- Edit and status-change operations use revision preconditions. Author deletion
  creates a text-free tombstone; moderation removal does likewise. A prayer
  acknowledgment is unique by request and member, and set/unset is idempotent.
- The owner-only contributions projection is independent from group-read access.
  It returns only the caller's authored items and the minimum metadata needed to
  delete them. It never reconstructs the group feed.

### Coordinated journey

1. An Organizer creates a named course/date/community-zone schedule.
2. Before the first accepted enrollment it may be canceled or replaced. The
   first acceptance freezes course and schedule.
3. Enrollment verifies active membership, Active community, released content,
   setup revision/readiness, no elapsed community start date, explicit automatic
   activation consent, and the participant-confirmed IANA zone. It stores
   private choices, motivation head, and confirmed zone outside Organizer
   access.
4. No personal journey exists until the participant's calendar reaches Day 1.
   The trusted activation job uses the existing journey-start invariants and an
   idempotent transaction, records actual timestamps, and never backdates.
5. Retry transient failures only within that participant's Day 1. On invariant
   or expired-window failure, write a specific StartBlocked result for
   participant review. Cancellation blocks unstarted enrollments but never
   changes a personal journey already started.

## Privacy and access matrix

| Data or action                                                | Active member                           | Organizer                                 | Former/removed author             | Platform safety reviewer              |
| ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------- | --------------------------------- | ------------------------------------- |
| Community details and active-member feed                      | Read                                    | Read                                      | No                                | Only restricted case evidence         |
| Member list                                                   | Read after acceptance                   | Read/administer                           | No                                | Only when required by a case          |
| Private writing, practices, detailed completion, journey link | Own data only                           | No additional access                      | Own data only                     | Never through community review        |
| Explicit shared posts/replies                                 | Read; author controls own copy          | Read; no private source access            | List/delete own copy only         | Restricted evidence for assigned case |
| Invitation plaintext                                          | No                                      | Retrieve for authorized response only     | No                                | No by default                         |
| Invitation digest/encrypted secret                            | No                                      | No direct read                            | No                                | No direct read                        |
| Individual shared stage                                       | Only for consenting active participant  | Same member-visible projection            | Revoked                           | Only if case evidence requires it     |
| Aggregate progress                                            | Suppressed projection only              | Same projection                           | Revoked                           | No routine access                     |
| Reports and decisions                                         | Submit; see only an appropriate receipt | Submit; no reviewer privilege             | No group access                   | Queue/detail and audited decisions    |
| Closed archive                                                | Read while membership remains Active    | Read plus necessary safety administration | Own contribution list/delete only | Restricted safety access              |

Organizer permissions never imply access to contact information. Blocking is
server-enforced in reads, writes, notifications, and opens; it does not grant a
blocker access to otherwise private records.

## Delivery sequence and release gates

Implementation tickets should follow dependency order without combining layers:

1. Reconcile and explicitly authorize shared contract changes for reusable
   invitations, enrollment zone/block reasons, prayer acknowledgments,
   notifications, blocks, safety review, and owner-only contributions.
2. Register backend operations in the API ledger, then implement runtime
   parsing, trusted transactions, indexes, security rules, emulator tests, audit
   records, and invitation migration.
3. Adjust route access so verified accounts without journeys can reach join
   while personal journey routes keep their existing guards. Implement
   invitation/join and the empty Organizer home first.
4. Implement chronological posts, replies, deliberate reflection copying, prayer
   state/acknowledgments, and owner-only deletion.
5. Implement administration and terminal closure; then coordinated scheduling,
   enrollment, and Day 1 activation.
6. Implement privacy-preserving progress, notifications/preferences, blocking,
   and the separately authorized safety queue/detail workflow.

Release remains blocked until all applicable items are evidenced:

- Threat model and privacy review cover private writing separation, later-member
  visibility, former-author access, cache invalidation, block behavior, and
  restricted safety evidence.
- Invitation randomness, digest lookup, authenticated encryption, secret
  rotation, expiry/rotation/revocation, cross-device recovery, rate limits,
  enumeration resistance, and legacy migration are tested.
- Server and Security Rules tests cover every role, lifecycle transition,
  permission change, direct-write denial, removed-member denial, closed archive,
  and owner-only deletion.
- Journey tests cover community/participant zones, DST and midnight boundaries,
  schedule freeze, enrollment close, no future personal journey, idempotent Day
  1 activation, one-active-journey concurrency, retry cutoff, and blocked
  outcomes.
- Progress tests cover independent default-private/revocable consent, membership
  revocation, five-contributor minimum, and complementary suppression.
- Notification tests verify category controls, generic push payloads, duplicate
  tolerance, and access/block/preference checks both at send and open.
- Reporting tests include Organizer targets, reviewer authority independent of
  membership, restricted evidence, audited outcomes, and no private-journal
  scan.
- Accessible loading, empty, unavailable, permission-change, and
  recoverable-error states are manually verified on supported devices. Copy
  includes audience, future-member visibility, consent, deletion, and non-recall
  explanations.
- No placeholder or unavailable action is exposed, no community dependency or
  SDK is added without approval, Communities remains free, and
  deployment/configuration evidence is recorded separately from passing local
  checks.

## External configuration required before release

Ticket 41's checkout-derived environment, migration, deployment, rollback,
native push, and evidence procedure is in `docs/community-release-runbook.md`.
Its commands require an explicitly approved project and are not deployment or
migration evidence. The current app identity and staging Firebase client mapping
remain operator/code release gates.

- `EXPO_PUBLIC_COMMUNITIES_ENABLED` release value and a route-access rollout
  plan.
- Firebase project environments, callable region policy, Firestore
  indexes/rules, App Check/rate-limiting decision, and emulator coverage.
- Versioned server-managed secret material for invitation authenticated
  encryption and digest lookup, with rotation, recovery, access, and audit
  procedures.
- Approved universal/app-link host and scheme for invitations; links must not
  expose community details beyond the bearer code.
- A reliable scheduled-execution mechanism for participant-zone Day 1
  activation, with idempotency, retry cutoff, monitoring, and operational
  alerts.
- Optional push provider credentials and native app configuration, generic
  payload policy, token lifecycle handling, and per-environment test devices. No
  push library is currently declared in `package.json`.
- Separately provisioned safety-reviewer identity/claims, least-privilege
  console access, evidence retention, audit retention, escalation policy, and
  support copy that does not imply emergency response or an SLA.

No emulator, credentials, device checks, deployment, or production configuration
is performed by this documentation ticket.

## Ticket 09 operational notes

Ticket 09 implements the callable-only administration boundary named
`updateCommunity`, `leaveCommunity`, `removeCommunityMember`,
`transferCommunityOrganizer`, and `closeCommunity`. The exact DTOs, validation
limits, authorization, retry behavior, reason codes, and storage effects are
recorded in the Ticket 09 section of `docs/community-api-contract.md`.

The current-member readers remain the permission-change boundary: both the
community-owned membership and the account discovery index change atomically,
while every read reauthorizes against the community-owned Active membership. The
authorized context projection includes the authoritative community revision so
frontend administration submits revision-checked mutations without direct
document access or a fabricated revision. Removed remains distinct from Left so
invitation acceptance continues to deny Removed and permit a later explicit Left
rejoin. Removal reasons are restricted administrative data and are absent from
memberships, member lists, and public responses. Retry receipts retain only a
digest of the reason rather than a second plaintext copy.

Ownership transfer changes the community owner, old and new membership roles,
and both account indexes in one revision-checked transaction. Invitation
retrieval rechecks those records, so the former Organizer loses access as soon
as transfer commits. Closure is terminal and atomically sets Closed, clears the
active invitation pointer, and revokes/deletes the pointed reusable invitation
digest when present. Retained active members keep archive reads while context
mutation capabilities become false and leaving remains available.

No post, reply, prayer acknowledgment, notification, progress, coordinated
enrollment/activation, or account-deletion backend entry point exists in this
checkout. Ticket 09 therefore could not add lifecycle checks to absent services
or cleanup integration. The authoritative Closed and non-Active membership
states are established for those later services to enforce; they must not defer
access denial to cleanup. No composite index or data migration is introduced by
the administration operations. Invitation deployment still depends on the
adopted legacy-invitation migration gate and configured encryption secret.

Verification on 2026-09-14: Functions lint and build passed; 31 focused
community unit/contract tests, 96 existing community Jest tests, and all 262
authenticated Security Rules cases passed. The new Firestore-emulator
transaction suite is present but was not run because the workstation has no Java
runtime.

Commit `f860e2b` was pushed to `origin/community`. Firestore Rules and indexes
were deployed to project `faithful-4325a`. The deployed Functions inventory
confirmed the new Node.js 24 second-generation `updateCommunity`,
`leaveCommunity`, `removeCommunityMember`, `transferCommunityOrganizer`, and
`closeCommunity` callables in `us-central1`; all existing Functions also
reported successful updates. The overall deploy command ended with an Artifact
Registry cleanup-policy warning/error after every configured resource reported
success. A cleanup retention policy remains unset because it is a separate
destructive configuration choice. This is deployment evidence, not production
launch or release-readiness evidence.

## Ticket 12 operational notes

Ticket 12 implements the callable-only post boundary named
`createCommunityPost`, `getCommunityPost`, `listCommunityPosts`,
`editCommunityPost`, and `deleteCommunityPost`. The exact DTOs, safe post
projection, limits, cursor, authorization, idempotency, reason codes, and
storage effects are recorded in the Ticket 12 section of
`docs/community-api-contract.md`.

The four accepted creation shapes are PrayerRequest, Discussion,
OrganizerAnnouncement, and SharedReflectionCopy. SharedReflectionCopy receives
only deliberately submitted text; the implementation contains no private journey
or writing read path. Ordinary active members may create the other three member
post types, while announcements require current Organizer authority. Editing
requires current active author membership and an Active community; organizers
cannot rewrite another author's words. Announcement authors must still be the
current Organizer. Type, audience, author, and prayer state remain immutable
during text edits.

Current active members can read the complete earlier chronological history in
Active communities and retained-member Closed archives. Every detail/feed read
rereads the authoritative community-owned membership, and feed cursors bind the
community plus created timestamp and post ID. Leaving/removal revokes those
readers immediately. Author deletion is deliberately separate: an authenticated
author may tombstone their own published post after exit or closure without
receiving group content. The tombstone preserves thread identity, type, author,
timestamps, and factual deleted status but contains no body.

Creation and deletion transactionally maintain a minimal backend-only
author-contribution index. It contains no submitted text and is not yet exposed
by a callable; prompt 18 owns that reader. Mutation receipts contain only a
normalized request digest and body-free result metadata. No post body is stored
in a preview, counter, receipt, public history, or index. Direct client access
to community records, contribution indexes, and operation receipts remains
denied. Built-in single-field ordering supports the feed and author index, so no
composite index, migration, secret, scheduled job, or new dependency is
required.

Local verification on 2026-09-14: Functions contract preparation, TypeScript
build, and Functions ESLint passed. The six post contract/authentication tests
passed. The Firestore emulator suite is prepared but was not run because the
workstation has no Java runtime. The Security Rules evaluation passed all 282
cases, including the new direct-access denials. Firestore Rules and the five
Ticket 12 callables were deployed to `faithful-4325a` in `us-central1`; each
resource reported a successful release/create operation. The Firebase CLI still
exited nonzero because the project's Functions artifact repository has no
cleanup policy. Setting that billing/retention policy remains an explicit
operational decision; it was not changed by this ticket.

## Ticket 13 operational notes

Ticket 13 adds the callable-only reply and prayer operations
`listCommunityReplies`, `createCommunityReply`, `editCommunityReply`,
`deleteCommunityReply`, `setCommunityPrayerRequestStatus`,
`setCommunityPrayerAcknowledgment`, and `listCommunityPrayerSupport`. Their
canonical request/result names, limits, cursors, authorization, lifecycle,
reason codes, storage paths, and retry behavior are recorded in the Ticket 13
section of `docs/community-api-contract.md`.

Replies are separate one-level records ordered oldest-first. Creation requires
an Active community and Published parent; existing replies remain readable
beneath a parent tombstone to retained current members. Authors alone edit or
delete their replies. Edits require current Active access, while author deletion
remains available after membership exit, parent deletion, or closure. Reply
creation increments a transactionally maintained record count, and reply
contributions reuse the body-free Ticket 12 author index.

Prayer status is a revision-checked, author-reported value with exactly Current,
NoLongerCurrent, and Answered. The desired-state “I'm praying” record is keyed
by account identity. True requires a published Current request in an Active
accessible community; false remains available for withdrawal after lifecycle
changes. Withdrawal/reactivation retains the first-notification eligibility
timestamp, and this ticket sends no notifications. The bounded reader derives
exact support from at most 500 currently Active memberships, so former, removed,
or deleted membership records stop contributing immediately without waiting for
cleanup. No popularity ordering or account-wide total is introduced.

No composite index, dependency, secret, or record migration is required.
Deployment requires the updated callable exports and Firestore Rules. On
2026-09-14, the Functions build and lint passed, 8 focused contract tests
passed, and all 312 configured Security Rules API cases passed. The prepared
Firestore-emulator transaction suite did not run because this machine has no
Java runtime. No functions or Rules deployment was performed by this ticket.

## Ticket 01 operational notes

Ticket 01 implements callable-only current-member readers without changing the
existing `createCommunity`, `getCommunity`, or `listCommunities` result shapes.
The new exports are `getCommunityContext`, `listCommunityPage`, and
`listCommunityMembers`. Canonical DTOs live in
`src/types/community/community-function.types.ts`; context, capability, count,
and membership projections live in the corresponding authorized community type
files. Runtime parsing is owned by
`src/features/communities/community-reader.ts` and copied by
`scripts/prepare-functions.cjs`; generated copies are not hand-edited.

The context exposes the safe community summary, the caller's authoritative
active membership, server-derived role/capabilities, lifecycle status through
the summary, and an active-member count capped at 500 with an `isExact` flag.
Closed archives remain readable to retained active members;
content/invitation/administration capabilities are false while leaving remains
permitted. Member display names are resolved from only `preferredName`; a
missing profile produces an empty name.

Both new lists default to 20 records and cap requests at 50. Cursors are opaque,
limited to 512 characters, versioned, and scoped to the operation plus caller or
community. Ordering is `joinedAt` ascending followed by document ID ascending.
Membership indexes discover candidate communities but never authorize them.
Every request and retry rechecks the available account and authoritative current
membership. Stable reason codes are `AuthenticationRequired`,
`EmailVerificationRequired`, `InvalidInput`, `InvalidCursor`,
`AccountUnavailable`, and `CommunityUnavailable`.

Required operational work is deployment of the two membership indexes and
updated Security Rules, followed by emulator verification. There is no data
migration, secret, SDK, or dependency change for these readers. The
implementation supports older Organizer memberships without display-name
snapshots by resolving the current safe profile projection.

Checks run locally on 2026-09-14:

- Functions contract preparation and TypeScript build passed.
- Functions ESLint and scoped root ESLint passed.
- Scoped Prettier check passed.
- `tests/community-reader-contract.test.cjs` and the existing
  `tests/create-community.test.cjs` passed: 11 tests total.
- Existing `src/features/communities/community-reader.service.test.ts` passed: 4
  tests.
- The repository-wide root TypeScript check was run and failed on pre-existing
  protected component and utility errors; it reported no Ticket 01 file error.
- The Firestore emulator suite was attempted but not run because no Java runtime
  is installed. The suite remains in
  `tests/community-readers.emulator.test.cjs`.
- Security Rules evaluation was attempted but not run because the configured
  Firebase CLI credentials require reauthentication.

## Ticket 04 operational notes

Reusable invitation rollout has an explicit migration gate. New community
documents are created with `activeInvitationId: null`. Invitation operations
fail with `InvitationMigrationRequired` when that field is absent, so an older
single-use Pending or Accepted invitation cannot become reusable by accident.

Before deploying these callables, an authorized operator must inventory every
existing `communities/{communityId}/invitations/{invitationId}` record and any
legacy digest lookup using trusted administrative tooling. For every community
created before Ticket 04:

1. Classify all legacy Pending, Accepted, Revoked, and Expired records; do not
   infer plaintext from a digest and do not treat Accepted as reusable.
2. Invalidate every legacy redeemable lookup and record an administrative audit
   timestamp outside member-readable data. Preserve an Accepted record as
   historical single-use evidence or revoke it under the reviewed retention
   policy; never rewrite it as invitation model version 2.
3. In the same controlled migration, set the community's `activeInvitationId` to
   `null`. Do not point it at a legacy record.
4. Verify callable-only Rules denial for invitation records, digest lookups, and
   actor-scoped Issue/Rotate/Revoke operation receipts. No new composite index
   is needed because digest resolution is an exact document lookup.
5. Provision the Secret Manager parameter `COMMUNITY_INVITATION_ENCRYPTION_KEYS`
   with a reviewed versioned JSON keyring containing real independently
   generated 32-byte keys, deploy the bound functions, and have Organizers
   deliberately issue new invitations.

Do not commit a key, `.secret.local`, secret output, plaintext invitation, or a
migration export. A local emulator may inject a test-only key through test
dependencies or an uncommitted `.secret.local`; production execution fails
closed when the secret is missing, malformed, or lacks a ciphertext's retained
key version. Key rotation adds a new key version and changes `activeVersion`
while retaining required old versions; invitation rotation remains a separate,
deliberate Organizer operation.

Rotation, revocation, and future acceptance must all transact against the
community's `activeInvitationId` and the pointed invitation. Future acceptance
must additionally recheck digest lookup, expiry using trusted time, Active
community state, and invitation model version 2 in the same membership
transaction. Expiry is never delegated to TTL cleanup. The Ticket 04 code does
not implement preview or acceptance and does not launch community invitations.

The exact callables, canonical DTOs, validation limits, reason codes, and secret
shape are recorded in `docs/community-api-contract.md`. No production secret,
migration, deployment, or `.secret.local` file was created. No Firestore index
is added because all new reads are direct document reads.

Checks run locally on 2026-09-14:

- Functions contract preparation and TypeScript build passed.
- Functions ESLint passed.
- `tests/community-invitation-contract.test.cjs` passed: 9 tests. The existing
  create-community and community-reader contract suites also passed: 11 tests.
- The repository-wide root TypeScript check was run and failed on pre-existing
  protected component and unrelated utility errors; it reported no Ticket 04
  file error.
- The Firestore emulator suite was not run because no Java runtime is installed.
  The suite is prepared in `tests/community-invitations.emulator.test.cjs`, and
  the existing reader emulator suite now includes the new direct-access denial
  paths.
- Security Rules evaluation was attempted but did not run because the configured
  Firebase CLI credentials require reauthentication.

## Ticket 05 operational notes

Ticket 05 exports `previewCommunityInvitation` and `acceptCommunityInvitation`
through the existing callable-only Functions boundary. Canonical DTOs and
reasons live in `src/types/community/community-function.types.ts`; the strictly
limited preview projection lives in
`src/types/community/community-invitation.types.ts`. Runtime request/result
validators remain in `src/features/communities/community-invitation.ts` and are
copied only by `scripts/prepare-functions.cjs`.

Preview requires an authenticated, email-verified, available account and returns
no identifier or group content: only name, purpose, safe Organizer preferred
name, optional participation expectations, trusted expiry, and an optional
public coordinated-journey summary. The invitation digest lookup, model version,
exact digest, expiry, Active lifecycle, community pointer, and Active community
are rechecked together. Invalid, expired, revoked, rotated, and closed cases use
one generic unavailable result to limit enumeration.

Acceptance requires explicit code, normalized public display name, and
actor-scoped operation ID. Its transaction rereads the same invitation authority
plus the current membership. It returns `Accepted`, `AlreadyMember`, or
`Rejoined`, denies Removed, and waits out Leaving. It writes matching
authoritative member and account-index records, one private
per-invitation/account redemption, and a private digest-bound operation receipt.
The submitted display name updates the existing preferred-name projection
atomically. No raw code is persisted or logged. No journey, enrollment,
progress-sharing consent, private writing, or practice state is read or created.

Preview and acceptance attempts use separate fixed ten-minute rate windows for
both actor and SHA-256 request-scope digest. Preview limits are 20 per actor and
40 per request scope; acceptance limits are 10 and 20. Malformed input consumes
an attempt before validation. Direct client access to rate records, acceptance
receipts, redemptions, memberships, and invitations remains denied. No new
composite index is required.

The optional coordinated-journey DTO validator is implemented, but there is no
canonical persisted current-public-schedule pointer or schedule operation in
this checkout. Preview omits the optional summary until its owning backend
ticket supplies that record; Ticket 05 does not invent schedule selection.

Checks run locally on 2026-09-14:

- Functions contract preparation and TypeScript build passed.
- Functions ESLint and scoped root ESLint passed.
- The invitation redemption, invitation administration, community reader, and
  create-community non-emulator suites passed: 28 tests total.
- Scoped Prettier formatting completed; a final scoped check is recorded at
  handoff.
- The repository-wide root TypeScript check was run and still fails in
  pre-existing protected shared components and unrelated utilities. One Ticket
  05 validator issue found by that check was corrected; the final output has no
  Ticket 05 file error.
- Firestore-emulator coverage for two-account redemption, repeated operations,
  existing/Left/Removed membership, no-journey accounts, membership count,
  accept-versus-revoke/rotate/close, rate limits, and no journey/consent side
  effects is prepared in `tests/community-invitations.emulator.test.cjs` but was
  not run because this machine has no Java runtime.
- Security Rules evaluation was attempted but did not run because the configured
  Firebase CLI credentials require reauthentication.
- No production configuration, migration, secret provisioning, deployment, or
  device check was performed.

## Ticket 18 operational notes

The callable-only owner contribution reader is `listOwnCommunityContributions`.
It uses the existing body-free post/reply author index and rereads the actual
community, post, and reply before returning the caller's own content or delete
metadata. Existing post/reply author deletion remains available after exit or
closure. `communityAuthUserDeleted` uses the supported first-generation
Authentication deletion event; `resumeCommunityCleanup` resumes bounded work.
Leave/removal queue support cleanup in the same transaction as membership
invalidation. Current membership and deletion-task checks deny shared access
before support or author bodies are physically removed. Closure leaves private
journeys untouched.

Rollout requires Firestore composite/collection-group indexes and the explicit
Rules denials, deployment of the first-generation Auth trigger and scheduler
under Node 22 (the prior Node 24 runtime does not support first-generation
functions), and monitoring for persistent cleanup tasks. Ordinary account
deletion must delete Auth users singly; bulk Admin `deleteUsers` does not fire
deletion events. No production cleanup, migration, deploy, or push was
performed. The task collections are backend-only and retain no written body.
Existing restricted member-removal evidence remains subject to the
administration policy; no new member-readable audit body is introduced.

Local checks on 2026-09-15: Functions contract preparation/build and Functions
ESLint passed; the existing 11 focused community contract tests and 2 new
owner-input/authentication tests passed. The prepared
`tests/community-ownership-cleanup.emulator.test.cjs` covers author listing and
deletion after exit/removal/closure, forged indexes, partial account cleanup,
orphaned Organizer closure, support cleanup, and private-journey preservation;
it was syntax-checked but not executed. A broader invitation-redemption suite
had one unrelated existing preview timestamp-shape assertion failure (20 of 21
combined tests passed). Firestore emulator transaction and Auth-trigger coverage
were not run because Java is unavailable. The configured Security Rules
evaluator did not run because Firebase CLI credentials require reauthentication.
Root `tsc --noEmit` remains failing in existing protected components and
unrelated utilities; it reported no Ticket 18 file error. Acceptance therefore
has local compile/contract evidence but lacks emulator, trigger, and Rules
execution evidence.

## Ticket 20 operational notes

The callable-only safety operations are `reportCommunityContent`,
`blockCommunityMember`, `unblockCommunityMember`, and
`listBlockedCommunityMembers`. Canonical report and block contracts live in
`src/types/community/community-moderation.types.ts` and
`src/types/community/community-block.types.ts`; validators are copied from
`src/features/communities/community-safety.ts` by
`scripts/prepare-functions.cjs`. Reports stay in restricted safety records even
when the named target is the Organizer. Block records and the saved identity for
Unblock are account-private. Membership and roster access are unchanged.

The post/reply readers now apply the reciprocal block relationship inside the
trusted Functions boundary and keep cursor scans bounded. Later notification
send/open operations must recheck blocks; no notification is sent by this
ticket. The deterministic submitted-text filter and fixed ten-minute rate
windows are first-pass safeguards, not a complete moderation system. Optional
`COMMUNITY_SAFETY_POST_LIMIT` and `COMMUNITY_SAFETY_REPORT_LIMIT` settings must
be validated at deployment. No private writing, personal practice, or journey
data is scanned or copied into safety records. No new Firestore composite index
or migration is required for the safety collections, but the added Rules denials
must be deployed with the Functions. Prompt 22 must separately provision
reviewer authority and decisions before anyone operates the review queue.

Before release, operators must establish an accessible support contact and
published community standards/Terms, a timely report-response process, trained
reviewer access, and participant-facing report/block controls.
[Apple guideline 1.2](https://developer.apple.com/app-store/review/guidelines/)
and
[Google Play's UGC policy](https://support.google.com/googleplay/android-developer/answer/9876937)
require filtering, reporting, blocking, and ongoing moderation; backend
compilation cannot establish compliance. No support address was found in the
current checkout and none was invented. Local build, lint, and 11 post/safety
non-emulator contract tests passed; Firestore emulator integration was attempted
but could not start without Java. Restricted Rules execution and deployment
evidence are still pending. The configured Rules evaluator could not reach
Google's API; root `tsc --noEmit` still fails in existing protected
components/utilities and reported no Ticket 20 file error.

## Ticket 22 operational notes

An authorized Firebase operator must provision and revoke reviewer access out of
band through Firebase Auth user custom claims. Preserve unrelated claims, set
only `communitySafetyReviewer: true` for a separately selected, trained
reviewer, and remove that property or set it false to revoke. Verify the user is
email-verified and enabled; do not grant a real account a claim merely to
exercise this checkout. Each review callable reads the current Auth user record,
so a stale client token or Organizer role does not retain access after
revocation. The reviewer has no community administration or personal-account
authority by virtue of this claim.

Operators need a staffed queue, published response/escalation process, and a
second independent reviewer for cases filed by or about a reviewer. Reports
about Organizers remain in the restricted platform queue rather than settings.
The workflow offers an expected-revision claim and resolves a Submitted or
claimant-owned UnderReview report through an expected-revision decision. Two
concurrent reviewers cannot silently replace one another. An UnderReview claim
expires for reassignment after one hour; takeover requires the latest report
revision and a currently authorized independent reviewer. Operators must watch
stalled claims and provision a second reviewer. A reported member who has become
Organizer requires escalation before removal; reviewers may choose NoAction or
CloseCommunity on a suitable report, but cannot use ordinary member removal to
break the organizer invariant. The role claim must not be granted via any
callable or client route.

Before production use, an operator must approve exact retention periods and a
restricted deletion procedure for submitted evidence, explanations, actions, and
review receipts, plus backup/access practices. No retention schedule or staffed
review service is established by this code. Restricted evidence must never be
exported into member readers or a private journal lookup. Deploy the Rules
denials with the Functions; Firestore's single-field status index serves the
queue without a new composite index. No existing report migration is needed for
Submitted prompt 20 records. Six Firestore emulator transaction cases and one
Auth/Firestore emulator Rules case passed using an existing bundled Java
runtime. The repository's separate 422-case remote Rules evaluator also passed.
Firebase project access was verified. The corrected deploy released Rules and
indexes, reported successful creation/update of all Functions, and a follow-up
inventory showed all four Ticket 22 callables Active under one deployed hash.
The Firebase CLI still exited 1 because the project has no `us-central1`
Artifact Registry cleanup policy; no policy was set by this ticket. Local
Functions build/lint and three Ticket 22 non-emulator tests passed.

### Ticket 25 operational notes — coordinated schedule backend

The checkout now has a callable-only current schedule, history reader,
organizer-only published-current-course option, organizer configure/revise, and
scheduled cancel. The currentCommunityJourneyId pointer on the community record
and firstEnrollmentAcceptedAt marker on the schedule are the transaction
coordination fields for Ticket 26 enrollment. Enrollment must read and update
those exact records in one transaction, set the marker when the first acceptance
commits, and never clear it after withdrawal. A cancellation clears the pointer
without ending any started personal journey; a new schedule uses a new ID. The
public closure/display boundary is the named start date in the community IANA
zone. Participant activation date and zone remain separate future work. The
current published-course configuration must be present in the deployed
environment. The existing single-field createdAt index supports history;
Firestore rejected an unnecessary composite during the first deploy attempt. No
community backfill is needed for records without a schedule pointer. An older
out-of-band schedule without the first-enrollment marker needs deliberate
migration. Local pure calendar/contract tests and Functions build/lint passed on
2026-09-15. Emulator transaction/Rules tests could not run without Java; remote
Rules API tests could not run without refreshed Firebase credentials. No
enrollment callable exists in this checkout, so enrollment races remain a Ticket
26 integration check. The root application type check still fails on unrelated
baseline errors; the new parser and changed community types report no errors.
The second Firebase attempt released the Rules and reported success for all six
new schedule callables and the invitation-preview update. The Function inventory
confirmed their presence as v2 Node 22 callables. The CLI exited 1 only on its
`us-central1` Artifact Registry cleanup-policy setup; no policy was changed.
Production callables and published-course configuration still need manual
smoke/configuration checks, and the enrollment integration needs Ticket 26.

### Ticket 26 operational notes — private participant enrollment

The backend now provides a current-user enrollment reader, enrollment
confirmation, and withdrawal through the trusted callable boundary. The
participant-private snapshot is stored at
`users/{userId}/communityJourneyEnrollments/{communityJourneyId}`. It contains
the confirmed starting zone, consent time, schedule/setup revisions, choices,
translation, and motivation head/source revision. The first acceptance freezes
the existing schedule marker in the same transaction. Membership alone never
enrolls, and this ticket does not create future personal journeys or Day 1
records. Withdrawal removes unstarted activation eligibility while preserving
private setup writing and unrelated journeys. Schedule and account records
created outside these contracts may require a deliberate migration; none is
performed here. Formation configuration must point to the scheduled published
course/version and released selected text edition with complete readings. Day 1
activation, automatic retry, monitoring, and participant conflict review remain
separate work. Local Functions build/lint and scoped Prettier checks passed.
Five focused enrollment/schedule contract and callable-auth tests, and 22
existing journey-start tests passed. The repository Rules API suite passed
492/492 cases, including owner and other-account denials for the new private
enrollment and receipt paths. Root Expo lint passed with seven existing
warnings. The root TypeScript check still fails on existing application errors
outside this ticket. The Firestore emulator transaction suite was written but
**not run** because this machine has no Java runtime. Firestore indexes are
unchanged: the reader uses a document lookup and enrollment uses the existing
Active-journey single-field query. Production callable smoke and formation
configuration checks remain pending. Compilation and Rules evaluation alone are
not production behavior evidence. The requested Firebase deploy released
`firestore.rules` and reported successful creation of all three Ticket 26 Node
22 v2 callables in `us-central1`. A subsequent inventory showed each Active. The
deploy CLI exited 1 only because the project has no Artifact Registry cleanup
policy in `us-central1`; this ticket did not set a billing or retention policy.
No authenticated production enrollment/withdrawal smoke was performed.

### Ticket 27 operational notes — due enrollment activation

The scheduled worker is exported as `activateDueCommunityJourneyEnrollments` and
runs every five minutes in UTC with one instance, four 20-record enrollment
pages and four 20-record schedule pages per invocation. Deployment must create
its Cloud Scheduler job and grant its runtime identity Firestore/Admin Auth
access. Confirm the two collection-group indexes and Rules deployment before
enabling activation. Verify that existing private enrollments include the Ticket
26 consent/zone/setup snapshot and that schedules retain their freeze marker;
incompatible records need a deliberate migration. Formation configuration must
pin the scheduled published course and released text edition for each selected
translation. No migration is performed here.

Monitor `communityJourneyActivationWorker/current.failedInLastRun`, scheduler
execution failures, and Enrolled records still due near participant-zone Day 1
end. A transient failure leaves the enrollment Enrolled, so a repeated worker
page or participant `retryCommunityJourneyActivation` can resume during Day 1. A
missed date becomes `StartBlocked/MissedStartDate` with the real block time; it
is not backdated. A dry run without writes is available through
`runDueCommunityJourneyBatch({ database }, true)` in a Firestore emulator or
controlled local Functions process. The dry-run count is the number of candidate
records scanned, including future Enrolled records, rather than the number that
would start. Emulator invocation and a seeded participant-zone DST/date matrix
are in `tests/community-journey-enrollment.emulator.test.cjs`.

The normal personal-start response shape remains unchanged. Both start paths
write the private journey, motivation head revision, account preference, and
journey-control marker through one shared trusted write set. The enrollment
transaction atomically changes the private lifecycle to Started or StartBlocked.
Public schedule reconciliation uses its own community-zone calendar and practice
totals do not influence completion. Membership exit or group closure never
mutates an already started private journey. The status reader adds one
server-instant calendar date in the community zone and the confirmed starting
zone, so callers can explain a displayed-day difference; the actual personal
journey continues to use its current phone-zone semantics.

Local Functions build and lint passed; 30 activation contract, calendar,
enrollment contract, schedule contract, and existing normal-start tests passed.
The added emulator transaction cases cover before start, DST day, missed day,
blocked eligibility, repeated batches, withdrawal/normal-start races, writing
retention, independent public completion, and private journey continuity, but
were **not run** because this machine has no Java runtime. Remote Rules API
evaluation was attempted but could not contact Firebase. The root TypeScript
check still fails on baseline component/utility errors, with no reported error
in the changed shared contract/parser files. Authenticated production retry,
activation, status, scheduler health, index and Rules smoke checks remain manual
verification steps.

The requested Firebase deploy released the Rules and both collection-group
single-field index controls, created `activateDueCommunityJourneyEnrollments`
and `retryCommunityJourneyActivation`, and updated
`getCommunityJourneyEnrollment` and `startJourney` in `us-central1`. A Function
inventory confirmed the scheduled and callable triggers. The CLI exited 1 only
at the Artifact Registry cleanup-policy step after the resources reported
success; no retention/billing policy was changed. Production scheduler
execution, account/content configuration, index readiness, and authenticated
activation/retry status remain unverified. No deployment result resolves the
unrun emulator transaction/Rules checks.

A follow-up worker/retry update uploaded the final persisted-data validation
fix, but the CLI produced no completion result over the wait and was
interrupted. A subsequent Function inventory listed both triggers with runtime
fields unavailable during update; a later inventory again showed Node 22 v2 and
256 MB for each. Verify the exact revised source hash and scheduler health
before relying on activation; this update is not a confirmed source revision.

### Ticket 31 operational notes

The approved progress backend adds four callable-only operations and private
owner preferences. It performs bounded live recomputation during reads; no
progress projection, monitor, analytics dependency, or migration was created.
The aggregate reader suppresses the entire result if even one roster member has
not opted in, lacks an authoritative Started link, or a nonzero stage cell has
fewer than five people. It caps the cohort at 50; larger groups receive the same
privacy-safe suppressed response. Owner revocation, leave/removal, and group
closure are enforced on each read without waiting for cleanup.

Deploy revised `firestore.rules` and the four callable exports only after the
existing production community/enrollment prerequisites are verified. No new
Firestore index or secret is required; the current Active-member join-time index
is reused. Local Functions build and lint and two non-emulator tests passed;
scoped formatting passed. Four Firestore-emulator cases were skipped because
Java is unavailable. The root TypeScript check has existing protected component
and utility errors. Root lint passed with seven existing warnings. The
configured remote Rules test was attempted but stopped on an expired Firebase
CLI login. Emulator transaction, security-rule, and authenticated production
behavior are unverified.

The requested Firebase deploy released the revised Rules and reported successful
creation of the four progress callables in `us-central1`; a Function inventory
also succeeded. The CLI exited 1 after resource success because it could not
establish an Artifact Registry cleanup policy. No retention or billing policy
was changed. Authenticated production progress behavior still requires manual
smoke testing.

### Ticket 33 operational notes — private in-app activity events

Ticket 33 adds text-free durable events to confirmed reply, first eligible
non-self prayer-support, and original organizer-announcement transactions. A
scheduled five-minute worker processes five pending events and one 20-member
page per event per run with transactional cursors and recipient-event
deduplication. Member join epochs, Active lifecycle, blocks, source
availability, and current authorization are checked during delivery and again
for recipient list/count/open/mark. Push and category controls are persisted for
optional future push delivery; they do not remove authorized in-app history and
default to disabled. No push provider, mobile interface, or deployment migration
was added.

The canonical contracts and validators are in
`src/types/community/community-notification.types.ts` and
`src/features/communities/community-notification.ts`; five account callables and
one scheduled worker are exported. `firestore.rules` denies direct client access
to the new records; `firestore.indexes.json` adds the reply-participation
composite. Firestore rejected a redundant notification-order composite because
the built-in single-field index covers the inbox query. The reply-participation
index must be ready before the worker processes reply events. The inbox recount
has a 1,000-record bound and reports an error instead of an inaccurate count
above that limit. This requires a later retention or scalable filtered-count
decision before very large inboxes are supported.

Local Functions build/lint, root lint, scoped Prettier, two parser/event-ID
tests, and the configured remote Rules test (552/552, including the new deny
paths) passed. Four Firestore/Auth emulator cases were prepared but skipped
because Java and emulator hosts are unavailable. The root type check still fails
on existing protected components and unrelated utilities. Emulator
authorization, transaction/race, partial-fan-out, and live Security Rules
behavior remain pending. No production smoke test or push-device check has run.

The requested `faithful-4325a` deployment released the revised Rules and
reply-participation index; a Firestore API check reported that index `READY`
before Functions were deployed. Firebase reported successful creation of all six
notification v2 Functions and successful updates of the three source callables.
A fresh Function inventory confirmed all nine. The Functions deploy CLI exited 1
solely because it could not set an Artifact Registry cleanup policy in
`us-central1`; no retention or billing policy was changed. Authenticated
production calls, Scheduler execution, and notification privacy behavior remain
manual checks. The ticket commit remains local because automatic approval review
rejected egress to the configured private GitHub remote.

A focused follow-up suppressed the outbox event when a prayer-request author
acknowledges their own request. Functions build/lint and the parser tests passed
after that change; its emulator case remains skipped. Firebase reported a
successful update of `setCommunityPrayerAcknowledgment`, then repeated the
Artifact Registry cleanup-policy error. No policy was changed.

### Ticket 35 operational notes — private push delivery

This ticket adds canonical installation and delivery contracts, exact request
validation, two account installation callables, a recipient-bound push-open
callable, private event-to-installation outbox tasks, `sendCommunityPushOutbox`
(every minute), and `checkCommunityPushReceipts` (every five minutes). The
sender and receipt jobs are exported Firebase v2 Scheduler functions with
`maxInstances: 1`, bounded pages, a durable Sending lease, bounded attempts, and
Expo ticket/receipt recording. In-app notification history is independent of OS
push permission. Leave, removal, closure, reciprocal blocks, source deletion,
account deletion, account rebinding, and token rotation are rechecked at send or
guarded at token retirement. No production push delivery is inferred from local
compilation.

Manual configuration before deploying the jobs: enable enhanced Expo push
security and configure EAS/APNs/FCM credentials for the installed build, set
`EXPO_PUSH_ACCESS_TOKEN` in Firebase Secret Manager without committing its
value, deploy the new deny Rules and delivery due-time index, wait for that
index to become READY, then deploy Functions/Scheduler. Verify authenticated
callable behavior, job permissions/execution, generic lock-screen wording,
receipt retrieval, token retirement, and app opening on real devices in each
environment. The current mobile checkout does not implement installation-secret
persistence, registration on token refresh/account switch/logout, or push-open
handling; those are frontend prerequisites for actual device delivery. Expo's
provider receipt indicates upstream handoff, not guaranteed device display.
Network ambiguity can produce duplicate alerts despite task deduplication.

The local Functions build/lint, root lint with existing warnings, scoped
formatting, and parser/payload/HTTPS-transport unit cases passed. The configured
read-only Rules API suite passed 572/572. The root type check still fails in
protected components and unrelated utilities, with no new push-file diagnostics.
Firestore/Auth emulator Functions and Rules cases were skipped because no Java
runtime/emulator hosts are available. Rules and indexes were deployed to
`faithful-4325a`; the new index was still `CREATING` on the first inventory.
`EXPO_PUSH_ACCESS_TOKEN` was absent from Secret Manager, so sender and receipt
jobs were not deployed. No live provider, Scheduler, credential, production
callable, or device check ran for Ticket 35.

### Ticket 39 operational notes — backend audit

The existing callable-only Firestore reader and writer boundary was retained.
Invalid notification cursor timestamp parts return `InvalidCursor` before query
construction. Invitation preview expiry is a canonical plain timestamp. Prompt
40 should check timestamp method assumptions and handle `AccountUnavailable` on
all community callables. Every community callable now fetches the current Auth
user and checks account availability, verification, and session revocation
before running its existing operation guard; Auth lookup outages return
`unavailable` with `AccountUnavailable` rather than granting access. The real
callable test first reproduced disabled-account and revoked-session access with
old tokens, then passed after both corrections. Safety reviewer capability still
requires its separately provisioned and currently valid Auth claim. The session
check compares Firebase's `tokensValidAfterTime` to the presented token's
`auth_time`, following the platform's timestamp granularity.

OpenJDK 21 is locally available at `/opt/homebrew/opt/openjdk@21/bin/java`.
Using the demo project `demo-faithful-ticket39`, the final Auth/Firestore/
Functions emulator suite passed 88/88. It covers real Auth-token callable access
for organizer, member, future member, Left, Removed, outsider, unverified,
disabled, deleted, revoked session, and separate safety reviewer; forged fields;
private writing isolation; direct Firestore Rules; invitation issue/rotate/
revoke/accept/close races; journey enrollment/activation/start conflicts;
operation retry payload mismatch; safety review revisions; progress projection
revocation; and notification/push suppression after exits and blocks. The real
HTTP regression additionally sends a disabled token to all 60 current community
callable names and checks HTTP 403 with `AccountUnavailable`. During that sweep,
the emulator attempted to resolve `COMMUNITY_INVITATION_ENCRYPTION_KEYS` from
Secret Manager in the demo project and received 403; successful authorized
secret-bound calls were **not run**. Five existing emulator cases were corrected
for project-ID, test isolation, package resolution, or an incorrect
cancel-after-enroll race expectation. Functions build and lint passed; the
focused non-emulator backend and personal journey tests passed 77/77. Root lint
passed with seven existing warnings. Root type check still has unrelated
protected-component errors. The configured remote Rules API check did not run
successfully because saved credentials were invalid. The Functions emulator
required the CLI discovery timeout override after two startup-only failures; the
final 88-case run used that override and passed.

Production secret binding, live Auth-state behavior, Scheduler execution, push
provider delivery, device checks, and production Rules/index deployment remain
**not run**. No data migration, production secret, reviewer grant, deployment,
or production write was performed in Ticket 39. The local emulator suite does
not establish release readiness.

### Ticket 40 — integration-test results

Local run on 2026-09-15 used only `demo-faithful-ticket40` with local Auth,
Firestore, and Functions emulators. `tests/run-community-workflow.ticket40.cjs`
creates a temporary synthetic invitation encryption key and refuses to overwrite
an existing secret override. The workflow test refuses non-demo projects and
non-local emulator hosts. Its accounts and text are synthetic. There was no
production access, deployment, or device session.

Workflow status (real callable / other automated / manual or device):

- Create, issue/retrieve, preview, join B/C/E, member reads, outsider denial,
  remove E and deny the removed member: **pass / pass / not run**. Actual
  Auth-token Functions responses passed the invitation and reader runtime
  parsers.
- Rotate, revoke, expire: **partial pass / pass / not run**. Real revocation and
  old-code rejection passed; real rotation and expiry were not run. The
  controlled-clock backend cases passed.
- All post types, replies, and prayer state: **fail / pass / not run**. A real
  shared-copy creation returned noncanonical `createdAt`; full real HTTP thread
  paths were not run. Existing backend and fixture-based screen cases passed.
- Private Reflect, edit/publish shared copy, independent edits and deletion:
  **not run / pass / not run**. Backend isolation and contribution cleanup
  passed, but the post response blocks the frontend publication path.
- Administration, exit, and owner deletion: **partial pass / pass / not run**.
  Real E removal and access denial passed; transfer, leave, close, and owner
  deletion were not run as one real HTTP workflow. Backend administration,
  races, cleanup, and Auth deletion passed.
- Report, independent review, enforcement, block/unblock: **not run / pass / not
  run**. Backend safety, current reviewer-claim denial, blocking, and Rules
  cases passed.
- Schedule, enroll, activate, and 77-day/DST/start-window: **not run / pass /
  not run**. Controlled-clock backend cases passed.
- Progress consent, revocation, suppression: **not run / pass / not run**.
  Backend progress and suppression cases passed.
- Inbox, preferences, authorized target, push: **not run / pass / not run**.
  Backend inbox, preference, suppression, push-task, and Rules cases passed;
  Expo or device delivery was not run.
- Offline, account switch, stale results, drafts, double taps, loading/error,
  and accessibility semantics: **not run / pass / not run**. The 242 focused
  Jest screen/service cases use fixtures, not a device session.

The existing backend emulator suite passed 88/88; the added real-callable
workflow failed 1/1, so the combined run was 88 pass and 1 fail. The failure is
reproducible with
`JAVA_HOME=/opt/homebrew/opt/openjdk@21 node tests/run-community-workflow.ticket40.cjs`.
The frontend `createCommunityPost` parser in `community-post.service.ts` reads
`seconds` and `nanoseconds` and rejects the actual response. The backend must
project a plain persisted timestamp before this workflow can pass. No
client-side permission or timestamp workaround was added. The
disabled/deleted/revoked Auth-token matrix, Rules boundaries, cursor and
payload-mismatch cases remain covered by the passing existing emulator suite,
but this is not an automated device UI run.

Manual iOS and Android walkthrough, all **not run**:

- [ ] Create an invite, share with the native share sheet, and open it through
      secure continuation after sign-in or an account switch.
- [ ] Join, rotate, expire, revoke, and re-enter; refresh a focused screen after
      permission and membership changes.
- [ ] Compose each post type; edit and delete a deliberately shared reflection
      copy while the private source remains private.
- [ ] Test keyboard dismissal, back navigation, and a dirty draft; verify
      loading, uncertain success, and double-tap behavior.
- [ ] Transfer organizer, remove a member, leave, close, and review an organizer
      report with an independent reviewer.
- [ ] Enroll in and withdraw from a schedule; grant and revoke progress consent.
- [ ] Open inbox and notification taps to a still-authorized target; exercise
      native push permission and preferences.
- [ ] Repeat at large text sizes with VoiceOver on iOS and TalkBack on Android,
      checking labels, focus order, and touch targets.

The repository root lint completed with seven existing warnings; scoped test
file lint and Prettier checks passed. Root `tsc --noEmit` failed in protected
components and unrelated utilities as previously documented. There are no
demonstrated frontend fixes in this ticket because the first integration defect
is a backend response projection outside its edit scope. Acceptance criteria are
**not met** until that contract is fixed, the remaining real workflows are
exercised, and the manual/device walkthrough is completed.
