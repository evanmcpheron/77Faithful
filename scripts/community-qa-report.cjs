const {
	accounts,
	communities,
	posts,
	replies,
	expectedMemberships,
} = require('./community-qa-data.cjs');

const cell = (value) =>
	String(value ?? 'Not verified')
		.replaceAll('|', '\\|')
		.replaceAll('\n', ' ');
const table = (headers, rows) =>
	[headers, headers.map(() => '---'), ...rows]
		.map((row) => `| ${row.map(cell).join(' | ')} |`)
		.join('\n');
const redact = (text, secrets = []) => {
	let safe = text;
	for (const secret of secrets.filter(Boolean))
		safe = safe.split(secret).join('[REDACTED]');
	return safe
		.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
		.replace(
			/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
			'[REDACTED TOKEN]',
		)
		.replace(
			/((?:password|refresh_token|idToken|access_token|authorization|cookie)\s*[=:]\s*)[^\s,;}]+/gi,
			'$1[REDACTED]',
		);
};

const renderReport = (
	execution,
	state = { history: [], operations: {} },
	secrets = [],
) => {
	const provisioned = Object.values(execution.accounts).filter(
		(item) => item.provisioned,
	).length;
	const verified = Object.values(execution.accounts).filter(
		(item) => item.verified,
	).length;
	const succeeded = (name, account) =>
		execution.checks.some(
			(item) =>
				item.name === name &&
				item.status === 'verified' &&
				(account === undefined || item.account === account),
		);
	const issueCounts = ['warning', 'recoverable', 'blocking']
		.map(
			(severity) =>
				`${execution.issues.filter((item) => item.severity === severity).length} ${severity}`,
		)
		.join(', ');
	const features = [
		[
			'Email/password, verified identities, preferred names',
			'Yes',
			accounts.every(
				(account) =>
					succeeded(
						'Fresh password login and verified email',
						account.number,
					) && succeeded('Profile name', account.number),
			),
			'1–10',
		],
		[
			'Empty community list',
			'Yes',
			succeeded('Exact active community count', 1) &&
				succeeded('Exact active community count', 5),
			'1, 5',
		],
		[
			'Private invitation-only communities; Organizer and Member',
			'Yes',
			succeeded('Ownership and lifecycle circle'),
			'2–4, 6–10',
		],
		[
			'Reusable code, outsider preview, explicit acceptance',
			'Yes',
			succeeded('Invitation preview'),
			'1, 4 and members',
		],
		[
			'Ownership transfer',
			'Yes',
			succeeded('Ownership and lifecycle handoff'),
			'6, 10',
		],
		[
			'Left and removed membership; own contributions retained',
			'Yes',
			[7, 9].every(
				(number) =>
					succeeded('Membership circle', number) &&
					succeeded('Own contributions', number),
			),
			'7, 9',
		],
		[
			'Closed community archive',
			'Yes',
			succeeded('Ownership and lifecycle archive'),
			'4, 6, 9, 10',
		],
		[
			'Empty / one-post / dense feeds',
			'Yes',
			['quiet', 'prayer', 'circle'].every((key) =>
				succeeded(`Post count ${key}`),
			),
			'6 / 10 / 4, 8',
		],
		[
			'Four post types; author edit/delete; moderation tombstone',
			'Yes',
			[
				'shared-copy',
				'author-deleted',
				'safety-removed',
				'welcome',
			].every((key) => succeeded(`Post ${key}`)),
			'2–4, 8',
		],
		[
			'One-level replies; reply edit and delete',
			'Yes',
			succeeded('Reply pagination'),
			'2–4, 6–10',
		],
		[
			'Feed/reply pagination (actual page size 20)',
			'Yes',
			succeeded('Feed pagination') && succeeded('Reply pagination'),
			'4, 8, 10',
		],
		[
			'Three prayer statuses; reversible acknowledgments',
			'Yes',
			succeeded('Prayer acknowledgments') &&
				succeeded('Post prayer-answered') &&
				succeeded('Post prayer-past'),
			'2, 3, 6, 8, 10',
		],
		[
			'Blocking, filtered feeds, notification controls',
			'Yes',
			succeeded('Blocked-author feed filtering') &&
				succeeded('Notification preferences'),
			'6 blocks 8',
		],
		[
			'In-app inbox; read/unread states',
			'Yes',
			succeeded('Read and unread activity'),
			'3, 10',
		],
		[
			'Safety reviewer queue; submitted/claimed/resolved cases',
			'Yes',
			['submitted', 'under-review', 'removed', 'no-action'].every((key) =>
				succeeded(`Report ${key}`),
			),
			'5; reporters 3, 10',
		],
		[
			'Future schedule, frozen enrollment, withdrawal, cancellation',
			'Yes',
			succeeded('Frozen future schedule') &&
				succeeded('Canceled schedule'),
			'2, 3, 4, 6, 10',
		],
		[
			'Independent progress consent; aggregate suppression',
			'Yes',
			succeeded('Independent progress consent') &&
				succeeded('Aggregate suppression'),
			'3, 6, 10',
		],
		[
			'Scheduled activation and visible personal progress stages',
			'Yes',
			false,
			'Time-dependent; not backdated',
		],
		[
			'Invitation rotation/revocation/expiry and rejoining',
			'Yes',
			false,
			'Manual actions; current membership fixtures preserved',
		],
		[
			'Native push device delivery',
			'Yes',
			false,
			'Requires device installation and Expo configuration',
		],
		[
			'Public discovery, pending membership approval, admin/moderator membership role',
			'No',
			false,
			'Not implemented',
		],
		[
			'Avatars, biography, attachments, generic likes, nested replies, chat/DM',
			'No',
			false,
			'Not implemented in Community MVP',
		],
	];
	const parts = [
		'# Community MVP v1 — QA Seed Execution Report',
		'## 1. Executive Summary',
		`Execution: **${execution.status}**. Started ${execution.startedAt}; finished ${execution.finishedAt || 'not finished'}. Target: hosted Firebase **faithful-4325a**, us-central1, explicitly identified by the repository owner as a non-production test project. Branch: **${execution.branch || 'unverified'}**; application source commit: **${execution.commit || 'unverified'}**. This report describes API observations, not a deployment or release certification.`,
		`**${provisioned}/10 accounts provisioned/authenticated; ${verified}/10 fully verified.** ${Object.keys(execution.communities).length}/5 communities verified as present. Current run: ${issueCounts}. ${execution.mutations} newly checkpointed callable mutations; ${execution.reusedOperations} checkpoint reuses; ${execution.requests} callable requests.`,
		...(execution.checks.some(
			(item) =>
				item.name.startsWith('Post timestamp API contract') &&
				item.status === 'failed',
		)
			? [
					'**Feed UI limitation:** post APIs return SDK timestamp field names that the current client parser rejects. Seeded content is present, but feed/post screens may display an error. See the reproduction notes below.',
				]
			: []),
		...(execution.courseDiagnostic?.mismatchedDays.length
			? [
					`**Enrollment limitation:** ${execution.courseDiagnostic.mismatchedDays.length} of ${execution.courseDiagnostic.totalDays} configured course days have theme IDs incompatible with this branch. Accounts 2, 3, 6, and 10 have saved setup choices but no confirmed enrollment or seeded progress consent.`,
				]
			: []),
		'No product behavior, shared components, domain types, dependencies, Security Rules, or deployed functions were changed. Profiles and enrollment choices use authenticated Firestore client transactions, as the app does. Community resources use callable APIs. Admin Auth is used only for these ten accounts’ email verification and account 5’s test reviewer claim, following the existing integration-test provisioning approach. The existing notification fan-out service processes only events belonging to the seeded communities; no notification documents or Community records are inserted directly.',
		'## 2. How to Run the Seeder',
		'Prerequisites: existing root and functions dependencies, Node compatible with the repository, and Firebase administrative access through Application Default Credentials or the already installed, signed-in Firebase CLI. No service-account keys are copied into this repository. Run from the community branch.',
		'```sh\nnpm --prefix functions run build\nexport GCLOUD_PROJECT=faithful-4325a\nexport COMMUNITY_QA_ENVIRONMENT=non-production\n# Set COMMUNITY_QA_PASSWORD securely to the shared password supplied by the task owner.\nnode scripts/seed-community-qa.cjs\n# Read-back only; does not seed or reconcile application data:\nnode scripts/seed-community-qa.cjs --verify-only\nnode --test tests/community-qa-seed.test.cjs\n```',
		'The password is the same for all ten accounts. Obtain it from the original task owner; it is never included in this file. The app already targets this Firebase project. Ensure EXPO_PUBLIC_COMMUNITIES_ENABLED=true in the local Expo environment, restart Expo after changing build-time flags, and use normal email/password sign-in. Accounts have verified email. Membership does not require starting a personal journey.',
		'Reruns authenticate existing accounts and reuse deterministic server operation IDs plus .community-qa/checkpoint.json. Keep this ignored checkpoint: it binds generated IDs to the project, account UIDs, and fixture definition hash. A successful checkpoint does not substitute for verification; every run reads final state again. Existing profile edits, manual membership changes, completed/deleted content, or expired schedules are reported as drift rather than forcibly overwritten. After interruption, rerun the same command. After RateLimited, allow the server’s ten-minute submission window to pass before rerunning. Do not delete the checkpoint to “reset” existing hosted data. No wipe/reset command is provided.',
		'The script rejects NODE_ENV=production, a production classification, other projects, mixed emulator settings, and missing required environment variables. There is no production override. The pinned project approval must be removed if this project is ever repurposed as production. A local exclusive lock prevents concurrent seed runs; if a process was killed, first confirm no seeder is running before removing only .community-qa/seed.lock.',
		'## 3. Community MVP Feature Inventory',
		table(
			[
				'Feature',
				'Implemented',
				'Verified dataset coverage',
				'Accounts / notes',
			],
			features.map(([feature, supported, covered, notes]) => [
				feature,
				supported,
				covered ? 'Yes' : 'No / see gaps',
				notes,
			]),
		),
		'Implementation sources: docs/community-implementation-plan.md; docs/community-api-contract.md; functions/src/index.ts; functions/src/community/; src/features/communities/; src/types/community/; firestore.rules; firestore.indexes.json. Existing test references include tests/community-workflow.ticket40.emulator.test.cjs and the Community emulator suites. The manifest’s referenced product/ directory is absent from this branch; the adopted community implementation plan and actual implementation were inspected instead. No relational migrations exist; Firestore document contracts, native timestamps, revisions, indexes, and validators define persistence.',
		'## 4. Account Overview',
		table(
			[
				'Account',
				'Purpose',
				'Observed active communities',
				'Observed posts / replies',
				'Verified',
			],
			accounts.map((account) => {
				const observed = execution.accounts[account.number];
				return [
					account.email,
					account.purpose,
					observed?.memberships?.filter(
						(item) => item.status === 'Active',
					).length,
					observed
						? `${observed.posts ?? '?'} / ${observed.replies ?? '?'}`
						: 'Not verified',
					observed?.verified ? 'Yes' : 'No / partial',
				];
			}),
		),
		'## 5. Detailed Accounts',
	];
	for (const account of accounts) {
		const observed = execution.accounts[account.number];
		const expected = expectedMemberships(account.number);
		parts.push(
			`### ${account.email}`,
			`Purpose: ${account.purpose}.`,
			`Profile: expected preferred name **${account.preferredName || '(absent)'}**; observed **${observed ? cell(observed.preferredName ?? '(absent)') : 'not verified'}**. Community profiles have no avatar or biography fields. Authentication: ${observed?.authenticated ? 'fresh password login succeeded' : 'not verified'}; email verification: ${observed?.emailVerified === true ? 'confirmed by Auth' : 'not verified'}. Reviewer claim: ${observed ? String(observed.reviewer ?? 'not verified') : 'not verified'}.`,
			table(
				[
					'Community',
					'Intended role / membership',
					'Observed role / membership',
				],
				expected.map((membership) => {
					const actual = observed?.memberships?.find(
						(item) => item.key === membership.key,
					);
					return [
						membership.key,
						`${membership.role} / ${membership.status}`,
						actual
							? `${actual.role} / ${actual.status}`
							: 'Not verified',
					];
				}),
			),
			expected.length
				? ''
				: 'Expected no memberships or owned communities.',
			`Intended contributions: ${
				posts
					.filter((post) => post.author === account.number)
					.map((post) => post.key)
					.join(', ') || 'none'
			}; ${replies.filter((reply) => reply.author === account.number).length} replies. Observed own-contribution API counts: ${observed?.posts ?? 'unverified'} posts and ${observed?.replies ?? 'unverified'} replies. Contributions include retained deletion/moderation tombstones.`,
			`Observed notifications: ${observed?.notifications ?? 'unverified'} total, ${observed?.unread ?? 'unverified'} unread, ${observed?.notificationPages ?? 'unverified'} page(s). Blocked accounts: ${observed?.blockedAccounts?.join(', ') || (observed?.blockedAccounts ? 'none' : 'unverified')}. Enrollment: ${observed?.enrollment ?? 'not enrolled by this fixture / unverified if dependent step failed'}.`,
			`Manual review: ${manualSuggestion(account.number, observed)}.`,
			`Account-specific warnings/errors this run: ${
				execution.issues
					.filter((issue) => issue.account === account.email)
					.map(
						(issue) =>
							`${issue.severity}: ${issue.operation} (${issue.code}/${issue.reason})`,
					)
					.join('; ') || 'none recorded'
			}. Global and cross-account checks also apply.`,
		);
	}
	parts.push(
		'## 6. Seeded Community Overview',
		table(
			[
				'Key / name',
				'Verified ID',
				'Purpose',
				'Observed members / posts / pages',
			],
			communities.map((community) => {
				const observed = execution.communities[community.key];
				return [
					`${community.key}: ${community.name}`,
					observed?.communityId || 'Not verified',
					community.purpose,
					observed
						? `${observed.members} / ${observed.posts} / ${observed.pages}`
						: 'Not verified',
				];
			}),
		),
		'Community names carry [COMMUNITY-QA]. circle contains all four post types, 25 posts, three prayer states, one edited shared copy, author and moderator tombstones, and a 25-reply thread. quiet is empty; prayer has one request; archive has two entries and is closed; handoff has one announcement, a transferred Organizer, and canceled schedule history. These are intended counts; the table above and verification results establish actual state.',
		'## 7. Social / Relationship Matrix',
		table(
			['Relationship', 'Intended state', 'Verification evidence'],
			[
				[
					'4 → circle',
					'Organizer; 2, 3, 6, 8, 10 active members',
					succeeded('Member roster circle')
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'7 → circle',
					'Left; own shared writing retained',
					execution.accounts[7]?.verified
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'9 → circle / archive',
					'Removed from circle; active archive member',
					execution.accounts[9]?.verified
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'6 → 8',
					'Blocks account 8; hides its published writing',
					succeeded('Blocked-author feed filtering')
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'2, 6, 8 → 3',
					'Praying on current request; 10 withdrew support',
					succeeded('Prayer acknowledgments')
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'10 → 6',
					'Organizer handoff; 10 remains Member',
					succeeded('Ownership and lifecycle handoff')
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'5 → safety reports',
					'Independent platform reviewer; no memberships',
					succeeded('Report under-review')
						? 'Verified'
						: 'Not fully verified',
				],
				[
					'3 / 6 / 10 → progress',
					'Both consent / aggregate only / individual only',
					succeeded('Aggregate suppression')
						? 'Suppression verified; per-account checks below'
						: 'Not fully verified',
				],
			],
		),
		'## 8. Error and Warning Log',
		'Historical implementation issues: the initial credential adapter could authenticate but was incompatible with Admin Firestore; it was corrected to use the installed Google Firestore client with the same CLI identity in memory. The initial verifier incorrectly attempted client reads of protected membership indexes and expected a community ID in invitation previews; both verifier assumptions were corrected. Those earlier errors remain in execution history for auditability and are separate from the product defects below.',
		table(
			[
				'Severity',
				'Account',
				'Operation',
				'Endpoint / service',
				'Code / reason',
				'Impact',
				'Continued',
			],
			execution.issues.map((issue) => [
				issue.severity,
				issue.account || 'Environment / dataset',
				issue.operation,
				issue.endpoint,
				`${issue.code} / ${issue.reason}`,
				issue.impact,
				issue.continued ? 'Yes' : 'No dependent writes',
			]),
		),
		execution.issues.length
			? ''
			: 'No warnings or errors recorded in this execution.',
		'### Earlier executions retained in the local checkpoint',
		table(
			[
				'Time',
				'Status',
				'Provisioned / verified',
				'Mutations / checkpoint reuses',
				'Warnings / errors',
			],
			(state.history || []).map((run) => [
				run.startedAt,
				run.status,
				`${run.provisioned} / ${run.verified}`,
				`${run.mutations} / ${run.reusedOperations}`,
				run.issues?.length ?? 0,
			]),
		),
		...(state.history || []).flatMap((run) =>
			(run.issues || []).map(
				(issue) =>
					`- ${run.startedAt}: ${issue.severity}; ${issue.account || 'dataset'}; ${issue.operation}; ${issue.endpoint}; ${issue.code}/${issue.reason}; ${issue.impact}. Earlier failure, not evidence of a current failure if the latest verification passes.`,
			),
		),
		'## 9. Verification Results',
		`Verified checks: ${execution.checks.filter((item) => item.status === 'verified').length}. Failed checks: ${execution.checks.filter((item) => item.status === 'failed').length}. Account verification means all recorded account checks passed with no account-level recoverable/blocking errors; cross-account and dataset checks are reported separately. A partial run is never marked complete.`,
		table(
			['Account', 'Check', 'Result', 'Evidence'],
			execution.checks.map((item) => [
				item.account || 'Dataset',
				item.name,
				item.status,
				item.detail,
			]),
		),
		'The creation response is not the verification source. Checks use fresh Auth login, server-only client profile reads, callable community/context/member readers, full bounded cursor traversal, exact authors/content/status comparisons, private own-contribution reads, notification and block readers, reviewer reads, and journey/consent readers. Membership indexes intentionally deny client reads; narrowly scoped administrative reads confirm the Left/Removed lifecycle while callables independently verify actual access. Formation metadata reads diagnose enrollment failures. These administrative diagnostics do not mutate data. Protected-read denials are verified without creating unauthorized resources.',
		'### Product findings and reproduction',
		...(execution.checks.some(
			(item) =>
				item.name.startsWith('Post timestamp API contract') &&
				item.status === 'failed',
		)
			? [
					'- **Post response timestamp contract:** log in as account 4 or 8 and open the main circle; the same issue affects nonempty archives. listCommunityPosts/getCommunityPost expose native Firestore timestamp serialization (_seconds/_nanoseconds), while src/features/communities/community-post.service.ts requires seconds/nanoseconds. functions/src/community/community-post.ts returns native timestamps from postProjection. API records and cursor ordering are verified, but UI compatibility fails. This seed does not repair or deploy a product change.',
				]
			: []),
		...(execution.courseDiagnostic?.mismatchedDays.length
			? [
					`- **Configured course mismatch:** ${execution.courseDiagnostic.courseId}/${execution.courseDiagnostic.courseVersionId}; affected days ${execution.courseDiagnostic.mismatchedDays.join(', ')}. Log in as 2, 3, 6, or 10, open the main circle’s shared schedule, review the saved Movement/Gratitude and WEB setup, and attempt enrollment. enrollCommunityJourney returns failed-precondition / ContentUnavailable. requirePublishedCourse in functions/src/journey/start-journey.ts rejects day theme IDs that differ from FormationThemeOrder. No Scripture, course metadata, private journey, or progress record was changed to bypass this check.`,
				]
			: []),
		'- **Line-break validation:** src/features/communities/community-post.ts rejects control characters including newline. A two-line Discussion is rejected by parseCreateCommunityPostRequest. Seeded writing uses single-paragraph text to follow the current contract; long text still wraps naturally. This is a documented implementation constraint, not a deliberately invalid seeded post.',
		'## 10. Manual QA Suggestions',
		table(
			[
				'Scenario',
				'Login as account',
				'Expected state (subject to verification above)',
			],
			accounts.map((account) => [
				manualSuggestion(
					account.number,
					execution.accounts[account.number],
				),
				account.number,
				account.purpose,
			]),
		),
		'## 11. Known Coverage Gaps',
		...(execution.deployedFunctions.length &&
		!execution.deployedFunctions.includes(
			'registerCommunityPushInstallation',
		)
			? [
					'The hosted Functions inventory does not include registerCommunityPushInstallation. Push implementation exists in source, but its deployment and device delivery are not verified in this project.',
				]
			: []),
		'- Native push, OS permissions, delivery receipts, and device taps require a configured real device. No device registrations or fake push tokens are seeded.\n- There are no pending join approvals, public communities, moderator memberships, avatars, biographies, attachments, nested replies, generic likes, or direct messages in this MVP.\n- Ten identities cannot cross the 20-member roster page boundary. Five useful communities do not cross the community-list page boundary. Feed and replies intentionally cross their real 20-item boundaries.\n- Dates are server-owned. Content was created during this execution; no historical audit timestamps were forged. Future enrollment remains scheduled until the actual date, and later reruns report time-dependent drift. No personal journeys, private reflections, completion marks, or holiness/progress scores were fabricated.\n- Published course availability is read from the existing API. No course import or global formation configuration change is made. If course access or private setup is unavailable, schedule/enrollment gaps appear in the error log.\n- The dataset shows aggregate suppression, not an available aggregate with five qualifying started participants.\n- Invitation rotation, revocation, expiration, rejoining, and unblocking are manual scenarios; the seed preserves stable reviewable final states. Removed users cannot be reinstated through an ordinary invitation.\n- Transient network, loading, offline, and concurrent-edit conflicts are not persistent fixture states. Use manual network controls or existing integration tests.\n- No cleanup/reset is provided because closure, removal, reviewer decisions, and content deletion have terminal semantics. Reconciliation preserves successful resources and reports manual drift.\n- The initial sandbox network probe failed; the authenticated read-only inventory succeeded when network access was granted. No product bug is inferred from a sandbox connectivity failure.',
	);
	return redact(
		parts.filter((part) => part !== '').join('\n\n') + '\n',
		secrets,
	);
};

