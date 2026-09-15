const { doc, runTransaction, serverTimestamp } = require('firebase/firestore');
const {
	accounts,
	communities,
	posts,
	replies,
	prefix,
} = require('./community-qa-data.cjs');
const { recordFailure } = require('./community-qa-runtime.cjs');

const communityId = (runtime, key) =>
	runtime.state.operations[`community-${key}`]?.community?.communityId;
const postId = (runtime, key) =>
	runtime.state.operations[`post-${key}`]?.postId;
const seedCommunities = async (runtime) => {
	console.log('[community seeding] Creating or reusing five QA communities');
	for (const community of communities) {
		const created = await runtime.once(
			`community-${community.key}`,
			community.owner,
			'createCommunity',
			{
				name: `${prefix} ${community.name}`,
				purpose: community.purpose,
				settings: {
					participationExpectations:
						'Read Scripture thoughtfully, speak kindly, and share only what you intend this community to read. This is a manual QA community.',
				},
			},
		);
		if (!created) continue;
		const id = created.community.communityId;
		const remaining = community.members.filter(
			(number) =>
				!runtime.state.operations[`join-${community.key}-${number}`],
		);
		if (!remaining.length && community.key !== 'circle') continue;
		if (runtime.state.operations[`close-${community.key}`]) continue;
		await runtime.run(
			community.owner,
			`invitation-${community.key}`,
			'getCurrentCommunityInvitation / issueCommunityInvitation',
			async () => {
				let { invitation } = await runtime.call(
					community.owner,
					'getCurrentCommunityInvitation',
					{ communityId: id },
				);
				if (!invitation)
					({ invitation } = await runtime.call(
						community.owner,
						'issueCommunityInvitation',
						{
							communityId: id,
							operationId:
								require('./community-qa-runtime.cjs').operationId(
									`invitation-${community.key}`,
								),
						},
					));
				// Invitation codes stay in memory; checkpoints and reports never contain them.
				for (const number of remaining)
					await runtime.once(
						`join-${community.key}-${number}`,
						number,
						'acceptCommunityInvitation',
						{
							invitationCode: invitation.code,
							displayName: accounts[number - 1].preferredName,
						},
					);
			},
		);
	}
};

const seedContent = async (runtime) => {
	console.log(
		'[content seeding] Four post types, 25 main-feed entries, and a 25-reply thread',
	);
	for (const post of posts) {
		const id = communityId(runtime, post.community);
		if (!id) continue;
		const content = {
			postType: post.type,
			text: post.text,
			...(post.type === 'PrayerRequest'
				? { prayerRequestStatus: 'Current' }
				: {}),
		};
		const created = await runtime.once(
			`post-${post.key}`,
			post.author,
			'createCommunityPost',
			{ communityId: id, content },
		);
		if (!created) continue;
		if (post.edit)
			await runtime.once(
				`edit-${post.key}`,
				post.author,
				'editCommunityPost',
				{
					communityId: id,
					postId: created.postId,
					text: post.edit,
					expectedRevision: 0,
				},
			);
		if (post.prayerStatus && post.prayerStatus !== 'Current')
			await runtime.once(
				`status-${post.key}`,
				post.author,
				'setCommunityPrayerRequestStatus',
				{
					communityId: id,
					postId: created.postId,
					prayerRequestStatus: post.prayerStatus,
					expectedRevision: 0,
				},
			);
		if (post.finalStatus === 'AuthorDeleted')
			await runtime.once(
				`delete-${post.key}`,
				post.author,
				'deleteCommunityPost',
				{
					communityId: id,
					postId: created.postId,
					expectedRevision: 0,
				},
			);
	}
	for (const reply of replies) {
		const id = postId(runtime, reply.post);
		if (!id) continue;
		const request = {
			communityId: communityId(runtime, 'circle'),
			postId: id,
		};
		const created = await runtime.once(
			`reply-${reply.key}`,
			reply.author,
			'createCommunityReply',
			{ ...request, text: reply.text },
		);
		if (!created) continue;
		if (reply.edit)
			await runtime.once(
				`edit-${reply.key}`,
				reply.author,
				'editCommunityReply',
				{
					...request,
					replyId: created.replyId,
					text: reply.edit,
					expectedRevision: 0,
				},
			);
		if (reply.deleted)
			await runtime.once(
				`delete-${reply.key}`,
				reply.author,
				'deleteCommunityReply',
				{ ...request, replyId: created.replyId, expectedRevision: 0 },
			);
	}
	if (postId(runtime, 'prayer-current')) {
		for (const number of [2, 6, 8, 10])
			await runtime.once(
				`praying-${number}`,
				number,
				'setCommunityPrayerAcknowledgment',
				{
					communityId: communityId(runtime, 'circle'),
					postId: postId(runtime, 'prayer-current'),
					isPraying: true,
				},
			);
		await runtime.once(
			'withdraw-praying-10',
			10,
			'setCommunityPrayerAcknowledgment',
			{
				communityId: communityId(runtime, 'circle'),
				postId: postId(runtime, 'prayer-current'),
				isPraying: false,
			},
		);
	}
};

