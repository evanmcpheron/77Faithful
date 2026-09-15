const {
	signInWithEmailAndPassword,
	getIdTokenResult,
} = require('firebase/auth');
const { doc, getDocFromServer } = require('firebase/firestore');
const {
	accounts,
	communities,
	posts,
	replies,
	expectedMemberships,
} = require('./community-qa-data.cjs');
const { communityId, postId } = require('./community-qa-seed.cjs');
const { recordFailure, safeError } = require('./community-qa-runtime.cjs');

const timestampNumber = (timestamp) =>
	(timestamp.seconds ?? timestamp._seconds) +
	(timestamp.nanoseconds ?? timestamp._nanoseconds) / 1e9;

const check = (runtime, number, name, passed, detail) => {
	runtime.execution.checks.push({
		account: number,
		name,
		status: passed ? 'verified' : 'failed',
		detail,
	});
	if (!passed)
		recordFailure(
			runtime.execution,
			'recoverable',
			number ? accounts[number - 1].email : null,
			name,
			'API read-back verification',
			{ code: 'QA/StateDiscrepancy' },
			detail,
		);
	return passed;
};
const denied = async (runtime, number, endpoint, request, expectedReasons) => {
	try {
		await runtime.call(number, endpoint, request);
		check(
			runtime,
			number,
			`${endpoint} restriction`,
			false,
			'Expected access denial; request succeeded.',
		);
	} catch (error) {
		const { code, reason } = safeError(error);
		check(
			runtime,
			number,
			`${endpoint} restriction`,
			code === 'functions/permission-denied' &&
				expectedReasons.includes(reason),
			`Observed ${code}, ${reason}.`,
		);
	}
};

