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

### Ticket 13 — threaded replies and prayer support

| Exported operation                 | Canonical request / result                                                             | Authorization and transaction behavior                                                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listCommunityReplies`             | `IListCommunityRepliesRequest` / `IListCommunityRepliesResult`                         | A current active member may read oldest-first replies beneath a matching post in an Active or Closed community. Published and tombstoned parents retain their thread.                                                                                          |
| `createCommunityReply`             | `ICreateCommunityReplyRequest` / `ICreateCommunityReplyResult`                         | A current active member may add one non-nested reply only while the community and matching parent post are Active/Published. The server derives author identity, display name, timestamps, revision, and audience.                                             |
| `editCommunityReply`               | `IEditCommunityReplyRequest` / `IEditCommunityReplyResult`                             | The current active reply author may replace its published text in an Active community at `expectedRevision`. Organizer authority does not permit rewriting another author's reply. Parent tombstones do not prevent an existing reply author from editing.     |
| `deleteCommunityReply`             | `IDeleteCommunityReplyRequest` / `IDeleteCommunityReplyResult`                         | The authenticated reply author may create a text-free AuthorDeleted tombstone at `expectedRevision`, including after leaving/removal, parent deletion, or community closure. This does not restore group-read access.                                          |
| `setCommunityPrayerRequestStatus`  | `ISetCommunityPrayerRequestStatusRequest` / `ISetCommunityPrayerRequestStatusResult`   | The current active author of a published PrayerRequest in an Active community may explicitly set Current, NoLongerCurrent, or Answered at `expectedRevision`. Status is never inferred and causes no practice completion or testimony.                         |
| `setCommunityPrayerAcknowledgment` | `ISetCommunityPrayerAcknowledgmentRequest` / `ISetCommunityPrayerAcknowledgmentResult` | Desired-state `isPraying` mutation. Setting true requires a current active member, Active community, and published Current PrayerRequest. Setting false remains available to the authenticated account after status, membership, parent, or lifecycle changes. |
| `listCommunityPrayerSupport`       | `IListCommunityPrayerSupportRequest` / `IListCommunityPrayerSupportResult`             | A current active member may read bounded oldest-first supporter summaries, exact eligible count, and their own desired state under the same Active/Closed archive audience as the parent prayer thread. Only currently Active membership records are counted.  |

Reply and prayer requests reject unexpected fields. IDs retain the 1–128 safe
identifier limit; reply text is trimmed, required, rejects ASCII control
characters, and is limited to 10,000 characters. Reply/support pages default to
20 and permit 1–50 records. Opaque cursors are limited to 512 base64url
characters and bind version, operation kind, community ID, post ID, timestamp,
and reply/supporter identity. Reply order is `createdAt` ascending then reply ID
ascending. Support order is the current `acknowledgedAt` ascending then account
ID ascending; support is never popularity-sorted.

All five mutations use actor-and-operation-scoped IDs and SHA-256 request
digests in body-free private receipts. Reused operation IDs with changed
normalized payloads return `OperationPayloadMismatch`. Creation retries cannot
duplicate replies, and desired-state support retries/concurrent sets cannot
inflate support. Reply edits/deletes and prayer status changes use
`RevisionConflict` for stale revisions. Additional stable reasons are
`ReplyUnavailable`, `ReplyAuthorRequired`, and `PrayerRequestRequired`; Ticket
12's authentication, verification, input/cursor, account, community, membership,
post, revision, operation, and data reasons remain applicable.

Replies persist as separate
`communities/{communityId}/posts/{postId}/replies/{replyId}` records. Creation
increments a transactional post `replyCount`; author deletion retains the
reply/tombstone, so the thread count remains the number of reply records. Reply
contributions use Ticket 12's body-free
`users/{userId}/communityPostContributions/{digest}` index with reply identity
and contribution kind. No text is copied to indexes, receipts, counters, or
private retry metadata.

Prayer acknowledgments persist one record per stable account at
`communities/{communityId}/posts/{postId}/prayerAcknowledgments/{userId}`.
Withdrawal retains the record with `isPraying: false`, a null current
acknowledgment time, and the original `firstNotificationEligibleAt`. Later
false-to-true changes therefore cannot create repeated first-notification
eligibility; no notification is sent by this ticket. The support reader derives
names/counts from at most 500 currently Active membership records and exact
per-member acknowledgment reads, immediately excluding missing, Left, Removed,
or otherwise non-active members. More than 500 active records is an explicit
data-unavailable condition rather than an unbounded scan.

Existing callable-only Rules deny all direct access below `communities/**` and
explicitly deny the five new receipt collections. Reply ordering uses built-in
single-field indexes and support reads use exact document paths, so no new
composite index or data migration is required. Deploy the seven new callable
exports and updated Rules before a client treats the operations as available.

Implementation is in `functions/src/community/community-thread.ts`, with exports
in `functions/src/index.ts`. Canonical types are in the authorized community
post type files; runtime request validators remain in the canonical community
post validator copied by `scripts/prepare-functions.cjs`. On 2026-09-14,
Functions build and lint, 8 focused post/thread contract tests, and 312
configured Security Rules API cases passed. Emulator transaction coverage for
ordering/pagination, retry/concurrency, author/lifecycle, revision, membership
filtering, stable notification eligibility, and private-practice separation is
in `tests/community-posts.emulator.test.cjs`; it was not run because this
machine has no Java runtime.

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

### Ticket 18 — author ownership and community cleanup

`listOwnCommunityContributions` accepts `IListOwnCommunityContributionsRequest`
and returns `IListOwnCommunityContributionsResult` from
`src/types/community/community-post-function.types.ts`. The caller must be
authenticated, email-verified, and have an available account. No membership is
required, including after leave, removal, or closure. The result contains only
the caller's own post/reply identity, status, revision, created timestamp, and
submitted text while Published. It returns no feed, other replies, member list,
or private report. Each body-free author index entry is checked against the
community, parent post, actual record, and actual author before projection;
stale or forged index entries are ignored. Existing `deleteCommunityPost` and
`deleteCommunityReply` remain the author-only revision-checked delete operations
with actor/operation-scoped IDs, request-digest mismatch detection, and
`PostAuthorRequired`/`ReplyAuthorRequired`, `RevisionConflict`,
`OperationPayloadMismatch`, or item-unavailable reasons. No public delete
response shape changed.

The list rejects unexpected fields. Page size defaults to 20 and is limited to
1–50. Opaque base64url cursors are limited to 512 characters, bind the caller
and operation, and order by author-index `createdAt` descending then index ID
descending. A malformed or cross-account cursor returns `InvalidCursor`; other
input failures return `InvalidInput`. Auth/account and data reason codes reuse
the existing post contract. No client write/read access is added.

`communityAuthUserDeleted` is a first-generation Firebase Authentication
single-user deletion trigger. `resumeCommunityCleanup` is a scheduled trusted
worker. No callable permits a client to queue account deletion. Auth cleanup
tasks are bounded to 20 records per stage and resumable after partial failure.
The worker closes any still-Active orphaned Organizer community, revokes its
pointed invitation and digest, tombstones Published author bodies, replaces
public author names with “Former participant,” clears contribution indexes and
membership discovery records, marks community membership inactive, and deletes
prayer support. A pending deletion task causes member post/reply/support readers
to redact deleted-author content and support before physical cleanup finishes.
Invitation preview/acceptance reject a pending Organizer deletion task, and
member lists/counts omit pending-deletion accounts. New posts/replies and other
active-community mutations treat a pending Organizer deletion as closed while
retained-member archive reads and author deletion remain available.
Leave/removal transactionally queues restricted support cleanup; current
membership is rechecked before a retry deletes a support record, so rejoining
does not destroy active support. These operations do not touch private journeys.

Restricted deletion/exit tasks contain only actor/community identifiers and
queue timestamps; they are deleted when finished. Shared text is erased from
normal records through text-free tombstones. Existing restricted member-removal
records remain the minimal safety/audit evidence under the existing
administration boundary; no submitted body or invite code is copied there.
Production preparation requires the new Firestore indexes and Rules, the
first-generation Auth trigger and scheduler on the configured Node 22 runtime,
and an operational path that deletes accounts singly. Firebase Admin
`deleteUsers` bulk deletion does not emit individual Auth deletion events. No
live cleanup was run in this ticket.

### Ticket 20 — reports, member blocks, and submission safety

`reportCommunityContent` is a Firebase callable using
`IReportCommunityContentRequest` and `IReportCommunityContentResult` in
`src/types/community/community-moderation.types.ts`. It accepts Post, Reply,
Member, and Community targets; the existing future Message target is rejected.
The authenticated, email-verified reporter needs an available account and Active
membership in the community, including a closed archive they can read.
Post/reply parents and Active member targets are verified against that
community. Hidden published content cannot be reported by arbitrary ID.
Organizer targets enter the same restricted queue; the acknowledgment is
`reportId` and `Submitted`, with no invented outcome or response SLA.

`communitySafetyReports/{reportId}` stores the reporter ID, target, reason,
optional explanation, exact current post/reply revision and submitted text,
target author ID, member display name/role or community name/purpose when
applicable, and server timestamps in a restricted transactionally captured
record. Organizer membership does not grant evidence access. Actor-private
duplicate keys reuse a report for the same target/reason/revision; actor/Report
operation receipts recover retries and reject payload mismatch. New reports
default to five per ten-minute reporter window. Unexpected fields are rejected.
Identifiers are 1–128 ASCII letters, digits, underscore, or hyphen; optional
explanation is trimmed to 1–1000 characters. Reasons reuse
`CommunityReportReason`.

`blockCommunityMember`, `unblockCommunityMember`, and
`listBlockedCommunityMembers` are callables using canonical contracts in
`src/types/community/community-block.types.ts`. Block requires current Active
membership shared with a current Active target member; Unblock and list require
only the owner's account, so an ended shared membership does not strand a block.
Self-targeting is denied. `users/{owner}/communityBlocks/{blockedUserId}` stores
only IDs, a safely resolved saved display name, and server creation time. List
returns the target ID and saved name, defaults to 20, allows 1–50 items, orders
by document ID, and uses an opaque owner-bound cursor limited to 512 characters.
Block/Unblock operation receipts are actor and operation scoped with payload
mismatch detection. No blocked-person notification is sent; membership and
roster access remain intact. Published blocked-relationship content is hidden
from post feed/detail, reply lists, and prayer support; direct replies and
prayer acknowledgments to a blocked post author are denied. Author deletion
remains owner-only. Later notification work must suppress targeted delivery.

Feed and reply readers scan at most 200 candidates per page, filter before
returning items, and advance cursors at the last consumed candidate. Reply
counts are exact on the first page when the bounded scan reaches the end;
otherwise the existing numeric field is a page-visible lower bound. Prayer
support retains its bounded 500-member scan and filters before count/pagination.
No new composite index is needed for safety records or document-ID blocked-list
ordering; existing post/reply indexes remain required. Firestore Rules deny
direct client access to blocks, report evidence, duplicate keys, receipts, and
rate records.

The deterministic safeguard covers deliberately submitted community post/reply
creation and edits only. It rejects text over 10,000 characters, direct threat
phrases, child-sexual-content phrases, and credential solicitation; ordinary
Christian terms and Scripture are not keywords. The actor submission window
defaults to ten attempts per ten minutes. `COMMUNITY_SAFETY_POST_LIMIT` and
`COMMUNITY_SAFETY_REPORT_LIMIT` may be configured as integers 1–100; invalid
values fail closed as `SafetyConfigurationUnavailable`. Safety reasons are
`InvalidInput`, `InvalidCursor`, `AccountUnavailable`, `CommunityUnavailable`,
`TargetUnavailable`, `SelfTarget`, `BlockedInteraction`, `RateLimited`,
`SubmissionRejected`, and `OperationPayloadMismatch`.

Functions build/lint and 11 post/safety non-emulator contract tests passed.
Emulator cases in `tests/community-posts.emulator.test.cjs` and restricted-path
Rules cases in `tests/firestore-rules.test.cjs` are prepared. Emulator execution
was attempted but Java was unavailable. The root TypeScript check still fails in
pre-existing protected components/utilities and reported no Ticket 20 file
error. The configured Rules evaluator could not reach Google's API. Prompt 22
owns independent reviewer decisions. Production launch still requires reviewer
provisioning, timely response operations, published contact information,
user-facing Terms/community standards, an operational response process, and
in-app report/block surfaces.

### Ticket 22 — restricted platform safety review

`listCommunitySafetyReports`, `claimCommunitySafetyReport`,
`getCommunitySafetyReport`, and `reviewCommunityReport` are Firebase callables.
Canonical request, result, report, and action types are in
`src/types/community/community-moderation.types.ts`; validators are sourced from
`src/features/communities/community-safety.ts` and copied by
`scripts/prepare-functions.cjs`. Every request requires a current, enabled,
email-verified Auth user with the separate Boolean custom claim
`communitySafetyReviewer: true`, read from Auth on each attempt. Organizer and
ordinary membership roles grant no access. A caller cannot supply a reviewer ID.
There is no user-facing role-grant callable. Reports filed by or about the
reviewer are inaccessible for detail/decision; an independent reviewer or an
operator escalation is required.

Queue input is `{pageSize?, cursor?}`; default page size is 20, limit is 1–50,
and a cursor is a document ID limited to 512 ASCII identifier characters. It
returns Submitted and UnderReview cases, ordered by report document ID, with a
next cursor from the last returned record. Queue entries contain IDs, target,
reason, status, revision, and creation time, but no explanation or evidence.
Firestore uses its single-field `review.status` index for this query; Firebase
rejected the attempted composite status/document-ID index as unnecessary. Detail
input is exactly `{reportId}`; detail returns the restricted report (including
submitted revision/evidence) and the current target state/text and SHA-256 text
digest. Parent post/reply and community IDs are validated in current-state
reads. Claim input is exactly `{reportId, expectedRevision, operationId}` and
changes Submitted to UnderReview with reviewer ID, trusted time, and incremented
report revision in one transaction. A claimed case can be decided only by its
claimant; concurrent claims conflict. After one hour from the trusted claim
timestamp, another reviewer may reclaim with the latest report revision; an old
claimant cannot decide after reassignment. Actor/Claim receipts contain only a
request digest, report ID, revision, and creation time. A claim retry recovers
the same result while it remains claimed; its operation ID cannot be reused with
another payload.

Decision input is exactly
`{reportId, expectedRevision, expectedTargetRevision, requestedAction, explanation, operationId, reviewedCurrentTextDigest?}`.
IDs are 1–128 ASCII letters/digits/underscore/hyphen; revisions are integers
0–2,147,483,646; explanation trims to 1–1000 characters without control
characters; optional digest is 64 lowercase hex characters. Actions are
`RemoveContent` for Post/Reply, `RemoveMember` for Member, `CloseCommunity` for
Community, or `NoAction` for any supported target. A changed reported target
must match the current revision; any decision after a text edit also requires
the digest of the current text returned by detail. Stale report/target revisions
fail `RevisionConflict`, and missing current-content acknowledgement fails
`CurrentContentReviewRequired`. Decisions resolve a Submitted or claimant-owned
UnderReview report transactionally, advance its revision, and create a
restricted action with reviewer, trusted time, target/report revisions, and
reason. Actor and Review scoped operation receipts store only a request digest,
IDs, and creation time; retries detect `OperationPayloadMismatch` and never
replay an action. Other reasons are `AuthenticationRequired`,
`EmailVerificationRequired`, `ReviewerRequired`, `ReviewerConflict`,
`InvalidInput`, `ReportUnavailable`, `CommunityUnavailable`,
`TargetUnavailable`, `UnsupportedTarget`, `ActionTargetMismatch`,
`CommunityClosed`, and `OrganizerEscalationRequired`.

Member removal writes the existing Removed membership/index and private removal
tombstone and queues exit cleanup. Closure revokes the active invitation and
digest pointer. Content removal creates a text-free ModeratorRemoved tombstone.
No decision writes a personal journey or private writing. Direct client access
to reports, moderation actions, claim receipts, and review receipts is denied by
Rules. Auth claim provisioning and Rules, and Functions require operator
configuration/deployment. Local Functions build/lint, three Ticket 22
non-emulator tests, six Firestore emulator cases, one Auth/Firestore emulator
Rules case, and the repository's 422-case remote Rules evaluator passed.
Firebase deploy released the local Rules and indexes, reported successful
creation/update of every Function, and a subsequent inventory check found all
four Ticket 22 callables Active with the same deployed hash. The CLI
nevertheless exited 1 because no Artifact Registry cleanup policy is set in
`us-central1`; this ticket did not set a billing/retention policy.

### Ticket 25 — coordinated schedule authority and safe public preview

The callable names are `configureCommunityJourney`, `reviseCommunityJourney`,
`cancelCommunityJourney`, `getCommunityJourneySchedule`,
`getCommunityJourneyCourseOption`, and `listCommunityJourneyHistory`. Canonical
requests/results are the identically named `I...Request`/`I...Result` contracts
in `src/types/community/community-function.types.ts`; schedule persistence and
member previews use `ICommunityJourneyDocument` and `ICommunityJourneyPreview`
in `src/types/community/community-journey.types.ts`. The parser source is
`src/features/communities/community-journey.ts`, copied by
`prepare-functions.cjs` at build time. Generated copies are never edited.

`configure` accepts exactly communityId, `{courseId,courseVersionId}`,
startDate, timeZoneId, and operationId. `revise` additionally requires
communityJourneyId and expectedRevision. `cancel` accepts exactly communityId,
communityJourneyId, expectedRevision, and operationId. IDs are 1–128 ASCII
letters, digits, underscore, or hyphen. Revisions are safe nonnegative integers
below 2,147,483,647. Dates are real Gregorian `YYYY-MM-DD` dates, strictly
future in the named community zone at transaction time. Zone IDs are 1–100
characters, valid through `Intl.DateTimeFormat`, and cannot be UTC offsets.
Unknown request fields and course fields are rejected. The organizer course
option reader accepts exactly communityId and returns the configured current
published course/version or null. It checks the parent, version, 77 daily
records, and 11 week introductions. It does not assert any participant's
translation readiness; enrollment must recheck that separately.

`getCommunityJourneySchedule` accepts exactly communityId and returns the
current safe preview or null. History accepts communityId, optional pageSize
1–20 (default 10), and optional opaque base64url cursor up to 512 characters.
History orders by createdAt descending then document ID descending. Its cursor
is versioned, bound to the community, and preserves timestamp seconds and
nanoseconds plus the document ID. The safe preview contains only the public
schedule ID/revision, course reference, date, community zone, status, and
derived canEnroll/canRevise flags. Member reads force canRevise false; Closed
community reads force both flags false. Invitation preview receives only its
existing narrower coordinatedJourney DTO: course, date, zone, status, and
canEnroll. It contains no enrollment, private setup, writing, practice,
readiness, or personal journey link.

All six callables require authentication and verified email. Active membership
is rechecked for every transaction and retry. Only the current active Organizer
may configure, revise, cancel, or read the course option. Active members may
read current schedule/history; still-active members of a Closed community may
read the archive. New mutations are rejected immediately after parent closure.
Configure, revise, and cancel use per-actor/per-operation receipt paths and a
SHA-256 digest of the bounded canonical request to detect payload mismatch. They
read the community's currentCommunityJourneyId pointer in the same transaction
as schedule state. Configure creates a new schedule ID; cancel clears the
pointer and retains the Canceled record. Revision requires the original schedule
to remain Scheduled, current, and never enrolled. The
`firstEnrollmentAcceptedAt` marker starts null and must be set exactly once by
the first enrollment transaction in Ticket 26, under the same schedule/pointer
reads. It must never be cleared after withdrawal. Cancel only applies to a
Scheduled record and does not write a personal journey.

Stable reason codes are `InvalidInput`, `InvalidCursor`, `AccountUnavailable`,
`CommunityUnavailable`, `CommunityClosed`, `OrganizerRequired`,
`CourseUnavailable`, `ScheduleExists`, `ScheduleUnavailable`, `ScheduleFrozen`,
`EnrollmentClosed`, `RevisionConflict`, `OperationPayloadMismatch`, and
`ScheduleDataUnavailable`. Existing community account
authentication/verification codes remain in use. No catalog query is opened to
clients. Direct client read/write access remains denied by Rules for community
records and schedule operation receipts. The history query uses the existing
single-field createdAt DESC index with document-ID ordering. Firebase rejected a
proposed composite createdAt/document-ID index as unnecessary; no
communityJourneys composite index is required.

Operational prerequisites: `formationConfiguration/current` must identify a real
current published course/version with its 77 days and 11 introductions. Existing
communities need no backfill because an absent current pointer means no
schedule. Any externally created legacy schedule lacking
firstEnrollmentAcceptedAt needs an explicit migration before it can be read;
this ticket performs no destructive migration. The pure contract/calendar test
and Functions build/lint passed locally on 2026-09-15. The Firestore emulator
suite was not run because no Java runtime is installed. The repository Rules API
suite was not run because Firebase credentials require reauthentication. The
edit-versus-enrollment and cancel-versus-enrollment races cannot be verified
against a real enrollment callable until Ticket 26 supplies it. The root
`npx tsc --noEmit` check fails on pre-existing application errors outside this
ticket; it reports no errors in the new community journey parser or the narrowly
changed community types. The first Firebase deployment attempt compiled the
Rules but exited before publishing Functions when Firestore rejected the
unnecessary composite index. The retry released `firestore.rules` and reported
successful creation of all six new callables plus successful update of
`previewCommunityInvitation` in `us-central1`. A subsequent
`firebase functions:list` showed the seven selected callables present as Node 22
v2 callables. The deploy CLI still exited 1 because it could not set an Artifact
Registry cleanup policy in `us-central1`; this ticket did not set a billing or
retention policy. No production callable smoke test or published-course
configuration check was performed.

### Ticket 26 — private enrollment and withdrawal

The callable names are `getCommunityJourneyEnrollment`,
`enrollCommunityJourney`, and `withdrawCommunityJourneyEnrollment`. Canonical
request/result contracts are `IGetCommunityJourneyEnrollmentRequest/Result`,
`IEnrollCommunityJourneyRequest/Result`, and
`IWithdrawCommunityJourneyEnrollmentRequest/Result` in
`src/types/community/community-function.types.ts`. The private persisted record
is `ICommunityJourneyEnrollmentDocument` in
`src/types/community/community-journey.types.ts`. All request validators live in
`src/features/communities/community-journey.ts` and are copied by
`scripts/prepare-functions.cjs` during contract preparation.

The reader accepts exactly communityId and communityJourneyId. Enrollment
accepts exactly those IDs, expectedCommunityJourneyRevision, setupDraftId
`current`, expectedSetupRevision, startingTimeZoneId,
consentToScheduledActivation `true`, and operationId. Withdrawal accepts exactly
the two IDs and operationId. Unknown fields are rejected. IDs are 1–128 ASCII
letters, digits, underscore, or hyphen; revisions are safe nonnegative integers
below 2,147,483,647. The confirmed IANA zone is 1–100 characters, valid through
`Intl.DateTimeFormat`, and cannot be a UTC offset.

All three callables require authentication and verified email. Enrollment
rechecks the available profile, Active membership, Active community,
non-Organizer role, current Scheduled schedule, Open enrollment window, matching
revision, and community-zone date before the named start date. It uses the
existing journey-start setup choice and full course/translation readiness
validators, rejects an Active personal journey, and verifies the motivation head
against its owned revision. The transaction creates only
`users/{userId}/communityJourneyEnrollments/{communityJourneyId}` and a bounded
actor/operation digest receipt; the first accepted enrollment sets the public
schedule's permanent `firstEnrollmentAcceptedAt` marker. It does not create a
future personal journey or day record. The private record snapshots choices,
translation, setup and schedule revisions, confirmed participant zone, consent
time, motivation head and source revision. Later setup edits do not change it.
The organizer/member projections contain none of these private fields.

Enrollment confirmation returns the safe schedule preview, community display
date, confirmed participant zone, and
`personalStartDateBehavior: ParticipantCalendarDay1`. The participant-only
reader returns its enrollment lifecycle and derived activationEligibility,
including membership/closure/cancellation changes and an active personal journey
conflict, without returning writing text. Withdrawal changes Enrolled to
Withdrawn only, and never deletes setup writing or a personal journey. Started
enrollment returns `EnrollmentStarted`; a Withdrawn record cannot be enrolled
again. Enrollment and withdrawal receipts are scoped to actor and operation and
store only a request SHA-256 digest and creation time. A repeated enrollment
receipt rechecks current membership and schedule state; changed payload returns
`OperationPayloadMismatch`.

Typed reasons are `InvalidInput`, `AccountUnavailable`, `CommunityUnavailable`,
`MembershipEnded`, `CommunityClosed`, `OrganizerCannotEnroll`,
`ScheduleChanged`, `ScheduleCanceled`, `EnrollmentClosed`, `ContentUnavailable`,
`SetupChanged`, `SetupInvalid`, `WritingUnavailable`, `ActivePersonalJourney`,
`EnrollmentAlreadyExists`, `EnrollmentWithdrawn`, `EnrollmentStarted`,
`EnrollmentUnavailable`, `OperationPayloadMismatch`, and
`EnrollmentDataUnavailable`. The reader is a single-record lookup; no cursor or
composite index is needed. Rules explicitly deny direct client reads and writes
to enrollment and operation receipts. Existing Active-journey single-field query
indexing is used. Legacy enrollment records lacking the confirmed zone, snapshot
revision, or consent timestamp need deliberate migration before this reader
accepts them. Production formation configuration must map each selected Bible
version to a released text edition and the scheduled published course. Actual
Day 1 activation and monitoring belong to the later activation ticket.

Local build, lint, contract, Rules, and emulator results are recorded in the
Ticket 26 operational notes in `docs/community-implementation-plan.md`.

### Ticket 27 — due enrollment activation

`activateDueCommunityJourneyEnrollments` is a Node 22 v2 scheduled Function,
configured for every five minutes in UTC, a 540-second timeout, one instance,
and zero platform retries. Its backend implementation is
`runDueCommunityJourneyBatch`. It reads at most four pages of 20 Enrolled
participant-private records and four pages of 20 Scheduled/Active public
schedules per invocation. Each collection-group scan orders by document path;
private cursor paths live only in `communityJourneyActivationWorker/current`.
The next invocation resumes after the cursor, wrapping to the first page at the
end. A crash before checkpoint advancement may repeat a page; enrollment
lifecycle, the account journey-control lock, and actor-scoped activation
receipts make repeating a completed start safe. The worker reports a failed
candidate count in its private checkpoint, without recording bodies or invite
codes. It does not scan a community's practice totals.

`retryCommunityJourneyActivation` is a Firebase callable. Its canonical
request/result are `IRetryCommunityJourneyActivationRequest` and
`IRetryCommunityJourneyActivationResult` in
`src/types/community/community-function.types.ts`. It accepts exactly
`communityId`, `communityJourneyId`, and `operationId`; each ID is 1–128 ASCII
letters, digits, underscores, or hyphens. The shared parser is
`parseRetryCommunityJourneyActivationRequest` in
`src/features/communities/community-journey.ts`, copied by
`scripts/prepare-functions.cjs`. The callable requires authenticated verified
identity; actual activation also reads the current Firebase Auth user and
profile, private consent snapshot, active membership, active parent and current
schedule pointer, schedule revision and pinned course, full released course and
translation content, and the active personal-journey query under the existing
journey-control lock. A repeated operation ID with a different community or
schedule digest returns `OperationPayloadMismatch`. Receipts contain only the
digest and server creation timestamp. Results are `NotDue`, `Started`,
`StartBlocked`, or `Withdrawn`; private lifecycle carries the started journey
link or exact block reason. A transient failure leaves Enrolled and may retry
only while the participant's scheduled Day 1 remains current. A later date
records `MissedStartDate` and creates no journey. Other block reasons are
`ActivePersonalJourney`, `MembershipEnded`, `CommunityJourneyCanceled`,
`CommunityClosed`, `AccountUnavailable`, `EmailVerificationRequired`,
`ContentUnavailable`, `SetupInvalid`, and `WritingUnavailable`. Input errors use
`InvalidInput`; invalid persisted enrollment/schedule data use
`EnrollmentDataUnavailable`/`ScheduleDataUnavailable`.

The existing `getCommunityJourneyEnrollment` result keeps its previous fields
and adds `communityCalendarDate` and `startingZoneCalendarDate`, derived from
one server instant. It reads only the caller's private enrollment and returns no
writing text or other participant schedules. An Active public schedule may still
be eligible for participant-zone Day 1 activation. The public schedule becomes
Active on its own start date and Completed at the beginning of its Day 78 in the
community zone, with actual reconciliation timestamps. A started private journey
keeps the existing phone-zone day semantics after membership or community
lifecycle changes.

Collection-group single-field indexes on `lifecycle.status` are required for
enrollment and schedule scans; document path ordering is implicit. Rules
explicitly deny direct client access to activation receipts and the worker
checkpoint; enrollment and public community records retain the callable-only
boundary. Existing enrollment records must have the Ticket 26 consent snapshot
and freeze marker. Missing or incompatible records require deliberate migration
rather than an invented start. Local Functions build/lint and 30
contract/calendar/normal-start tests passed. The extended Firestore emulator
transaction tests were added but not run because Java is unavailable. The remote
Rules API test was attempted but could not contact Firebase; root application
type check still has unrelated baseline errors and none in this ticket's changed
contract files.

The requested Firebase deploy released `firestore.rules` and the two
collection-group single-field index controls, created the scheduled worker and
retry callable, and updated `getCommunityJourneyEnrollment` and `startJourney`
in `us-central1` on Node 22 v2. The Function inventory showed the scheduled and
callable triggers. The deploy CLI exited 1 after successful resource operations
because it could not establish an Artifact Registry cleanup policy in
`us-central1`; no retention or billing policy was changed. Authenticated
production activation/retry and Scheduler execution have not been smoke-tested.

A later worker/retry update uploaded the final persisted-data validation change,
but its CLI wait produced no completion result and was interrupted. The next
Function inventory listed both triggers with runtime fields unavailable during
update; a later inventory again showed Node 22 v2 and 256 MB for each. The CLI
did not confirm the exact revised source hash, so treat that revision as pending
verification.

### Ticket 31 — independently revocable high-level progress

Four Node 22 Firebase callables are exported: `getCommunityProgressSharing`,
`setCommunityProgressSharing`, `listSharedCommunityProgress`, and
`getCommunityAggregateProgress`. Canonical requests/results live in
`src/types/community/community-progress.types.ts`; bounded parsers live in
`src/features/communities/community-progress.ts` and are copied by
`scripts/prepare-functions.cjs`. The Set request now requires `operationId`.

Each operation requires authenticated verified identity, an existing profile,
authoritative Active membership, an Active community, and a matching
Scheduled/Active/Completed community journey. The owner read returns separate
`Private` defaults. Set additionally requires the owner's private Enrolled or
Started record. Shared transitions use server consent timestamps; setting
Private immediately revokes them. Preferences are keyed by a hash of community
and community-journey IDs. The actor-scoped Set receipt holds only the payload
SHA-256 digest, text-free result, and creation time. Same-payload retries
recheck authorization and return current preference state; changed payloads
fail. Enrollment and membership never set either flag.

Every identifier is 1–128 ASCII letters, digits, underscores, or hyphens. The
individual list defaults to 20 scanned members per page (maximum 50). Its
version-1 Base64url cursor is at most 512 characters, scoped to community and
journey, ordered by `joinedAt` then member document ID ascending, and never
grants access. Pages may be empty while passing nonsharers. Only a consenting
Active member with a valid private Started link and a personal journey owned by
them is returned. Its projection has public user ID/display name, the canonical
Active/Completed/EndedEarly state, and calculation time; no private journey ID,
dates, day/practice data, or writing is exposed.

Aggregate reads recompute from live private records, with no stored projection
or background monitor. They return `Available` only for a 5–50 member Active
roster where every member separately consented to aggregate contribution and has
a valid Started private link, and every nonzero stage cell has at least five
members. Every other case is typed `Suppressed` with `progress: null`. A true
zero in an Available stage cell is distinct from suppression. This conservative
whole-result rule blocks complementary subtraction against the member roster.
Guidance identifies the counts as voluntary participants' factual stages, not
spiritual scores. Closure and membership loss immediately deny new reads; stale
or forged progress documents are ignored.

Reason codes are `AuthenticationRequired`, `EmailVerificationRequired`,
`InvalidInput`, `InvalidCursor`, `AccountUnavailable`, `CommunityUnavailable`,
`CommunityClosed`, `JourneyUnavailable`, `OperationPayloadMismatch`, and
`ProgressDataUnavailable`. Existing member `lifecycle.status`/`joinedAt`
composite indexing is sufficient; no new index or secret is required. Rules
explicitly deny direct client access to preference and Set receipt documents.
Production requires deployment of four Functions and revised Rules. Existing
private Started enrollments must have their real personal link; no migration was
run.

Local Functions build/lint, scoped Prettier, and two parser/authorization tests
passed. Four emulator transaction cases were prepared but skipped because Java
is unavailable. The root TypeScript check still fails in existing protected
components and unrelated utilities. Root lint passed with seven existing
warnings. The configured Rules test was attempted but could not run because the
local Firebase login is expired. Emulator transaction/race/Rules checks remain
pending.

The requested `faithful-4325a` deployment released revised Firestore Rules and
reported successful creation of all four v2 Node 22 callables in `us-central1`.
The subsequent Function inventory succeeded. The deploy CLI exited 1 only
because it could not establish an Artifact Registry cleanup policy in that
region; no retention or billing policy was changed. Authenticated production
progress calls and Security Rules behavior have not been smoke-tested.

### Ticket 33 — private in-app activity events and notification preferences

The trusted callable operations are `listCommunityNotifications`,
`openCommunityNotification`, `markCommunityNotificationRead`,
`getCommunityNotificationPreferences`, and
`setCommunityNotificationPreferences`. `deliverCommunityNotificationEvents` is a
scheduled, server-only bounded fan-out worker. Canonical request, result, event,
recipient, category, and reason types are in
`src/types/community/community-notification.types.ts`; the exact-field parsers
in `src/features/communities/community-notification.ts` are generated for
Functions by `scripts/prepare-functions.cjs`. No client sender or recipient
input is accepted.

Identifiers and operation IDs are 1–128 ASCII letters, digits, underscores, or
hyphens. List page size defaults to 20 and is 1–50; its Base64url cursor is at
most 512 characters, version 1, bound to the recipient user ID, and ordered by
event `createdAt` descending then event document ID descending. A full unread
recount scans at most 1,000 recipient records and fails with
`NotificationUnavailable` rather than returning a partial count. Empty scanned
pages may occur when live authorization suppresses records. List returns IDs,
category, actor ID, source time, and read time only. Open returns `Available`
with community, post, and optional reply IDs, or `Unavailable` with all IDs
null. Each operation requires authenticated email-verified identity. Only the
account owner can list, open, or mark their notifications; each read checks
current Active membership with the original join epoch, Active community, live
published source, actor account, and reciprocal blocks. Mark and preference Set
have actor-scoped operation IDs and reject changed payloads as
`OperationPayloadMismatch`; retries recheck authorization.

Preference Get/Set requires an existing account and current Active
membership/community. Set takes exactly `communityId`, `category` (`Reply`,
`PrayerSupport`, or `Announcement`), `categoryEnabled`, `pushEnabled`, and
`operationId`. The defaults are false for every category and global push. These
controls govern future optional push delivery only; relevant authorized in-app
history remains visible regardless of mute. No OS push consent or push provider
integration is implied.

Reply creation, first non-self true prayer acknowledgment, and original
organizer-announcement creation each write a text-free durable event in the same
source transaction. Events use a SHA-256 source-derived ID. The worker scans at
most five pending events and 20 members per event invocation, advances a
member-ID cursor transactionally, and writes one recipient record per event ID.
It excludes the actor, late joiners, inactive members, reciprocal blocks,
missing accounts, and members without an eligible target relationship. Post
edits and support toggles after first eligibility do not create another event. A
deleted or inaccessible target suppresses list/count and makes Open unavailable.
Direct client reads and writes for events, inbox, preferences, and retry records
are denied by Firestore Rules. The reply-participation query requires the
composite index in `firestore.indexes.json`.

Reason codes are `InvalidInput`, `InvalidCursor`, `AccountUnavailable`,
`CommunityUnavailable`, `OperationPayloadMismatch`, and
`NotificationUnavailable`; the shared account guard separately reports
authentication and email-verification reasons. No notification record contains
post, reply, reflection, invitation, or profile text. The inbox order uses
Firestore's built-in single-field index; only reply participation needs the new
composite in `firestore.indexes.json`. Revised Rules and the reply index were
deployed to `faithful-4325a`; the index reported `READY` before the six new
Functions and three source-callable updates were deployed. No backfill or push
registration is included.

### Ticket 35 — private push installations and Expo delivery

The canonical contract is `src/types/community/community-push.types.ts`;
exact-field and bounded request parsers are in
`src/features/communities/community-push.ts`, copied by
`scripts/prepare-functions.cjs`. New callables are
`registerCommunityPushInstallation`, `unregisterCommunityPushInstallation`, and
`openCommunityPushNotification`. The existing `openCommunityNotification` result
shape is unchanged. Registration takes exactly `installationId` (20 ASCII
alphanumeric characters), `installationSecret` (64 lowercase hexadecimal
characters representing a locally persisted 32-byte random secret),
`operationId` (1–128 ASCII letters, digits, `_` or `-`), `token` (null or
`ExpoPushToken[...]`/`ExponentPushToken[...]` with 1–200 bounded token
characters), `permission` (`NotRequested`, `Granted`, `Denied`, or
`Unavailable`), and `deliveryEnabled` (boolean). A non-Granted permission
requires a null token; enabling delivery requires Granted permission and a
token. Unregistration takes exactly the three installation identity/operation
fields. The server derives account binding and timestamps. Both return
`ICommunityPushInstallationResult` without a token or secret. Both require
authenticated, email-verified identity and an existing account; registration
limits an account to ten installations. The installation secret digest guards
same-installation rebinding across account switches, while unregistration also
requires the current account owner. Actor-scoped operation receipts detect
payload mismatch. Reasons are `InvalidInput`, `AccountUnavailable`,
`InstallationOwnedByAnotherDevice`, `InstallationLimitReached`, and
`OperationPayloadMismatch`, plus the shared auth guard reasons.

Fan-out creates one `ICommunityPushDeliveryDocument` per eligible recipient
installation, identified by a SHA-256 recipient/event/installation digest. Push
tasks do not contain user-written text or raw tokens. `sendCommunityPushOutbox`
runs every minute, at most one instance, examining ten Pending and ten expired
Sending tasks. It transactionally rechecks the original recipient notification,
current membership/join epoch, community and source availability, reciprocal
blocks, account-deletion cleanup, per-community `pushEnabled` and category
preference, current installation account binding, permission, delivery setting,
and token status. It sends one generic payload through the fixed official Expo
HTTPS endpoint. `openCommunityPushNotification` accepts exactly `notificationId`
(64 lowercase hex characters), verifies task recipient ownership, and calls the
existing authorized notification-open reader; unavailable events return the
existing Unavailable shape. No notification ID is a bearer authorization token.

`checkCommunityPushReceipts` runs every five minutes, at most one instance,
examining twenty due ticket tasks and querying Expo's fixed receipt endpoint.
Ticket IDs, bounded sender attempts (five), eight bounded receipt checks, and
next-attempt timestamps are durable. A Sending lease expires after two minutes;
retryable provider/network and rate errors back off from two minutes to one
hour. A receipt is first checked after fifteen minutes and the same ticket is
rechecked on lookup failure. A missing ticket receipt eventually permits a
bounded resend after eight checks or 24 hours. Permanent errors stop;
`DeviceNotRegistered` clears/disables only the installation still bound to the
same account and token digest. This is best-effort provider submission:
ambiguous network outcomes and retries can duplicate an alert, and a successful
receipt does not guarantee device display. In-app inbox delivery remains
separate from permission and push failures.

Firestore Rules deny direct client read/write of `communityPushInstallations`,
`communityPushDeliveries`, and actor operation receipts. The delivery
status/due-time composite is in `firestore.indexes.json`; installation account
lookup uses its single-field index. There is no cursor-based public task list.
Before deployment, enable Expo enhanced push security, configure valid
EAS/APNs/FCM push credentials, set the server-managed `EXPO_PUSH_ACCESS_TOKEN`
Secret Manager secret with
`firebase functions:secrets:set EXPO_PUSH_ACCESS_TOKEN`, verify the composite
index is ready, and deploy the three callables, two Scheduler jobs, Rules, and
indexes. No secret value is committed. The mobile installation secret, OS
permission/token lifecycle, and a real-device open/delivery check remain
separate work; this backend ticket adds no mobile package or screen.

Local verification: Functions build and lint passed; root lint passed with
pre-existing warnings; scoped Prettier and
parser/generic-payload/HTTPS-transport unit tests passed. The configured
read-only Rules API suite passed 572/572. The root `tsc --noEmit` still fails in
protected components and unrelated utilities; it reported no diagnostics in the
new push files. Emulator-backed authorization, registration/rebind, fan-out,
mute/block/source, mocked transport, receipt, and Rules cases were written but
skipped because Firestore/Auth emulator hosts and Java are unavailable. Rules
and indexes were deployed to `faithful-4325a`; the push delivery index was still
`CREATING` on the first status read. Secret Manager metadata confirmed
`EXPO_PUSH_ACCESS_TOKEN` is absent, so sender/receipt Functions were not
deployed. No live Expo request, real device delivery, Scheduler execution, or
production authorization check ran in this ticket.

### Ticket 39 — backend security and lifecycle audit

No operation, response shape, canonical type, index, or Rule was added by this
audit. `listCommunityNotifications` continues to use
`IListCommunityNotificationsRequest` and `IListCommunityNotificationsResult`;
its cursor remains a recipient-bound Base64url traversal position of at most 512
characters, ordered by `createdAt` descending and event ID descending. The
backend now rejects non-safe-integer cursor seconds and nanoseconds outside
0–999,999,999 with the existing `InvalidCursor` reason before constructing a
Firestore timestamp. All other authorization, audience, retry, and lifecycle
semantics remain as registered in their owning sections. No frontend-visible
contract change is required for prompt 40.

`previewCommunityInvitation` continues to return
`IPreviewCommunityInvitationResult`. Its `expiresAt` field is now projected as
the canonical plain `IPersistedTimestamp` value instead of leaking an Admin SDK
`Timestamp` object across the callable boundary. The approved field set and
meaning are unchanged. Existing callers that used `.seconds` and `.nanoseconds`
remain compatible; prompt 40 should verify any caller that assumed SDK-specific
timestamp methods.

The Functions build and the focused notification, creation, owner-contribution,
and personal journey-start tests passed locally (35 tests). The broader backend
contract suite passed 42/42 after the preview projection correction. An emulator
command for existing service-level community tests was attempted but **not run**
because the workstation has no Java runtime. Actual callable hostile-client
tests were also **not run**. This is not evidence of callable authorization or
Rules correctness. A source audit found that ordinary community callable guards
check the Auth token's `email_verified` claim and a Firestore profile, while the
separate safety reviewer guard checks current Firebase Auth state. Whether a
disabled or deleted account with a still-valid token can reach ordinary
operations remains an open security finding requiring real callable tests and a
backend-wide correction. No production migration, secret provisioning, privilege
grant, deployment, or device check was performed for this audit.
