# Community API contract ledger

## Ledger status

This ledger separates implemented operations observed in the checkout from the
approved operations that future backend tickets will register. It does not turn
existing TypeScript interfaces, route files, or planned workflows into
endpoints.

Inspection date: 2026-09-14. Original reviewed SHA (the documentation review
tree recorded by the manifest): `943ea3390312af0f766e45cffd352cc640203fe0`.
Actual local `HEAD`: `b349cf0df67292db4e9f24dc8db6bd5ff3d52040`.

Contract rules:

- A backend ticket owns an operation's exported name, transport, runtime parser,
  canonical request/result type, stable error categories, authorization checks,
  idempotency behavior, and tests.
- Add an operation to the adopted ledger only when that backend contract is
  implemented or explicitly established by its owning ticket.
- Frontend tickets consume registered canonical types and real services. They do
  not invent screen-local DTOs, alternate endpoint names, mocks that imply
  success, or direct Firestore writes that bypass trusted invariants.
- Shared contracts under `src/types/**` remain the source of truth where they
  are compatible. An interface's presence is not endpoint registration.
- Every operation rechecks authoritative identity and access. Cached membership,
  role, invitation, progress consent, block, or notification state is not proof.

## Adopted operation ledger

| Operation              | Transport         | Canonical request              | Canonical result                                            | Authorization and lifecycle                                                                                                                                                                                                                                                                       | Idempotency/errors                                                                                                                                                                                                                                  | Evidence                                                                                                                                                                                                                 |
| ---------------------- | ----------------- | ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getCommunityContext`  | Firebase callable | `IGetCommunityContextRequest`  | `IGetCommunityContextResult` containing `ICommunityContext` | Authenticated, email-verified, available account plus the authoritative active `communities/{communityId}/members/{uid}` record. Closed communities remain readable to retained active members. Organizer capabilities require both the Organizer membership role and matching `organizerUserId`. | Read-only. Rejects unexpected fields. Reasons: `AuthenticationRequired`, `EmailVerificationRequired`, `InvalidInput`, `AccountUnavailable`, `CommunityUnavailable`.                                                                                 | Export and implementation in `functions/src/community/read-community-context.ts`; contract tests in `tests/community-reader-contract.test.cjs`; emulator matrix prepared in `tests/community-readers.emulator.test.cjs`. |
| `listCommunityPage`    | Firebase callable | `IListCommunitiesPageRequest`  | `IListCommunitiesPageResult`                                | Authenticated, email-verified, available account. The account membership index is discovery-only; every returned community is reauthorized against its authoritative active member record.                                                                                                        | Read-only. Default page size 20, maximum 50; cursor maximum 512 characters. V1 opaque cursor is scoped to the caller and operation and orders by `joinedAt` ascending, then membership document ID ascending. Reasons also include `InvalidCursor`. | Export and implementation in `functions/src/community/read-community-context.ts`; parser/unit tests and prepared emulator stale-index/pagination coverage.                                                               |
| `listCommunityMembers` | Firebase callable | `IListCommunityMembersRequest` | `IListCommunityMembersResult`                               | Authenticated, email-verified, available account and authoritative active membership in the requested community. Active members only. Closed archives remain readable. Returned roles are derived against `organizerUserId`; a stored Organizer role alone grants no capability.                  | Read-only. Default page size 20, maximum 50; cursor maximum 512 characters. V1 opaque cursor is scoped to the community and operation and orders by `joinedAt` ascending, then member document ID ascending. Reasons also include `InvalidCursor`.  | Export and implementation in `functions/src/community/read-community-context.ts`; parser/unit tests and prepared emulator role, lifecycle, profile, cross-community, and cursor coverage.                                |

Ticket 01 uses `CommunityReaderLimits.memberCount = 500`. Context returns an
explicit `{ value, isExact }` active-member count, capped at that value. Reader
responses explicitly construct only community summary, current active
membership, capabilities, count, and member summary fields. A missing profile
projects an empty display name and never falls back to email or contact data.
Existing `createCommunity`, `getCommunity`, and `listCommunities` response
shapes remain unchanged.

The three operations require deployment of the composite indexes in
`firestore.indexes.json` and the callable-only denial boundary in
`firestore.rules`. No record migration or new secret is required: current
membership records already carry `joinedAt`, and display names continue to be
resolved safely from profiles so pre-snapshot Organizer memberships work without
backfill. Cursors are traversal positions, not authorization evidence; every
page reauthorizes current membership.

### Ticket 04 — reusable invitation administration

| Operation                       | Transport         | Canonical request                       | Canonical result                       | Authorization and lifecycle                                                                                                                                                                      | Idempotency/errors                                                                                                                                                  | Evidence                                                                                                                                                                            |
| ------------------------------- | ----------------- | --------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issueCommunityInvitation`      | Firebase callable | `IIssueCommunityInvitationRequest`      | `IIssueCommunityInvitationResult`      | Authenticated, email-verified, available current Organizer of an Active community. Returns the current usable invitation, or atomically issues a new 30-day invitation when none is usable.      | Mutation `operationId` is scoped to actor and Issue. Same payload recovers the encrypted invitation; changed payload is rejected.                                   | Export and implementation in `functions/src/community/community-invitation.ts`; contract/crypto tests and prepared Firestore-emulator transaction tests.                            |
| `getCurrentCommunityInvitation` | Firebase callable | `IGetCurrentCommunityInvitationRequest` | `IGetCurrentCommunityInvitationResult` | Same current-Organizer authorization. Read-only and does not extend expiry. Returns `invitation: null` for no pointer, expiry at or before trusted server time, or a recognized revoked state.   | No operation ID because it is read-only. Decryption revalidates authenticated ciphertext, context, canonical code form, and digest.                                 | Export and implementation in `functions/src/community/community-invitation.ts`; contract/crypto tests and prepared Firestore-emulator stable-read, expiry, and authorization tests. |
| `rotateCommunityInvitation`     | Firebase callable | `IRotateCommunityInvitationRequest`     | `IRotateCommunityInvitationResult`     | Same current-Organizer authorization. Atomically revokes the pointed invitation, removes its digest lookup, installs one new invitation pointer, and leaves existing members unchanged.          | Mutation `operationId` is scoped to actor and Rotate. Same-payload replay recovers the same still-usable encrypted code; payload mismatch is rejected.              | Export and implementation in `functions/src/community/community-invitation.ts`; prepared Firestore-emulator retry and contention tests.                                             |
| `revokeCommunityInvitation`     | Firebase callable | `IRevokeCommunityInvitationRequest`     | `IRevokeCommunityInvitationResult`     | Same current-Organizer authorization. The request names the expected current `invitationId`; revocation atomically clears the pointer and digest lookup and does not affect existing membership. | Mutation `operationId` is scoped to actor and Revoke. Same-payload replay returns the stored text-free receipt; a stale invitation or payload mismatch is rejected. | Export and implementation in `functions/src/community/community-invitation.ts`; prepared Firestore-emulator retry, membership, and contention tests.                                |