const verifyAccounts = async (runtime) => {
	for (const account of accounts) {
		if (!runtime.execution.accounts[account.number]?.provisioned) continue;
		await runtime.run(
			account.number,
			'Verify account and relationships',
			'Auth / Firestore client / Community read callables',
			async () => {
				const number = account.number;
				const client = runtime.clients.get(number);
				const result = await signInWithEmailAndPassword(
					client.auth,
					account.email,
					process.env.COMMUNITY_QA_PASSWORD,
				);
				const token = await getIdTokenResult(result.user, true);
				const observed = runtime.execution.accounts[number];
				observed.emailVerified = result.user.emailVerified;
				observed.reviewer =
					token.claims.communitySafetyReviewer === true;
				check(
					runtime,
					number,
					'Fresh password login and verified email',
					result.user.email === account.email &&
						result.user.uid === runtime.state.accounts[number] &&
						result.user.emailVerified,
					'Fresh Firebase Auth password login; no cached creation response used.',
				);
				check(
					runtime,
					number,
					'Safety authority',
					observed.reviewer === (number === 5),
					number === 5
						? 'Platform safety reviewer claim required.'
						: 'No platform safety reviewer claim expected.',
				);
				const profile = await getDocFromServer(
					doc(client.db, 'users', result.user.uid),
				);
				observed.preferredName = profile.data()?.preferredName ?? null;
				check(
					runtime,
					number,
					'Profile name',
					profile.exists() &&
						observed.preferredName === account.preferredName,
					'Preferred name matches the account matrix. Existing profiles are preserved and discrepancies reported.',
				);
				const memberships = await runtime.pages(
					number,
					'listCommunityPage',
					{},
					'communities',
					'communityId',
				);
				observed.memberships = [];
				const expected = expectedMemberships(number);
				for (const membership of expected) {
					const id = communityId(runtime, membership.key);
					if (!id) {
						check(
							runtime,
							number,
							`Membership ${membership.key}`,
							false,
							'Seed community has not been provisioned.',
						);
						continue;
					}
					// Rules deny client index reads. Callables verify access; this narrow
					// administrative read additionally verifies terminal membership status.
					const index = await runtime.database
						.doc(
							`users/${result.user.uid}/communityMemberships/${id}`,
						)
						.get();
					const status = index.data()?.lifecycle?.status ?? 'Missing';
					observed.memberships.push({
						key: membership.key,
						status,
						role: index.data()?.role ?? 'Missing',
					});
					check(
						runtime,
						number,
						`Membership ${membership.key}`,
						status === membership.status &&
							index.data()?.role === membership.role,
						`Expected ${membership.status}/${membership.role}; observed ${status}/${index.data()?.role ?? 'Missing'}.`,
					);
					check(
						runtime,
						number,
						`List access ${membership.key}`,
						memberships.items.some(
							(item) => item.communityId === id,
						) ===
							(membership.status === 'Active'),
						'Only active memberships, including closed archives, appear in the community list.',
					);
					if (membership.status === 'Active') {
						const { context } = await runtime.call(
							number,
							'getCommunityContext',
							{ communityId: id },
						);
						const closed =
							communities.find(
								(item) => item.key === membership.key,
							).status === 'Closed';
						check(
							runtime,
							number,
							`Capabilities ${membership.key}`,
							context.membership.role === membership.role &&
								context.capabilities.canCreatePost ===
									!closed &&
								context.capabilities.canInviteMembers ===
									(!closed &&
										membership.role === 'Organizer'),
							'Member/Organizer capabilities and closed-archive write restrictions match.',
						);
					} else
						await denied(
							runtime,
							number,
							'getCommunityContext',
							{ communityId: id },
							['CommunityUnavailable'],
						);
				}
				check(
					runtime,
					number,
					'Exact active community count',
					memberships.items.length ===
						expected.filter((item) => item.status === 'Active')
							.length,
					`Observed ${memberships.items.length} active memberships.`,
				);
				const contributions = await runtime.pages(
					number,
					'listOwnCommunityContributions',
					{},
					'contributions',
				);
				observed.posts = contributions.items.filter(
					(item) => item.kind === 'Post',
				).length;
				observed.replies = contributions.items.filter(
					(item) => item.kind === 'Reply',
				).length;
				check(
					runtime,
					number,
					'Own contributions',
					observed.posts ===
						posts.filter((item) => item.author === number).length &&
						observed.replies ===
							replies.filter((item) => item.author === number)
								.length,
					`Observed ${observed.posts} posts and ${observed.replies} replies, including tombstones.`,
				);
				const notifications = await runtime.pages(
					number,
					'listCommunityNotifications',
					{},
					'notifications',
					'eventId',
				);
				observed.notifications = notifications.items.length;
				observed.unread = notifications.items.filter(
					(item) => item.readAt === null,
				).length;
				observed.notificationPages = notifications.pages;
				if ([1, 5, 7].includes(number))
					check(
						runtime,
						number,
						'Empty notification inbox',
						observed.notifications === 0,
						`Observed ${observed.notifications} visible notifications.`,
					);
				if ([3, 10].includes(number))
					check(
						runtime,
						number,
						'Read and unread activity',
						observed.unread > 0 &&
							observed.unread < observed.notifications,
						`Observed ${observed.unread} unread of ${observed.notifications} notifications.`,
					);
				const blocked = await runtime.pages(
					number,
					'listBlockedCommunityMembers',
					{},
					'members',
					'blockedUserId',
				);
				observed.blockedAccounts = blocked.items.map(
					(member) =>
						accounts.find(
							(candidate) =>
								runtime.state.accounts[candidate.number] ===
								member.blockedUserId,
						)?.number ?? 'external',
				);
				check(
					runtime,
					number,
					'Blocked members',
					number === 6
						? observed.blockedAccounts.length === 1 &&
								observed.blockedAccounts[0] === 8
						: observed.blockedAccounts.length === 0,
					number === 6
						? 'Only account 8 is blocked.'
						: 'No blocked accounts expected.',
				);
				if (number === 6 && communityId(runtime, 'circle')) {
					const preferences = await runtime.call(
						number,
						'getCommunityNotificationPreferences',
						{ communityId: communityId(runtime, 'circle') },
					);
					check(
						runtime,
						number,
						'Notification preferences',
						preferences.categories.Reply === false &&
							preferences.pushEnabled === false,
						'Replies and push are muted for the main circle.',
					);
					const feed = await runtime.pages(
						number,
						'listCommunityPosts',
						{ communityId: communityId(runtime, 'circle') },
						'posts',
						'postId',
					);
					check(
						runtime,
						number,
						'Blocked-author feed filtering',
						feed.items.every(
							(item) =>
								item.publication.status !== 'Published' ||
								item.author.userId !==
									runtime.state.accounts[8],
						),
						'Published writing by blocked account 8 is filtered.',
					);
				}
			},
		);
	}
};

