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