Invitation request limits are 128 characters for community, invitation, and
operation identifiers, using only ASCII letters, digits, underscore, and hyphen.
The canonical code has 20 characters in four five-character groups, uses
`23456789ABCDEFGHJKMNPQRSTUVWXYZ`, and therefore carries more than 99 bits of
randomness. Input normalization accepts either the exact grouped form or the
ungrouped form, case-insensitively; whitespace, misplaced separators, ambiguous
characters, illegal characters, and oversized input are rejected. These four
operations have no list cursor.

Stable reason codes are `AuthenticationRequired`, `EmailVerificationRequired`,
`InvalidInput`, `AccountUnavailable`, `CommunityUnavailable`,
`OrganizerRequired`, `CommunityClosed`, `InvitationUnavailable`,
`InvitationMigrationRequired`, `InvitationConfigurationUnavailable`,
`InvitationDataUnavailable`, and `OperationPayloadMismatch`. Authorization and
Active-community state are rechecked before any operation receipt is replayed,
so ownership transfer, membership changes, and closure take effect on retries.

The canonical persisted lifecycle is reusable `Active`, `Revoked`, or `Expired`.
Acceptance is a separate per-member redemption and never changes the whole
invitation to Accepted. The private invitation document carries a SHA-256 digest
and AES-256-GCM ciphertext with a fresh 96-bit nonce, 128-bit authentication
tag, authenticated community/invitation/key-version context, and key-version
metadata. `communityInvitationDigests/{digest}` is an exact private lookup; no
composite Firestore index is required. Community summaries explicitly omit
`activeInvitationId`, invitation metadata, digests, and ciphertext.