const verifyCommunities = async (runtime) => {
	for (const community of communities) {
		const id = communityId(runtime, community.key);
		if (!id) {
			check(
				runtime,
				null,
				`Community ${community.key}`,
				false,
				'Community was not provisioned.',
			);
			continue;
		}
		await runtime.run(
			community.finalOwner,
			`Verify ${community.key}`,
			'Community context / members / paginated posts',
			async () => {
				const viewer =
					community.key === 'handoff' ? 3 : community.owner;
				const { context } = await runtime.call(
					viewer,
					'getCommunityContext',
					{ communityId: id },
				);
				check(
					runtime,
					null,
					`Ownership and lifecycle ${community.key}`,
					context.community.organizer.userId ===
						runtime.state.accounts[community.finalOwner] &&
						context.community.status === community.status,
					`Expected Organizer ${community.finalOwner}, ${community.status}.`,
				);
				const members = await runtime.pages(
					viewer,
					'listCommunityMembers',
					{ communityId: id },
					'members',
					'userId',
				);
				const expectedMembers = accounts.filter((account) =>
					expectedMemberships(account.number).some(
						(membership) =>
							membership.key === community.key &&
							membership.status === 'Active',
					),
				);
				check(
					runtime,
					null,
					`Member roster ${community.key}`,
					members.items.length === expectedMembers.length &&
						expectedMembers.every((account) =>
							members.items.some(
								(member) =>
									member.userId ===
									runtime.state.accounts[account.number],
							),
						),
					`Expected and observed ${expectedMembers.length}/${members.items.length} members.`,
				);
				const feed = await runtime.pages(
					viewer,
					'listCommunityPosts',
					{ communityId: id },
					'posts',
					'postId',
				);
				const definitions = posts.filter(
					(item) => item.community === community.key,
				);
				check(
					runtime,
					null,
					`Post count ${community.key}`,
					feed.items.length === definitions.length,
					`Expected ${definitions.length}, observed ${feed.items.length} posts.`,
				);
				const canonicalTimestamps = feed.items.every(
					(item) =>
						Number.isInteger(item.createdAt.seconds) &&
						Number.isInteger(item.createdAt.nanoseconds),
				);
				check(
					runtime,
					null,
					`Post timestamp API contract ${community.key}`,
					canonicalTimestamps,
					'Client parsers require seconds/nanoseconds. SDK _seconds/_nanoseconds are inspected only to diagnose ordering; they remain a failed API contract.',
				);
				const times = feed.items.map((item) =>
					timestampNumber(item.createdAt),
				);
				check(
					runtime,
					null,
					`Chronological ordering ${community.key}`,
					times.every(
						(time, index) =>
							index === 0 || times[index - 1] >= time,
					),
					'Newest first across every fetched page.',
				);
				for (const definition of definitions) {
					const observed = feed.items.find(
						(item) =>
							item.postId === postId(runtime, definition.key),
					);
					let matches =
						observed?.author?.userId ===
							runtime.state.accounts[definition.author] &&
						observed?.publication.status ===
							(definition.finalStatus || 'Published');
					if (definition.finalStatus)
						matches =
							matches &&
							!observed.publication.content &&
							!observed.publication.text;
					else
						matches =
							matches &&
							observed.publication.content.text ===
								(definition.edit || definition.text) &&
							observed.publication.content.postType ===
								definition.type &&
							(!definition.prayerStatus ||
								observed.publication.content
									.prayerRequestStatus ===
									definition.prayerStatus);
					check(
						runtime,
						null,
						`Post ${definition.key}`,
						Boolean(matches),
						'Author, content/type or text-free tombstone, and prayer status match the fixture.',
					);
				}
				runtime.execution.communities[community.key] = {
					communityId: id,
					status: context.community.status,
					owner: community.finalOwner,
					members: members.items.length,
					posts: feed.items.length,
					pages: feed.pages,
				};
				if (community.key === 'circle')
					check(
						runtime,
						null,
						'Feed pagination',
						feed.pages >= 2 &&
							feed.items.length > 20 &&
							new Set(
								feed.items.map((item) => item.author.userId),
							).size > 1,
						`${feed.pages} pages with ${feed.items.length} unique, mixed-author entries.`,
					);
			},
		);
	}
};

