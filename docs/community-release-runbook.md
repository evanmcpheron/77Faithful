# Community configuration, migration, and release runbook

This is an operator procedure derived from the current checkout, not deployment
evidence. Record the commit SHA, intended environment, Firebase project ID,
mobile build ID, operator, approvals, and timestamps in an external change
record. No command below may infer a production target from `.firebaserc`: its
only alias is `default: faithful-4325a`. The mobile Firebase client is also
hard-coded to `faithful-4325a` in `src/services/firebase/firebase.instance.ts`;
staging is blocked until a separately authorized environment-specific client
configuration and independently verified Firebase app/project are available.
`firebase.json` targets Firestore `(default)` in `northamerica-northeast2`;
exported Functions do not set a region and therefore use the provider default
(`us-central1`). Confirm this region policy and any cross-region latency/cost
before release. `functions/package.json` specifies Node 22; verify project
billing, APIs, runtime support, and deployment permissions rather than
substituting a runtime.

## Local preflight and emulator development

Run from the repository root. The preflight has no project writes:

```sh
git status --short
node -e 'const a=require("./app.json").expo,f=require("./firebase.json"),r=JSON.parse(require("node:fs").readFileSync(".firebaserc","utf8")); console.log({alias:r.projects,firestore:f.firestore,functions:f.functions.map(x=>({codebase:x.codebase,source:x.source})),native:{scheme:a.scheme,iosBundle:a.ios?.bundleIdentifier,androidPackage:a.android?.package,easProjectId:a.extra?.eas?.projectId,iosDomains:a.ios?.associatedDomains,androidLinks:a.android?.intentFilters}})'
node -e 'const i=require("./firestore.indexes.json"); console.log(i.indexes.map(x=>[x.collectionGroup,x.queryScope,x.fields.map(f=>f.fieldPath).join(",")]))'
npm --prefix functions run build
npm --prefix functions run lint
npx tsc --noEmit
npm run lint
node --test tests/community-invitation-redemption.test.cjs tests/community-push-contract.test.cjs tests/community-safety-contract.test.cjs
node tests/run-community-workflow.ticket40.cjs
```

The last command is restricted by its own script to `demo-faithful-ticket40`,
with a synthetic key in a temporary, uncommitted `.secret.local`; it needs Java
and Firebase emulators and is **not** a staging or production test. Run
`node tests/run-community-workflow.ticket40.cjs existing` for the broader
existing emulator suite. Do not use the demo key or any emulator secret as a
fallback outside `demo-*`. The existing `npm run test:rules` targets
`faithful-4325a` without an explicit environment argument, so it is unsuitable
for an environment-safe operator preflight until separately scoped. Confirm
Rules denies for private writing, practice choices/completion, personal
journeys, invitation digests, safety evidence, push installations/deliveries,
and operation receipts. A community post is an explicitly submitted copy, not
access to a journal record. Run scoped
`npx prettier <authorized changed files> --check` and scoped ESLint when
code/config is changed; never use the repository's write-formatting script.

## Configuration inventory