The required Secret Manager parameter is `COMMUNITY_INVITATION_ENCRYPTION_KEYS`.
Its value is JSON with exactly `activeVersion` and `keys`, where `keys` maps
each retained version name to a canonical Base64 encoding of exactly 32
cryptographically random bytes, for example the shape
`{"activeVersion":"v1","keys":{"v1":"<base64-encoded 32-byte key>"}}`. The
placeholder is not a key and must not be provisioned. Issue, retrieve, and
rotate bind the secret; revoke does not. Provision with
`firebase functions:secrets:set COMMUNITY_INVITATION_ENCRYPTION_KEYS`, then
deploy only after the migration gate in `docs/community-implementation-plan.md`
is complete. Retain old key versions until every invitation encrypted under them
has expired or been revoked and the corresponding functions have been
redeployed.

No production secret, deployment, or migration was performed. Local Functions
build and lint and the non-emulator invitation contract/cryptography tests pass.
The root TypeScript check remains blocked by pre-existing errors in protected
shared components and unrelated utilities. The configured Security Rules test
was attempted but did not run because the existing Firebase login requires
reauthentication. Firestore-emulator tests are prepared in
`tests/community-invitations.emulator.test.cjs`; they were not run because this
machine has no Java runtime.

### Ticket 05 — invitation preview and membership acceptance

| Operation                    | Transport         | Canonical request                    | Canonical result                    | Authorization and lifecycle                                                                                                                                                                                                                             | Idempotency/errors                                                                                                                                                                                                                | Evidence                                                                                                                                                                                     |
| ---------------------------- | ----------------- | ------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `previewCommunityInvitation` | Firebase callable | `IPreviewCommunityInvitationRequest` | `IPreviewCommunityInvitationResult` | Authenticated, email-verified, available account. Exact digest resolution must match a model-version-2 Active invitation, its current community pointer, its expiry after trusted time, and an Active community. No membership is required for preview. | Read-only apart from rate-limit accounting. Invalid, missing, expired, revoked, rotated, and closed invitations use the generic `InvitationUnavailable` reason after syntactically invalid input is rejected as `InvalidInput`.   | Export and implementation in `functions/src/community/community-invitation-redemption.ts`; contract tests in `tests/community-invitation-redemption.test.cjs`; emulator cases prepared.      |
| `acceptCommunityInvitation`  | Firebase callable | `IAcceptCommunityInvitationRequest`  | `IAcceptCommunityInvitationResult`  | Same invitation checks, plus server-derived caller identity and authoritative membership lifecycle. Active returns `AlreadyMember`; missing returns `Accepted`; Left returns `Rejoined`; Leaving is unavailable; Removed is denied.                     | `operationId` is scoped to actor and Accept and binds the invitation digest plus normalized display name. Replays recheck the live invitation, community, and membership. A different payload returns `OperationPayloadMismatch`. | Export and implementation in `functions/src/community/community-invitation-redemption.ts`; unit retry/privacy tests pass; Firestore-emulator acceptance and invalidation races are prepared. |

Preview input is one `invitationCode`. Acceptance input is exactly
`invitationCode`, `displayName`, and `operationId`; caller-supplied account ID,
role, lifecycle, `createdAt`, or `joinedAt` fields are rejected. Codes retain
Ticket 04's 20-character normalized and 23-character grouped limits.
`displayName` is trimmed, required, limited to 80 characters, and rejects ASCII
control characters. Operation IDs retain the 128-character identifier limit.
Neither operation has a cursor.

The preview projection contains only `communityName`, `communityPurpose`,
`organizerDisplayName`, optional `participationExpectations`, `expiresAt`, and
an optional canonical public coordinated-journey summary. It contains no
community or invitation identifier, code, digest, contact data, member list,
post, enrollment, notification, or private participant state. The Organizer name
and accepted member name use the adopted `users/{uid}.preferredName` projection;
acceptance atomically updates that profile field and revision to the explicitly
submitted public name when it differs.