const verifyInteractions = async (runtime) => {
	const id = communityId(runtime, 'circle');
	if (!id) return;
	await runtime.run(
		10,
		'Busy thread and prayer support',
		'listCommunityReplies / listCommunityPrayerSupport',
		async () => {
			const thread = await runtime.pages(
				10,
				'listCommunityReplies',
				{ communityId: id, postId: postId(runtime, 'long-reading') },
				'replies',
				'replyId',
			);
			check(
				runtime,
				null,
				'Reply pagination',
				thread.pages >= 2 && thread.items.length === 25,
				`Observed ${thread.items.length} replies across ${thread.pages} pages.`,
			);
			const times = thread.items.map(
				(item) =>
					item.createdAt.seconds + item.createdAt.nanoseconds / 1e9,
			);
			check(
				runtime,
				null,
				'Reply chronological ordering',
				times.every(
					(time, index) => index === 0 || times[index - 1] <= time,
				),
				'Replies are oldest first across pages.',
			);
			for (const definition of replies) {
				const observed = thread.items.find(
					(item) =>
						item.replyId ===
						runtime.state.operations[`reply-${definition.key}`]
							?.replyId,
				);
				check(
					runtime,
					null,
					`Reply ${definition.key}`,
					observed?.author.userId ===
						runtime.state.accounts[definition.author] &&
						(definition.deleted
							? observed?.publication.status ===
									'AuthorDeleted' &&
								!observed.publication.text
							: observed?.publication.text ===
								(definition.edit || definition.text)),
					'Reply authorship, edits, and deletion state match.',
				);
			}
			const support = await runtime.call(
				10,
				'listCommunityPrayerSupport',
				{
					communityId: id,
					postId: postId(runtime, 'prayer-current'),
					pageSize: 20,
				},
			);
			check(
				runtime,
				null,
				'Prayer acknowledgments',
				support.supportCount === 3 &&
					support.viewerIsPraying === false &&
					[2, 6, 8].every((number) =>
						support.supporters.some(
							(item) =>
								item.userId === runtime.state.accounts[number],
						),
					),
				'Three supporters (2, 6, 8); account 10 withdrew its acknowledgment.',
			);
		},
	);
	for (const number of [1, 5])
		await denied(
			runtime,
			number,
			'getCommunityContext',
			{ communityId: id },
			['CommunityUnavailable'],
		);
	await denied(runtime, 4, 'listCommunitySafetyReports', {}, [
		'ReviewerRequired',
	]);
	await runtime.run(
		1,
		'Invitation preview without joining',
		'previewCommunityInvitation',
		async () => {
			const { invitation } = await runtime.call(
				4,
				'getCurrentCommunityInvitation',
				{ communityId: id },
			);
			if (!invitation) {
				check(
					runtime,
					1,
					'Invitation preview',
					false,
					'No current invitation.',
				);
				return;
			}
			const { preview } = await runtime.call(
				1,
				'previewCommunityInvitation',
				{ invitationCode: invitation.code },
			);
			check(
				runtime,
				1,
				'Invitation preview',
				preview.communityName ===
					'[COMMUNITY-QA] Scripture and Everyday Faith' &&
					!('posts' in preview) &&
					!('members' in preview),
				'Outsider preview includes community context without the member list or feed.',
			);
		},
	);
	await runtime.run(
		5,
		'Safety queue and report detail',
		'listCommunitySafetyReports / getCommunitySafetyReport',
		async () => {
			await runtime.pages(
				5,
				'listCommunitySafetyReports',
				{},
				'reports',
				'reportId',
			);
			for (const [key, status] of [
				['submitted', 'Submitted'],
				['under-review', 'UnderReview'],
				['removed', 'Resolved'],
				['no-action', 'Resolved'],
			]) {
				const reportId =
					runtime.state.operations[`report-${key}`]?.reportId;
				if (!reportId) {
					check(
						runtime,
						5,
						`Report ${key}`,
						false,
						'Report was not provisioned.',
					);
					continue;
				}
				const result = await runtime.call(
					5,
					'getCommunitySafetyReport',
					{ reportId },
				);
				check(
					runtime,
					5,
					`Report ${key}`,
					result.report.review.status === status,
					`Expected ${status}; observed ${result.report.review.status}.`,
				);
			}
		},
	);
	const scheduleId =
		runtime.state.operations['schedule-circle']?.communityJourney
			.communityJourneyId;
	if (scheduleId) {
		for (const number of [2, 3, 6, 10])
			await runtime.run(
				number,
				'Enrollment and sharing',
				'getCommunityJourneyEnrollment / getCommunityProgressSharing',
				async () => {
					const result = await runtime.call(
						number,
						'getCommunityJourneyEnrollment',
						{ communityId: id, communityJourneyId: scheduleId },
					);
					const status =
						result.enrollment?.lifecycle?.status ?? 'Missing';
					runtime.execution.accounts[number].enrollment = status;
					check(
						runtime,
						number,
						'Scheduled enrollment',
						status === (number === 2 ? 'Withdrawn' : 'Enrolled'),
						`Observed ${status}; original start date ${runtime.state.scheduleStartDate}.`,
					);
					if (number === 2) return;
					const preference = await runtime.call(
						number,
						'getCommunityProgressSharing',
						{ communityId: id, communityJourneyId: scheduleId },
					);
					check(
						runtime,
						number,
						'Independent progress consent',
						preference.individualProgress.status ===
							(number === 6 ? 'Private' : 'Shared') &&
							preference.aggregateProgress.status ===
								(number === 10 ? 'Private' : 'Shared'),
						'Individual and aggregate settings match the deliberate consent matrix.',
					);
				},
			);
		await runtime.run(
			4,
			'Schedule and aggregate privacy',
			'getCommunityJourneySchedule / getCommunityAggregateProgress',
			async () => {
				const { communityJourney } = await runtime.call(
					4,
					'getCommunityJourneySchedule',
					{ communityId: id },
				);
				check(
					runtime,
					null,
					'Frozen future schedule',
					communityJourney?.communityJourneyId === scheduleId &&
						communityJourney.status === 'Scheduled' &&
						communityJourney.canRevise === false,
					'First enrollment freezes the schedule.',
				);
				const aggregate = await runtime.call(
					4,
					'getCommunityAggregateProgress',
					{ communityId: id, communityJourneyId: scheduleId },
				);
				check(
					runtime,
					null,
					'Aggregate suppression',
					aggregate.status === 'Suppressed' &&
						aggregate.progress === null,
					'Small groups do not expose aggregate counts.',
				);
			},
		);
	}
	if (communityId(runtime, 'handoff'))
		await runtime.run(
			6,
			'Canceled schedule history',
			'listCommunityJourneyHistory',
			async () => {
				const history = await runtime.call(
					6,
					'listCommunityJourneyHistory',
					{
						communityId: communityId(runtime, 'handoff'),
						pageSize: 20,
					},
				);
				check(
					runtime,
					null,
					'Canceled schedule',
					history.communityJourneys.some(
						(item) =>
							item.communityJourneyId ===
								runtime.state.operations['schedule-handoff']
									?.communityJourney.communityJourneyId &&
							item.status === 'Canceled',
					),
					'Canceled schedule remains in history after ownership transfer.',
				);
			},
		);
};