const seedSafety = async (runtime) => {
	console.log(
		'[interactions] Submitted, claimed, and resolved safety reports',
	);
	const id = communityId(runtime, 'circle');
	if (!id) return;
	const reports = [
		{ key: 'submitted', post: 'welcome', reporter: 10 },
		{ key: 'under-review', post: 'conversation-3', reporter: 10 },
		{ key: 'removed', post: 'safety-removed', reporter: 3 },
		{ key: 'no-action', post: 'conversation-4', reporter: 10 },
	];
	for (const report of reports) {
		const targetId = postId(runtime, report.post);
		if (!targetId) continue;
		const created = await runtime.once(
			`report-${report.key}`,
			report.reporter,
			'reportCommunityContent',
			{
				communityId: id,
				target: { targetType: 'Post', postId: targetId },
				reason: 'Other',
				explanation:
					'Clearly labeled QA report. The harmless example is for reviewing the platform safety workflow, not an allegation about a real person.',
			},
		);
		if (!created || report.key === 'submitted') continue;
		if (report.key === 'under-review')
			await runtime.once(
				'claim-report',
				5,
				'claimCommunitySafetyReport',
				{ reportId: created.reportId, expectedRevision: 0 },
			);
		else
			await runtime.once(
				`resolve-${report.key}`,
				5,
				'reviewCommunityReport',
				{
					reportId: created.reportId,
					expectedRevision: 0,
					expectedTargetRevision: 0,
					requestedAction:
						report.key === 'removed' ? 'RemoveContent' : 'NoAction',
					explanation:
						'QA review completed. This deliberate fixture demonstrates the selected review outcome.',
				},
			);
	}
};

const prepareChoices = async (runtime, number) => {
	const client = runtime.clients.get(number);
	if (!client?.auth.currentUser)
		throw Object.assign(new Error(), { code: 'QA/AccountUnavailable' });
	const reference = doc(
		client.db,
		'users',
		client.auth.currentUser.uid,
		'journeySetupDrafts',
		'current',
	);
	return runTransaction(client.db, async (transaction) => {
		const snapshot = await transaction.get(reference);
		if (snapshot.exists()) return snapshot.data().revision;
		/** @type {import('firebase/firestore').WithFieldValue<import('../src/types/account/journey-setup.types').IJourneySetupDraftDocument>} */
		const draft = {
			schemaVersion: 1,
			userId: client.auth.currentUser.uid,
			revision: 0,
			currentStep: 'Review',
			choices: {
				readiness: 'ReadyForReview',
				optionalPracticeIds: ['Movement', 'Gratitude'],
				bibleVersionId: 'Web',
			},
			startingMotivation: null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		};
		transaction.set(reference, draft);
		return 0;
	});
};

const seedJourneys = async (runtime) => {
	console.log(
		'[interactions] Shared schedules, private enrollment, withdrawal, and progress consent',
	);
	for (const key of ['circle', 'handoff']) {
		const id = communityId(runtime, key);
		if (!id) continue;
		const owner = key === 'circle' ? 4 : 10;
		await runtime.run(
			owner,
			`schedule-${key}`,
			'getCommunityJourneyCourseOption / configureCommunityJourney',
			async () => {
				let scheduled = runtime.state.operations[`schedule-${key}`];
				if (!scheduled) {
					const { course } = await runtime.call(
						owner,
						'getCommunityJourneyCourseOption',
						{ communityId: id },
					);
					if (!course)
						throw Object.assign(new Error(), {
							code: 'QA/ReleasedCourseUnavailable',
						});
					scheduled = await runtime.once(
						`schedule-${key}`,
						owner,
						'configureCommunityJourney',
						{
							communityId: id,
							course,
							startDate: runtime.state.scheduleStartDate,
							timeZoneId: 'America/New_York',
						},
					);
				}
				if (!scheduled) return;
				const scheduleId =
					scheduled.communityJourney.communityJourneyId;
				if (key === 'handoff') {
					await runtime.once(
						'cancel-handoff-schedule',
						owner,
						'cancelCommunityJourney',
						{
							communityId: id,
							communityJourneyId: scheduleId,
							expectedRevision: 0,
						},
					);
					return;
				}
				for (const number of [2, 3, 6, 10]) {
					await runtime.run(
						number,
						`enrollment-${number}`,
						'Firestore client setup / enrollCommunityJourney',
						async () => {
							if (!runtime.state.operations[`enroll-${number}`]) {
								const revision = await prepareChoices(
									runtime,
									number,
								);
								await runtime.once(
									`enroll-${number}`,
									number,
									'enrollCommunityJourney',
									{
										communityId: id,
										communityJourneyId: scheduleId,
										expectedCommunityJourneyRevision: 0,
										setupDraftId: 'current',
										expectedSetupRevision: revision,
										startingTimeZoneId:
											number === 6
												? 'America/Los_Angeles'
												: 'America/New_York',
										consentToScheduledActivation: true,
									},
								);
							}
							if (!runtime.state.operations[`enroll-${number}`])
								return;
							if (number === 2)
								await runtime.once(
									'withdraw-enrollment-2',
									number,
									'withdrawCommunityJourneyEnrollment',
									{
										communityId: id,
										communityJourneyId: scheduleId,
									},
								);
							else
								await runtime.once(
									`progress-${number}`,
									number,
									'setCommunityProgressSharing',
									{
										communityId: id,
										communityJourneyId: scheduleId,
										shouldShareIndividualProgress:
											number !== 6,
										shouldContributeToAggregateProgress:
											number !== 10,
									},
								);
						},
					);
				}
			},
		);
	}
};