Acceptance transacts against the digest lookup, community pointer and lifecycle,
invitation lifecycle and expiry, caller membership, per-account membership
index, per-invitation/account redemption, and actor-scoped operation receipt.
The authoritative member and discovery-index documents receive the same Active
membership body. Rejoin replaces `joinedAt` with trusted acceptance time while
preserving `createdAt`; an active member preserves both. A private
`communities/{communityId}/invitations/{invitationId}/redemptions/{uid}` record
is created once, and the operation receipt stores only digest/name matching
metadata and identifiers, never the raw code. Acceptance creates no journey,
enrollment, progress consent, writing reference, or practice state.

Both operations consume a server-side fixed ten-minute attempt window before
input parsing. Preview permits 20 attempts per actor and 40 per hashed request
scope; acceptance permits 10 per actor and 20 per hashed request scope. Only a
SHA-256 request-scope digest is persisted under `communityInvitationRateLimits`;
raw network addresses and codes are not stored. Exhaustion returns
`RateLimited`. Additional stable reasons introduced for this ticket are
`MembershipRemoved` and `MembershipUnavailable`; the existing authentication,
verification, account, invitation-data, and operation reasons remain applicable.

No new Firestore composite index is required: all acceptance reads are exact
document reads and the existing member readers continue to use Ticket 01's
indexes. Updated Rules explicitly deny direct client access to acceptance
receipts and rate-limit records; redemption records remain under the existing
deny-all `communities/**` boundary. Deployment still requires Ticket 04's
invitation migration and encryption-secret configuration. No migration, secret
provisioning, deployment, or launch was performed.

The shared optional coordinated-journey response type and runtime validator are
ready, but this checkout has no canonical persisted current-public-schedule
pointer or implemented scheduling operation. Preview therefore omits that
optional field until the schedule-owning ticket establishes and populates that
contract; Ticket 05 does not guess a collection or select among schedules.

### Ticket 09 — membership lifecycle, ownership, settings, and closure