const verify = async (runtime) => {
	console.log(
		'[verification] Fresh logins and complete paginated API read-back',
	);
	await verifyAccounts(runtime);
	await verifyCommunities(runtime);
	await verifyInteractions(runtime);
	if (
		[2, 3, 6, 10].some(
			(number) =>
				runtime.execution.accounts[number]?.enrollment === 'Missing',
		)
	) {
		await runtime.run(
			null,
			'Diagnose configured course',
			'read-only formation metadata / canonical FormationThemeOrder',
			async () => {
				const {
					FormationThemeOrder,
				} = require('../functions/lib/generated/types/formation/formation-course.types');
				const configuration = (
					await runtime.database
						.doc('formationConfiguration/current')
						.get()
				).data();
				if (!configuration?.courseId || !configuration?.courseVersionId)
					return;
				const days = await runtime.database
					.collection(
						`formationCourses/${configuration.courseId}/versions/${configuration.courseVersionId}/days`,
					)
					.get();
				const mismatchedDays = days.docs
					.filter(
						(snapshot) =>
							snapshot.get('themeId') !==
							FormationThemeOrder[
								Math.ceil(snapshot.get('dayNumber') / 7) - 1
							],
					)
					.map((snapshot) => snapshot.get('dayNumber'))
					.sort((left, right) => left - right);
				runtime.execution.courseDiagnostic = {
					courseId: configuration.courseId,
					courseVersionId: configuration.courseVersionId,
					totalDays: days.size,
					mismatchedDays,
				};
				if (mismatchedDays.length)
					recordFailure(
						runtime.execution,
						'warning',
						null,
						'Configured course theme contract',
						'requirePublishedCourse / formationCourses',
						{ code: 'QA/CourseThemeMismatch' },
						`${mismatchedDays.length}/${days.size} day theme IDs differ from the branch contract. Enrollment is blocked; no course data changed.`,
					);
			},
		);
	}
	for (const account of accounts) {
		const observed = runtime.execution.accounts[account.number];
		if (!observed) continue;
		const checks = runtime.execution.checks.filter(
			(item) => item.account === account.number,
		);
		observed.verified =
			checks.length > 0 &&
			checks.every((item) => item.status === 'verified') &&
			!runtime.execution.issues.some(
				(item) =>
					item.account === account.email &&
					item.severity !== 'warning',
			);
	}
};

module.exports = { verify, check, denied };
