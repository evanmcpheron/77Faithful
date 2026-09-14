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
while every read reauthorizes against the community-owned Active membership.
Removed remains distinct from Left so invitation acceptance continues to deny
Removed and permit a later explicit Left rejoin. Removal reasons are restricted
administrative data and are absent from memberships, member lists, and public
responses. Retry receipts retain only a digest of the reason rather than a
second plaintext copy.

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