const manualSuggestion = (number, observed) => {
	if (observed?.enrollment === 'Missing')
		return {
			2: 'Read the answered request and prayer support; review saved setup and reproduce unavailable enrollment',
			3: 'Inspect the edited shared reflection, busy thread, and read/unread inbox; enrollment is currently unavailable',
			6: 'Compare empty and transferred communities, blocked members, and muted replies; progress remains private because enrollment is unavailable',
			10: 'Inspect the one-request circle, former Organizer membership, and read/unread inbox; enrollment is unavailable and progress remains private',
		}[number];
	return {
		1: 'Open Communities for the empty list; obtain a current code from account 4 to preview joining without a personal journey',
		2: 'Read the answered request, inspect prayer support, and inspect the withdrawn enrollment',
		3: 'Inspect the edited shared reflection, busy thread, read/unread notifications, and frozen scheduled enrollment',
		4: 'Review invitation controls, member management, safety-access denial, and the closed archive',
		5: 'Open Settings → Platform safety → Safety reports; inspect submitted, claimed, removed-content, and no-action reports',
		6: 'Compare the empty community with the transferred community; inspect blocked members, muted replies, and aggregate-only consent',
		7: 'Confirm the main circle is absent; open Settings → shared contributions to manage retained writing',
		8: 'Scroll through the long conversation and load the second feed/reply pages; compare author deletion and moderation placeholders',
		9: 'Confirm the main circle is unavailable and the archive is read-only; inspect own contributions',
		10: 'Inspect the one-request prayer circle, former Organizer membership, read/unread inbox, and individual-only consent',
	}[number];
};

module.exports = { renderReport, redact };