const seedFinalRelationships = async (runtime) => {
	console.log(
		'[membership seeding] Ownership handoff, departure, removal, and closed archive',
	);
	const circle = communityId(runtime, 'circle');
	if (circle) {
		await runtime.once(
			'notifications-muted-6',
			6,
			'setCommunityNotificationPreferences',
			{
				communityId: circle,
				category: 'Reply',
				categoryEnabled: false,
				pushEnabled: false,
			},
		);
		await runtime.once('block-6-8', 6, 'blockCommunityMember', {
			communityId: circle,
			memberUserId: runtime.state.accounts[8],
		});
		if (runtime.state.operations['post-left-contribution'])
			await runtime.once('leave-7', 7, 'leaveCommunity', {
				communityId: circle,
			});
		if (runtime.state.operations['post-removed-contribution'])
			await runtime.once('remove-9', 4, 'removeCommunityMember', {
				communityId: circle,
				memberUserId: runtime.state.accounts[9],
				privateReason:
					'A deliberate QA removed-membership state; not a real conduct decision.',
			});
	}
	const handoff = communityId(runtime, 'handoff');
	if (handoff && runtime.state.operations['join-handoff-6'])
		await runtime.run(
			10,
			'transfer-handoff',
			'transferCommunityOrganizer',
			async () => {
				if (runtime.state.operations['transfer-handoff']) return;
				const { context } = await runtime.call(
					10,
					'getCommunityContext',
					{ communityId: handoff },
				);
				await runtime.once(
					'transfer-handoff',
					10,
					'transferCommunityOrganizer',
					{
						communityId: handoff,
						nextOrganizerUserId: runtime.state.accounts[6],
						expectedRevision: context.communityRevision,
					},
				);
			},
		);
	const archive = communityId(runtime, 'archive');
	if (archive && runtime.state.operations['post-archive-thanks'])
		await runtime.run(4, 'close-archive', 'closeCommunity', async () => {
			if (runtime.state.operations['close-archive']) return;
			const { context } = await runtime.call(4, 'getCommunityContext', {
				communityId: archive,
			});
			await runtime.once('close-archive', 4, 'closeCommunity', {
				communityId: archive,
				expectedRevision: context.communityRevision,
			});
		});
};

const deliverNotifications = async (runtime) => {
	console.log(
		'[interactions] Delivering only this dataset’s pending in-app events through the existing worker',
	);
	const {
		fanOutCommunityNotificationEvent,
	} = require('../functions/lib/src/community/community-notification-event');
	for (const community of communities) {
		const id = communityId(runtime, community.key);
		if (!id) continue;
		await runtime.run(
			null,
			`notification-fanout-${community.key}`,
			'fanOutCommunityNotificationEvent (existing service)',
			async () => {
				const events = await runtime.database
					.collection('communityNotificationEvents')
					.where('communityId', '==', id)
					.limit(100)
					.get();
				if (events.size === 100)
					throw Object.assign(new Error(), {
						code: 'QA/EventScanLimit',
					});
				for (const event of events.docs) {
					if (event.get('status') !== 'Pending') continue;
					let complete = false;
					for (let page = 0; page < 10 && !complete; page++)
						complete = await fanOutCommunityNotificationEvent(
							event.id,
							runtime.database,
						);
					if (!complete)
						throw Object.assign(new Error(), {
							code: 'QA/FanoutIncomplete',
						});
				}
			},
		);
	}
	for (const number of [3, 10])
		await runtime.run(
			number,
			'read-one-notification',
			'listCommunityNotifications / markCommunityNotificationRead',
			async () => {
				if (runtime.state.operations[`read-notification-${number}`])
					return;
				const { notifications } = await runtime.call(
					number,
					'listCommunityNotifications',
					{ pageSize: 20 },
				);
				if (notifications.length)
					await runtime.once(
						`read-notification-${number}`,
						number,
						'markCommunityNotificationRead',
						{ eventId: notifications[0].eventId },
					);
			},
		);
};

const seed = async (runtime) => {
	await seedCommunities(runtime);
	await seedContent(runtime);
	await seedSafety(runtime);
	await seedJourneys(runtime);
	await seedFinalRelationships(runtime);
	await deliverNotifications(runtime);
	if (!runtime.state.operations['schedule-circle'])
		recordFailure(
			runtime.execution,
			'warning',
			null,
			'Shared journey coverage',
			'getCommunityJourneyCourseOption',
			{ code: 'QA/ScheduleNotSeeded' },
			'No course or schedule was fabricated. Enrollment and progress coverage may be unavailable.',
		);
};

module.exports = { communityId, postId, seed, prepareChoices };