| Exported operation           | Canonical request / result                                                 | Authorization and transaction behavior                                                                                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateCommunity`            | `IUpdateCommunityRequest` / `IUpdateCommunityResult`                       | The current active Organizer of an Active community may replace name, purpose, and participation expectations at `expectedRevision`. The transaction increments the community revision and returns the canonical summary.                                                                                  |
| `leaveCommunity`             | `ILeaveCommunityRequest` / `ILeaveCommunityResult`                         | An active member may leave an Active or Closed community. The current Organizer cannot leave an Active community; transfer or closure is required first. The authoritative membership and account discovery index become Left atomically.                                                                  |
| `removeCommunityMember`      | `IRemoveCommunityMemberRequest` / `IRemoveCommunityMemberResult`           | The current active Organizer of an Active community may remove an active Member, never the current Organizer. The authoritative membership and account discovery index become Removed atomically. The reason is stored only in restricted administration records and is never projected by member readers. |
| `transferCommunityOrganizer` | `ITransferCommunityOrganizerRequest` / `ITransferCommunityOrganizerResult` | The current active Organizer of an Active community may transfer to one active Member at `expectedRevision`. Community ownership, both community memberships, and both account indexes change in one transaction; the former Organizer is immediately denied invitation administration.                    |
| `closeCommunity`             | `ICloseCommunityRequest` / `ICloseCommunityResult`                         | The current active Organizer may terminally close an Active community at `expectedRevision`. The community becomes Closed, its invitation pointer is cleared, and a pointed active reusable invitation and digest are revoked in the same transaction. There is no reopen operation.                       |

Every mutation requires an actor-scoped `operationId` of 1–128 identifier
characters. Retry receipts live in operation-specific private account
subcollections; payload reuse with different normalized input returns
`OperationPayloadMismatch`. Authorization and lifecycle are reread inside every
transaction, including receipt replays. A successful transfer therefore cannot
be replayed by the former Organizer. Leave replay is available only while the
same caller-owned membership remains the matching Left result; close replay
requires the same retained Organizer authority in the Closed archive.

Community IDs, member IDs, and operation IDs are limited to 128 characters and
the existing safe identifier alphabet. Update text reuses the creation limits:
name 100 characters and required, purpose 2,000 characters, and optional
participation expectations 2,000 characters. A private removal reason is
required and limited to 1,000 characters. Text is trimmed and rejects ASCII
control characters. Revisions are integers from zero through 2,147,483,646.
Unexpected fields, caller-owned roles, identities, timestamps, and lifecycle
values are rejected.

Stable administration reasons are `AuthenticationRequired`,
`EmailVerificationRequired`, `InvalidInput`, `AccountUnavailable`,
`CommunityUnavailable`, `CommunityClosed`, `OrganizerRequired`,
`MemberUnavailable`, `OrganizerTransferRequired`, `RevisionConflict`,
`OperationPayloadMismatch`, and `AdministrationDataUnavailable`. Closed
community invitation acceptance retains the deliberately non-enumerating
`InvitationUnavailable` result.

Existing `getCommunityContext` remains the safe discoverable permission
projection. Its authorized response includes the authoritative community
revision needed for revision-checked administration, plus authoritative role and
`canManageMembers`, `canEditCommunity`, `canCloseCommunity`, and
`canLeaveCommunity` distinguish member, Organizer, and Closed archive behavior.
Closed archives remain readable by retained active members; mutation and invite
capabilities are false and leaving remains true. Leaving or removal immediately
removes the caller from all current-member readers because those readers recheck
the authoritative Active membership rather than trusting the account index.

No new composite index is required for these exact-document transactions; the
existing active-membership indexes continue to support member and community
lists. Rules explicitly deny direct access to all new operation receipts, and
the existing `communities/**` denial covers removal records. This checkout has
no post, reply, acknowledgment, notification, progress, coordinated-enrollment,
activation, or account-deletion Function to amend. Those later services must
recheck Active community and membership state; Closed is already authoritative
immediately and cannot be treated as awaiting cleanup. Closure does not query,
write, cancel, or reschedule any private journey.

Implementation and exports are in
`functions/src/community/community-administration.ts` and
`functions/src/index.ts`. Canonical contracts are in the authorized community
type files; runtime validators are copied from
`src/features/communities/community-administration.ts` by
`scripts/prepare-functions.cjs`. Unit/contract coverage is in
`tests/community-administration.test.cjs`; transaction, concurrency, archive,
index, invitation-authority, and private-journey coverage is prepared in
`tests/community-administration.emulator.test.cjs`. On 2026-09-14, Functions
lint/build, 31 focused non-emulator community tests, 96 existing community Jest
tests, and 262 authenticated Security Rules cases passed. The Firestore emulator
suite was not run because no Java runtime is installed. Firestore Rules and
indexes were deployed to `faithful-4325a`; all five administration callables
were created in `us-central1` on Node.js 24 and verified by the deployed
Functions inventory. The deploy command reported a final non-resource error
because Artifact Registry has no container-image cleanup policy; the deployed
resources themselves reported success. No cleanup retention policy was set.

### Ticket 12 — explicit community posts and chronological readers

| Exported operation    | Canonical request / result                                   | Authorization and transaction behavior                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createCommunityPost` | `ICreateCommunityPostRequest` / `ICreateCommunityPostResult` | A current active member of an Active community may create PrayerRequest, Discussion, or SharedReflectionCopy. Only the current active Organizer may create OrganizerAnnouncement. Identity, author display name, timestamps, and revision are server-derived. |
| `getCommunityPost`    | `IGetCommunityPostRequest` / `IGetCommunityPostResult`       | A current active member may read one post in an Active or Closed community. The post must belong to the named community. Published projections contain submitted content; tombstones contain no text.                                                         |
| `listCommunityPosts`  | `IListCommunityPostsRequest` / `IListCommunityPostsResult`   | A current active member may read chronological history in an Active or Closed community, including posts created before joining. Results order by `createdAt` descending then post ID descending.                                                             |
| `editCommunityPost`   | `IEditCommunityPostRequest` / `IEditCommunityPostResult`     | The current active author may replace only the text of a published post in an Active community at `expectedRevision`. Type, audience, prayer state, and author remain immutable. Announcement edits additionally require current Organizer authority.         |
| `deleteCommunityPost` | `IDeleteCommunityPostRequest` / `IDeleteCommunityPostResult` | The authenticated author may replace a published body with an AuthorDeleted tombstone at `expectedRevision`, including after leaving/removal or community closure. This owner action grants no feed or detail access after membership ends.                   |

Community IDs, post IDs, and operation IDs use the existing 1–128 character safe
identifier alphabet. Submitted text is trimmed, required, rejects ASCII control
characters, and is limited to 10,000 characters. Creation accepts exactly one
canonical content shape. PrayerRequest begins at `Current`; Discussion,
OrganizerAnnouncement, and SharedReflectionCopy accept only `postType` and
`text`. Unexpected journey, day, writing, source revision, caller-authored
identity, lifecycle, or audience fields are rejected.

Feed pages default to 20 and allow 1–50 records. The opaque cursor is limited to
512 base64url characters and binds version, operation kind, community ID,
created timestamp, and post ID. Malformed and cross-community cursors return
`InvalidCursor`. The safe `ICommunityPost` projection includes community/post
identity, author display name, created/updated/edited timestamps, publication
status/type, revision, and actual content only while Published.

Create, edit, and delete require actor-and-operation-scoped idempotency IDs.
Private receipts store a SHA-256 digest of the normalized request and body-free
result metadata; payload reuse returns `OperationPayloadMismatch`. Every retry
rereads current account, community, membership/role where applicable, author,
and post lifecycle. Revisions conflict with `RevisionConflict`. Stable reasons
are `AuthenticationRequired`, `EmailVerificationRequired`, `InvalidInput`,
`InvalidCursor`, `AccountUnavailable`, `CommunityUnavailable`,
`CommunityClosed`, `MembershipUnavailable`, `OrganizerRequired`,
`PostUnavailable`, `PostAuthorRequired`, `RevisionConflict`,
`OperationPayloadMismatch`, and `PostDataUnavailable`.

Posts persist under `communities/{communityId}/posts/{postId}`. A body-free
backend-only author index under
`users/{userId}/communityPostContributions/{digest}` stores only identity, post
type/status, and timestamps so a later owner-contribution reader can be
implemented without group access. Creation and deletion update the post, author
index, and retry receipt in one transaction. No body is copied to the index,
receipt, counter, preview, or revision history. Existing callable-only Rules
deny direct access to posts; explicit denies cover the author index and
post-operation receipts. The feed and per-author index use built-in single-field
ordering, so no composite Firestore index or data migration is required.

Implementation and exports are in `functions/src/community/community-post.ts`
and `functions/src/index.ts`. Canonical contracts are in the authorized post
type files, and request validators in
`src/features/communities/community-post.ts` are copied through
`scripts/prepare-functions.cjs`. Contract coverage is in
`tests/community-post-contract.test.cjs`; transaction, role, archive,
pagination, tombstone, and private-separation coverage is prepared in
`tests/community-posts.emulator.test.cjs`.

## Currently implemented operations (not adopted future ledger entries)

These names exist in this checkout and may be retained, revised, or superseded
by the backend ticket that owns the broader contract. Their presence does not
imply that the community workflow is complete or deployed.

| Exported operation | Client service                                         | Current request/result                                           | Observed enforcement                                                                                                                                                 | Current evidence                                                                             |
| ------------------ | ------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `createCommunity`  | `src/features/communities/create-community.service.ts` | `ICreateCommunityRequest` / `ICreateCommunityResult`             | Callable requires authentication and verified email; transaction requires profile, uses `operationId`, creates community plus Organizer membership and account index | Function exported from `functions/src/index.ts`; client parser/service and local tests exist |
| `getCommunity`     | `src/features/communities/community-reader.service.ts` | Inline `{ communityId }` request / `ICommunitySummary` result    | Callable requires authentication, verified email, account profile, and active membership in the community-owned member record                                        | Function exported; client parser/service and local tests exist                               |
| `listCommunities`  | `src/features/communities/community-reader.service.ts` | No caller identity or meaningful payload / `ICommunitySummary[]` | Callable requires authentication, verified email, account profile, active account-index entry, and matching active community membership                              | Function exported; client parser/service and local tests exist                               |

Current Firestore rules do not grant direct client access to `communities/**`.
Current functions use the Admin SDK. No invitation, acceptance, member admin,
post/reply, prayer acknowledgment, owner contribution, community journey,
progress, notification, blocking, reporting, or safety-review callable is
exported.

Ticket 01 makes that callable-only boundary explicit for communities and their
nested records, account membership indexes, and community-creation retry
records. It does not open a direct client read or write path.

## Required capability backlog (names and DTOs deliberately unassigned)

The ledger must eventually cover these capabilities without treating the labels
below as endpoint names:

- Retrieve/create the one active reusable invitation; rotate/revoke it; resolve
  a verified preview; explicitly accept it with Left-versus-Removed enforcement.
- List members; update details and participation expectations; remove a member;
  transfer ownership; leave; close permanently.
- List chronological posts; create/edit/delete posts; list/create/edit/delete
  replies; transition prayer-request state; set/unset one idempotent prayer
  acknowledgment.
- Preview and submit a reflection copy to exactly one community, with no private
  source reference and no Reflect-completion side effect.
- List and delete the caller's own shared contributions after loss of group-read
  access.
- Create/cancel a coordinated schedule; enroll/withdraw; freeze after first
  accepted enrollment; perform idempotent participant-zone Day 1 activation;
  read participant-visible blocked status.
- Set independent progress consents; read permitted individual stages; read only
  thresholded and complementary-suppressed aggregates.
- Read/update per-community notification controls; list/mark private in-app
  notifications; register/unregister optional push delivery without sensitive
  payloads.
- Block/unblock a member; submit a report; allow separately provisioned
  reviewers to list assigned queue items, read restricted detail, and record
  audited decisions.

Prerequisite shared-contract gaps are recorded in
`docs/community-implementation-plan.md`. In particular, current invitation
contracts are single-use/return-once, enrollment lacks the confirmed participant
zone, and several capabilities have no canonical contract. Frontend work must
wait for the owning contract rather than filling these gaps locally.

## Route inventory from code

All current community routes are under `app/(app)/(tabs)/communities`. Because
the current root guard mounts `(app)` only for a verified account with a
journey, none is presently reachable by a verified account without a journey.
The tab is shown only when `EXPO_PUBLIC_COMMUNITIES_ENABLED` is true, although
route files exist independently of that tab presentation.

| Public path                                 | Route/screen                                       | Observed state at inspected HEAD                                                             | Required direction                                                                                                    |
| ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/communities`                              | `CommunitiesConnectedScreen` / `CommunitiesScreen` | Uses real `listCommunities`; loading, empty, unavailable, error/retry, and ready list states | Preserve real states; do not imply activity or unread counts                                                          |
| `/communities/create`                       | `CreateCommunityScreen`                            | Working form and callable; redirects to community home after confirmed creation              | Preserve redirect; home offers Invite people without auto-modal                                                       |
| `/communities/join`                         | `JoinCommunityScreen`                              | Placeholder only                                                                             | Code/link -> auth -> verified preview -> explicit confirmation -> home; allow verified account with no journey        |
| `/communities/[communityId]`                | `CommunityScreen`                                  | Loads real authorized summary with retry; no feed or invitation action                       | Chronological home, composer/replies, lifecycle-aware states, empty Organizer invitation action                       |
| `/communities/[communityId]/members`        | `CommunityMembersScreen`                           | Placeholder only                                                                             | Member list plus role-appropriate invitation/member administration                                                    |
| `/communities/[communityId]/posts/compose`  | `ComposePostScreen`                                | Placeholder only                                                                             | Simple composer for available post types; announcement role check; shared-reflection flow remains separate/deliberate |
| `/communities/[communityId]/posts/[postId]` | `CommunityPostScreen`                              | Placeholder only                                                                             | Thread detail, replies, prayer state/acknowledgment, reporting, edit/delete permissions                               |
| `/communities/[communityId]/settings`       | `CommunitySettingsScreen`                          | Placeholder only                                                                             | Details, expectations, notification/progress controls, schedule and lifecycle actions only when implemented           |

Required surfaces with no route at this HEAD:

- owner-only shared contributions after leaving/removal/closure;
- invitation preview as an access-safe link/deep-link flow;
- coordinated schedule/enrollment detail when a separate surface is needed;
- private in-app notification inbox/preferences if not composed into Settings;
- separately guarded platform safety queue and report detail.

Exact paths for absent surfaces are not assigned here. The navigation ticket
must choose them using existing route patterns after their data contracts exist.

## Cross-operation semantics

### Privacy and audience

- Active membership grants only the current-member community projection. It
  never grants private profile, contact, writing, practices, detailed
  completion, or personal journey access.
- Shared content is a copied community record visible to current and later
  members. Its source remains private. Former or removed authors receive a
  separate caller-owned projection only for listing/deleting their
  contributions.
- Safety review receives only case-required evidence. Organizer role is never
  safety-review authority, and private journals are outside submission
  safeguards and review scans.

### Status and permission changes

- Active community permits ordinary operations subject to role and membership.
  Closed permits archive reads for still-active members, author deletion,
  reporting, notification controls, leaving, and necessary safety actions only.
- Leaving/removal immediately revokes feed/member/progress access and prevents
  notification send/open. Removed membership cannot be reinstated by ordinary
  invitation acceptance; Left may be.
- Author deletion and moderator removal retain text-free tombstones where thread
  integrity requires them. Personal and shared copies never share edit/delete
  state.

### Concurrency and idempotency

- Mutations use an operation identifier where retry safety is required and a
  revision precondition where stale edits or lifecycle races matter.
- Invitation rotation atomically swaps the active digest. Acceptance rechecks
  the current digest and lifecycle in the membership transaction.
- Prayer acknowledgment set/unset is unique per member/request and idempotent.
- Schedule freeze occurs atomically with the first accepted enrollment.
- Day 1 activation is idempotent and reuses the trusted
  one-active-personal-journey invariant. It records real timestamps, retries
  only inside participant Day 1, and never backdates.

### Stable error families

Backend tickets should map platform failures to a small domain set appropriate
to each operation, including authentication/verification, invalid input,
unavailable or expired invitation, membership ended/removed, role denied,
community closed, revision conflict, enrollment closed/frozen, active journey
conflict, content unavailable, start window missed, blocked interaction, rate
limited, and temporarily unavailable. Final names belong to the canonical
contract. Clients must not display raw Firebase errors.

## Data and security constraints for contract owners

- Invitation code generation provides at least 80 bits of entropy with an
  unambiguous alphabet. Member-readable documents contain neither plaintext,
  digest, nor encrypted secret. Backend lookup uses only a digest; organizer
  retrieval decrypts with a versioned server-managed key for that response and
  prohibits plaintext response caching.
- Community post documents contain only submitted community content. A shared
  reflection has no journey/day/writing/revision/practice linkage.
- Enrollment data, including participant zone, setup/choice snapshots,
  motivation, and personal journey linkage, is participant/server-private.
  Community schedule data uses the separate public community zone.
- Aggregate progress requires at least five contributors in every displayed cell
  plus complementary suppression. Suppressed or opted-out values are not
  rendered as zero.
- Push payloads are generic and contain no body, code/invitation, community
  name, or sensitive actor data. Send and open both reauthorize.
- Server-side community submission safeguards do not read private journals.
- Security Rules and trusted functions deny client bypass and cover active,
  former, removed, closed, Organizer, author, blocked, and safety-reviewer
  cases.

## Configuration and release evidence

Operation rows must link to tests and identify required configuration before a
frontend treats them as available. Relevant configuration includes invitation
encryption/digest secrets, approved app/universal-link host, Firestore indexes
and rules, scheduled Day 1 execution and monitoring, optional push
credentials/native configuration, feature-flag rollout, rate limiting/App Check
decisions, and separately provisioned safety-reviewer authority.

Compilation or mocked tests do not prove emulator behavior, deployed functions,
configured secrets, device delivery, production authorization, or release
readiness. Record those as separate evidence when they actually occur.