| Exact name or value                                                | Scope                                              | Use and secure provision                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_COMMUNITIES_ENABLED`                                  | Public build-time flag                             | Set to `true` only in an approved rollout build after gates; absent/other values disable navigation. It is not backend write control.                                                                                                                 |
| `EXPO_PUBLIC_BASE_URL`                                             | Public build-time URL                              | Required by `src/services/api/api-client.instance.ts`; supply the actual environment API origin in uncommitted build configuration.                                                                                                                   |
| `EXPO_PUBLIC_STORYBOOK_ENABLED`                                    | Public development flag                            | Keep false/absent in release builds.                                                                                                                                                                                                                  |
| Firebase client `projectId`, `appId`, `authDomain`, `apiKey`, etc. | Public Firebase app identifiers                    | Currently literal values for `faithful-4325a`; verify registered apps and route each build to its intended environment. These are identifiers, not server credentials.                                                                                |
| Expo EAS `projectId` (`expo.extra.eas.projectId`)                  | Public native/build identifier                     | Missing in `app.json`; `community-push.service.ts` refuses push token acquisition without a valid ID (or `Constants.easConfig.projectId`). Operator must choose a legitimate EAS project and build.                                                   |
| `COMMUNITY_INVITATION_ENCRYPTION_KEYS`                             | Secret Manager; invitation callables only          | JSON keyring `{ "activeVersion": "<operator-version>", "keys": { "<operator-version>": "<32-byte-base64-key>" } }`. Bind via code's `defineSecret`; provision through a secure secret-entry session, never command-line literals or repository files. |
| `EXPO_PUSH_ACCESS_TOKEN`                                           | Secret Manager; sender and receipt schedulers only | Expo enhanced push security bearer token. Provision through secure secret entry after enabling enhanced security for the correct EAS project.                                                                                                         |
| `API_BIBLE_KEY`                                                    | Secret Manager; `refreshTodayVerses` only          | API Bible access credential; preserve the existing worker's binding. Never borrow a test key for production.                                                                                                                                          |
| `COMMUNITY_SAFETY_POST_LIMIT`, `COMMUNITY_SAFETY_REPORT_LIMIT`     | Nonsecret Functions environment, optional          | Numeric submission limits, each 1–100. Code defaults apply if absent; approve environment values and verify deployed revision.                                                                                                                        |

Do not print secret values in preflight logs. Audit Secret Manager versions,
function bindings and IAM independently. Firebase documents that a changed
secret requires redeploying every bound function to load the new version.
[Firebase environment configuration](https://firebase.google.com/docs/functions/config-env).

Invitation keys must be generated independently with a cryptographic random
source in an approved secret-management environment; base64 encode exactly 32
bytes, assign a new version string, and enter the complete JSON through
`firebase functions:secrets:set COMMUNITY_INVITATION_ENCRYPTION_KEYS --project "$FIREBASE_PROJECT_ID"`
only after project identity is confirmed. The parser accepts at most ten
retained versions and fails closed for missing/malformed keys. Rotation adds a
new version and changes `activeVersion` while retaining every version referenced
by an active encrypted invitation; redeploy `issueCommunityInvitation`,
`getCurrentCommunityInvitation`, and `rotateCommunityInvitation`, then test
decryption of an old invitation and issuance under the new version. Keyring
rotation does **not** rotate invitation codes. If an old key cannot be
recovered, stop showing/issuing that invitation, revoke or invalidate its digest
lookup under an approved operation, and have the Organizer deliberately issue a
new invitation. Do not claim the old ciphertext can be decrypted or silently
reactivate old codes.

## Legacy invitation migration gate

There is no production migration script in this checkout. A written procedure is
not executable migration evidence. Before first reusable-invitation deployment,
a separately authorized operator must use bounded, idempotent trusted-admin
tooling and a tested backup/restore plan. Inventory `communities/{id}`
documents, `communities/{id}/invitations/{id}`,
`communities/{id}/invitations/{id}/redemptions/{userId}`, and exact lookup
collection `communityInvitationDigests/{tokenDigest}`. Classify missing
`activeInvitationId`, legacy Pending/Accepted/Revoked/Expired records, model-2
records, and orphan/mismatched lookups. Record per-status counts,
project/database, page cursor, and a checksum of IDs in restricted evidence;
never export plaintext codes or private bodies. Inventory index state against
`firestore.indexes.json`; indexes are deployed, not migrated as data.

Dry run must produce a per-community plan with expected counts and zero writes.
Re-run the same dry run and require identical counts before authorizing a
bounded batch. For each batch, verify current revisions/lookup ownership inside
a transaction; invalidate only legacy redeemable lookup(s), audit the
invalidation in restricted administration records, and set a legacy community's
`activeInvitationId` to `null` in the same controlled operation. Preserve
Accepted history under the approved retention policy. Do not mark Accepted
reusable, backfill a digest as active, infer plaintext from a digest, or
reactivate a legacy invitation. Persist a batch checkpoint outside
member-readable data; repeat a batch must detect already-invalidated lookups and
make zero additional changes. Compare attempted/changed/skipped/conflicted
counts to the dry-run plan, pause on any mismatch, and sample both old and new
callable behavior. Capture a Firestore backup/snapshot and document restore
limits before writes; rollback restores only reviewed metadata if safe, never an
old redeemable lookup or deleted private content. Existing model-2 records
require separate classification and should not be overwritten by a legacy batch.

Old clients and backend revisions may coexist. Rules must deny direct
invitation, digest, safety and push writes before new Functions are exposed; new
redemption validates `invitationModelVersion: 2`, active pointer and lookup. Do
not allow an old backend endpoint to redeem a legacy single-use code after
lookup invalidation. If this cannot be enforced during coexistence, disable
invitation writes and set a minimum supported build policy before rollout. Test
old-build denial and new-build manual-code acceptance against the exact deployed
revisions.

## Staging sequence (external writes require separate authorization)

Use a separately registered staging Firebase project and staging native app
identity. The current hard-coded Firebase client makes a staging build unsafe
until environment wiring is separately approved and implemented. Set an explicit
shell variable in the operator session and verify it interactively; never use
the default alias implicitly:

```sh
test -n "$FIREBASE_PROJECT_ID" && test "$FIREBASE_PROJECT_ID" = "<approved-staging-project-id>"
firebase projects:list
firebase functions:list --project "$FIREBASE_PROJECT_ID"
firebase firestore:indexes --project "$FIREBASE_PROJECT_ID" --database '(default)'
```

Confirm approved legacy-migration evidence, backup, Rules tests, signed
build/project mapping, Functions region, Node 22/runtime availability,
billing/APIs, and operator access. Review existing deployed Rules/indexes before
replacing them; `firebase.json` predeploy runs Functions lint/build. Deploy
restrictive Rules first, then indexes, wait until required composite and
collection-group indexes are READY, provision secrets through secure entry, and
deploy approved named Functions. Commands below are examples to execute **only**
under an approved change record:

```sh
firebase deploy --project "$FIREBASE_PROJECT_ID" --only firestore:rules
firebase deploy --project "$FIREBASE_PROJECT_ID" --only firestore:indexes
firebase functions:secrets:set COMMUNITY_INVITATION_ENCRYPTION_KEYS --project "$FIREBASE_PROJECT_ID"
firebase functions:secrets:set EXPO_PUSH_ACCESS_TOKEN --project "$FIREBASE_PROJECT_ID"
firebase functions:secrets:set API_BIBLE_KEY --project "$FIREBASE_PROJECT_ID"
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:issueCommunityInvitation,functions:getCurrentCommunityInvitation,functions:rotateCommunityInvitation,functions:revokeCommunityInvitation,functions:previewCommunityInvitation,functions:acceptCommunityInvitation
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:deliverCommunityNotificationEvents,functions:registerCommunityPushInstallation,functions:unregisterCommunityPushInstallation,functions:openCommunityPushNotification,functions:sendCommunityPushOutbox,functions:checkCommunityPushReceipts
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:activateDueCommunityJourneyEnrollments,functions:resumeCommunityCleanup,functions:communityAuthUserDeleted,functions:refreshTodayVerses
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:createCommunity,functions:getCommunity,functions:listCommunities,functions:getCommunityContext,functions:listCommunityPage,functions:listCommunityMembers,functions:updateCommunity,functions:closeCommunity,functions:leaveCommunity,functions:removeCommunityMember,functions:transferCommunityOrganizer
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:createCommunityPost,functions:getCommunityPost,functions:listCommunityPosts,functions:editCommunityPost,functions:deleteCommunityPost,functions:createCommunityReply,functions:listCommunityReplies,functions:editCommunityReply,functions:deleteCommunityReply,functions:setCommunityPrayerRequestStatus,functions:setCommunityPrayerAcknowledgment,functions:listCommunityPrayerSupport,functions:listOwnCommunityContributions
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:configureCommunityJourney,functions:getCommunityJourneySchedule,functions:getCommunityJourneyCourseOption,functions:reviseCommunityJourney,functions:cancelCommunityJourney,functions:listCommunityJourneyHistory,functions:enrollCommunityJourney,functions:getCommunityJourneyEnrollment,functions:withdrawCommunityJourneyEnrollment,functions:retryCommunityJourneyActivation
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:getCommunityProgressSharing,functions:setCommunityProgressSharing,functions:listSharedCommunityProgress,functions:getCommunityAggregateProgress,functions:getCommunityNotificationPreferences,functions:listCommunityNotifications,functions:openCommunityNotification,functions:markCommunityNotificationRead,functions:setCommunityNotificationPreferences
firebase deploy --project "$FIREBASE_PROJECT_ID" --only functions:reportCommunityContent,functions:blockCommunityMember,functions:unblockCommunityMember,functions:listBlockedCommunityMembers,functions:listCommunitySafetyReports,functions:claimCommunitySafetyReport,functions:getCommunitySafetyReport,functions:reviewCommunityReport
```

Other community callables are exported in `functions/src/index.ts` (creation,
administration, posts, replies, journeys, progress, readers, safety and review).
Before enabling Communities, compare the full built export list with
`firebase functions:list --project "$FIREBASE_PROJECT_ID"`; deploy the complete
approved inventory by **named** functions in bounded groups and verify no
removed export is implicitly deleted. Do not interpret a CLI exit caused by
Artifact Registry cleanup prompts as proof of resource failure or success;
reconcile the actual function inventory and logs. Firebase warns that broad
Functions deployment can delete exports omitted from source.
[Firebase Functions management](https://firebase.google.com/docs/functions/manage-functions),
[Firebase CLI deployment](https://firebase.google.com/docs/cli).

Inspect Cloud Scheduler jobs and logs for `deliverCommunityNotificationEvents`
(five minutes), `sendCommunityPushOutbox` (one minute),
`checkCommunityPushReceipts` (five minutes),
`activateDueCommunityJourneyEnrollments` (five minutes),
`resumeCommunityCleanup` (one minute), and `refreshTodayVerses` (weekly Sunday
03:00 UTC). Confirm due-task indexes READY, bounded retries, receipt status,
stuck Sending leases, notification fan-out cursors, activation blocked outcomes,
cleanup backlog and failed Auth deletion trigger. Alert on failure/backlog with
an adopted operator threshold; no response-time promise exists until adopted by
operators. Test authenticated workflows, Rules denial, worker execution and
receipt processing in staging with real accounts and devices. Record exact
resource revisions and evidence, not just command output.

## Production sequence and rollback

Repeat staging preflight with a separately approved production project ID and
production build, signed credentials and secrets. Confirm migration/backup
counts against production, reviewer provisioning, safety operations, privacy/UGC
review, device tests, monitoring, deletion checks, and approved rollout/minimum
build policy. Use the same explicit `--project "$FIREBASE_PROJECT_ID"` order,
with production IDs approved in an external change record. Do not copy staging
or test secrets into production. Release the public build flag only after
backend and manual acceptance pass. The only current Firebase project in this
checkout is `faithful-4325a`; its production/staging classification must be
confirmed by the account owner. No live command in this runbook has been
executed for this ticket.

If invitation, posting, or delivery behavior is unsafe, stop the affected
writes/invitations or pause delivery jobs using an approved operational control,
preserve strict Rules, and investigate durable queues and audit records.
Rotate/revoke invitation codes deliberately where compromised. Revert only to a
backend revision compatible with current Rules and model-2 records; do not
restore legacy redemption, weaken Rules, or restore deleted private bodies. Push
rollback disables sender/receipt delivery without erasing in-app notifications;
monitor pending tasks and coordinate safe replay or abandonment. Record affected
users, window and evidence.

## Native push and invitation links

`app.json` currently has scheme `mobile`, iOS bundle `com.anonymous.mobile`, no
Android package, no `extra.eas.projectId`, no EAS build profiles, no iOS
associated domains and no Android HTTPS intent filters. These are operator
identity decisions, not values to guess. Push uses installed
`expo-notifications` and `expo-constants`, requests OS permission, creates
Android channel `community`, obtains an Expo token with the EAS project ID,
stores an installation secret locally, and registers through
`registerCommunityPushInstallation`. Web is unavailable. Provision valid EAS
project identity, APNs credentials for iOS and FCM V1 credentials for Android,
enhanced Expo push security and `EXPO_PUSH_ACCESS_TOKEN`, then create a
compatible signed native build. Test permission grant/denial/revocation, token
refresh, account switch/unregister, sender ticket, receipt, device display, and
app tap in foreground/background/terminated states on both platforms. Tap
handling calls `openCommunityPushNotification` and rechecks account/content
access; invalid or unavailable targets do not grant access. In-app inbox success
and Expo ticket/receipt success do not prove device display.
[Expo setup](https://docs.expo.dev/push-notifications/push-notifications-setup/),
[Expo delivery and receipts](https://docs.expo.dev/push-notifications/sending-notifications/).

Current invitation shares `mobile:///communities/join?invitationCode=<code>`
plus the visible manual code. An installed compatible app can receive the scheme
link and preserve an invite intent through sign-in; the Join screen accepts
manual entry. Verify both on signed iOS and Android builds, including changed
account, expiry, revoke and no-app cases. There is no verified owned HTTPS
domain or landing page configured. Automatic post-install continuation is
**not** implemented; users must keep and enter the code after installation. Do
not use retired Firebase Dynamic Links. An owned-domain enhancement requires
documented ownership, HTTPS landing page/manual fallback, iOS
associated-domain/AASA verification, Android `intentFilters`/`assetlinks.json`
verification and signed-build tests. Configure only after real domain and
identity are supplied; it does not replace manual code.
[Expo link overview](https://docs.expo.dev/linking/overview/),
[Android App Links](https://docs.expo.dev/linking/android-app-links/).

## Safety and final evidence gate for prompt 42

Separately authorize and provision real reviewer identities with server custom
claim `communitySafetyReviewer: true`, independent from Organizer/membership;
verify claim revocation and restricted report/evidence access. Establish an
actual safety/support contact and an independent reviewer/escalation path.
Review current Apple/Google UGC rules before submission; approve report
handling, blocking, content removal, evidence retention, cleanup and deletion
periods. Test user deletion, community exit, closed archive, restricted safety
evidence retention and private writing isolation. Never promise a response time
without an adopted staffed policy. Recheck
[Apple App Review Guideline 1.2](https://developer.apple.com/app-store/review/guidelines/)
and
[Google Play UGC policy](https://support.google.com/googleplay/android-developer/answer/9876937)
at submission time.

Before prompt 42 can pass, attach external evidence for: approved
project/environment and native IDs; staging and production migration
inventories, backups and bounded-batch results (or verified zero legacy
records); Rules/index READY states and named Function revisions; real secret
versions/bindings without values; Scheduler/receipt/fan-out/cleanup logs and
alerts; independent reviewer grant/revocation and safety contact;
UGC/privacy/deletion policy approval; signed iOS/Android build tests for manual
and installed-app links and actual push delivery/taps; old-client
compatibility/minimum build; and production rollout/rollback approval. Missing
runtime, Java/emulators, credentials, account access, domain ownership or
devices are release blockers where required. A written command, compilation,
mock, or local test is not a deployed resource or release approval.
