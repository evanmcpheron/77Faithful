const assert = require('node:assert/strict');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const { initializeApp, getApps, deleteApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const {
	FormationThemeOrder,
} = require('../functions/lib/generated/types/formation/formation-course.types');
const schedules = require('../functions/lib/src/community/community-journey');
const enrollments = require('../functions/lib/src/community/community-journey-enrollment');
const activations = require('../functions/lib/src/community/activate-community-journey-enrollments');
const personalStarts = require('../functions/lib/src/journey/start-journey');
const {
	getJourneyCalendarDate,
} = require('../functions/lib/generated/features/journey/journey-calendar');
const projectId = 'faithful-community-enrollment-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 15));
let database;
const dependencies = (instant = now) => ({ database, now: instant });
const activationDependencies = (instant) => ({
	database,
	now: instant,
	verifiedAccount: async () => true,
});
const fails = (reason) => (caught) => caught.details?.reason === reason;
const clear = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};
const member = (userId, role) => ({
	schemaVersion: 1,
	communityId: 'alpha',
	userId,
	role,
	joinedAt: now,
	lifecycle: { status: 'Active' },
	createdAt: now,
	updatedAt: now,
});
const draft = (revision = 4) => ({
	schemaVersion: 1,
	userId: 'member',
	revision,
	currentStep: 'Review',
	choices: {
		readiness: 'ReadyForReview',
		optionalPracticeIds: ['Movement', 'Gratitude'],
		bibleVersionId: 'Web',
	},
	startingMotivation: {
		revisionId: 'motivation-1',
		text: 'Private motivation',
		updatedAt: now,
	},
	createdAt: now,
	updatedAt: now,
});
const scheduleRequest = () => ({
	communityId: 'alpha',
	course: { courseId: 'course', courseVersionId: 'v1' },
	startDate: '2026-11-01',
	timeZoneId: 'America/New_York',
	operationId: 'schedule-1',
});
const enrollRequest = (journeyId, operationId = 'enroll-1') => ({
	communityId: 'alpha',
	communityJourneyId: journeyId,
	expectedCommunityJourneyRevision: 0,
	setupDraftId: 'current',
	expectedSetupRevision: 4,
	startingTimeZoneId: 'America/Los_Angeles',
	consentToScheduledActivation: true,
	operationId,
});
const seed = async () => {
	const batch = database.batch();
	for (const userId of ['owner', 'member']) {
		batch.set(database.doc(`users/${userId}`), {
			schemaVersion: 1,
			revision: 0,
			preferredName: userId,
			createdAt: now,
			updatedAt: now,
		});
		batch.set(
			database.doc(`communities/alpha/members/${userId}`),
			member(userId, userId === 'owner' ? 'Organizer' : 'Member'),
		);
	}
	batch.set(database.doc('communities/alpha'), {
		schemaVersion: 1,
		name: 'Community',
		purpose: 'Follow Jesus together.',
		organizerUserId: 'owner',
		settings: {},
		lifecycle: { status: 'Active' },
		activeInvitationId: null,
		revision: 0,
		createdAt: now,
		updatedAt: now,
	});
	batch.set(database.doc('formationConfiguration/current'), {
		courseId: 'course',
		courseVersionId: 'v1',
		bibleTextEditionIds: { Web: 'web-edition' },
	});
	batch.set(database.doc('formationCourses/course'), {
		schemaVersion: 1,
		title: '77 Days',
		description: 'Course',
		createdAt: now,
		updatedAt: now,
	});
	batch.set(database.doc('formationCourses/course/versions/v1'), {
		schemaVersion: 1,
		courseId: 'course',
		dayCount: 77,
		weekCount: 11,
		publicationState: { status: 'Published', publishedAt: now },
		createdAt: now,
		updatedAt: now,
	});
	batch.set(database.doc('bibleTextEditions/web-edition'), {
		bibleVersionId: 'Web',
		editionName: 'Fixture edition',
		sourceRevision: 'fixture',
		acknowledgments: ['Fixture attribution'],
		releaseState: { status: 'Released', releasedAt: now },
	});
	batch.set(database.doc('users/member/journeySetupDrafts/current'), draft());
	batch.set(
		database.doc(
			'users/member/journeySetupDrafts/current/writingRevisions/motivation-1',
		),
		{
			userId: 'member',
			target: { kind: 'SetupMotivation', setupDraftId: 'current' },
			baseRevisionId: null,
			text: 'Private motivation',
			origin: {
				operationId: 'motivation-1',
				deviceId: 'phone',
				recordedOnDeviceAt: now,
			},
			savedAt: now,
		},
	);
	for (let dayNumber = 1; dayNumber <= 77; dayNumber++) {
		const weekNumber = Math.ceil(dayNumber / 7);
		const assignmentId = `reading-${dayNumber}`;
		batch.set(
			database.doc(
				`formationCourses/course/versions/v1/days/day-${dayNumber}`,
			),
			{
				courseId: 'course',
				courseVersionId: 'v1',
				dayNumber,
				weekNumber,
				themeId: FormationThemeOrder[weekNumber - 1],
				title: 'Title',
				devotional: 'Devotional',
				prayerPrompt: 'Prompt',
				writtenPrayer: 'Prayer',
				reflectionQuestion: 'Question',
				scriptureAssignmentId: assignmentId,
			},
		);
		batch.set(database.doc(`scriptureAssignments/${assignmentId}`), {
			displayReference: 'Reference',
			primaryPassage: { passageId: 'passage' },
			supportingPassage: null,
		});
		batch.set(
			database.doc(
				`bibleTextEditions/web-edition/assignmentTexts/${assignmentId}`,
			),
			{
				scriptureAssignmentId: assignmentId,
				bibleVersionId: 'Web',
				bibleTextEditionId: 'web-edition',
				primaryPassage: {
					passageId: 'passage',
					displayReference: 'Reference',
					paragraphs: [{ runs: [{ text: 'Fixture text' }] }],
				},
				supportingPassage: null,
			},
		);
	}
	for (let weekNumber = 1; weekNumber <= 11; weekNumber++)
		batch.set(
			database.doc(
				`formationCourses/course/versions/v1/weekIntroductions/week-${weekNumber}`,
			),
			{
				courseId: 'course',
				courseVersionId: 'v1',
				weekNumber,
				themeId: FormationThemeOrder[weekNumber - 1],
				introduction: 'Introduction',
			},
		);
	await batch.commit();
};
const configured = async () =>
	(
		await schedules.configureCommunityJourneyForAccount(
			'owner',
			scheduleRequest(),
			dependencies(),
		)
	).communityJourney;
before(async () => {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'Run with Firestore emulator.',
	);
	initializeApp({ projectId });
	database = getFirestore();
});
beforeEach(async () => {
	await clear();
	await seed();
});
after(async () => Promise.all(getApps().map(deleteApp)));

test('first enrollment freezes schedule and snapshots private setup without creating a journey', async () => {
	const schedule = await configured();
	const result = await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	assert.equal(result.groupDisplayStartDate, '2026-11-01');
	assert.equal(result.startingTimeZoneId, 'America/Los_Angeles');
	assert.equal(result.personalStartDateBehavior, 'ParticipantCalendarDay1');
	const saved = (
		await database
			.doc(
				`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
			)
			.get()
	).data();
	assert.deepEqual(saved.optionalPracticeIds, ['Movement', 'Gratitude']);
	assert.equal(saved.startingMotivation.text, 'Private motivation');
	assert.equal(saved.startingMotivationRevision.text, 'Private motivation');
	await database.doc('users/member/journeySetupDrafts/current').update({
		revision: 5,
		choices: {
			readiness: 'Incomplete',
			optionalPracticeIds: [],
			bibleVersionId: null,
		},
	});
	assert.deepEqual(
		(
			await database
				.doc(
					`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
				)
				.get()
		).get('optionalPracticeIds'),
		['Movement', 'Gratitude'],
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
	assert.equal(
		(
			await database
				.collection(`communities/alpha/communityJourneyEnrollments`)
				.get()
		).size,
		0,
	);
	assert.ok(
		(
			await database
				.doc(
					`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
				)
				.get()
		).get('firstEnrollmentAcceptedAt'),
	);
	await assert.rejects(
		schedules.reviseCommunityJourneyForAccount(
			'owner',
			{
				...scheduleRequest(),
				operationId: 'revise',
				communityJourneyId: schedule.communityJourneyId,
				expectedRevision: 0,
			},
			dependencies(),
		),
		fails('ScheduleFrozen'),
	);
	const publicPreview = (
		await schedules.getCommunityJourneyScheduleForAccount(
			'owner',
			{ communityId: 'alpha' },
			dependencies(),
		)
	).communityJourney;
	assert.equal(
		JSON.stringify(publicPreview).includes('Private motivation'),
		false,
	);
	assert.equal(
		JSON.stringify(publicPreview).includes('optionalPracticeIds'),
		false,
	);
});

test('participant zone controls Day 1 across the DST difference; repeat activation creates one private journey', async () => {
	const schedule = await configured();
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	const beforeLosAngelesDay1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 6));
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'worker-1',
			activationDependencies(beforeLosAngelesDay1),
		),
		'NotDue',
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
	const onLosAngelesDay1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10));
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'worker-1',
			activationDependencies(onLosAngelesDay1),
		),
		'Started',
	);
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'worker-1',
			activationDependencies(onLosAngelesDay1),
		),
		'Started',
	);
	const journeys = await database.collection('users/member/journeys').get();
	assert.equal(journeys.size, 1);
	assert.equal(journeys.docs[0].get('startDate'), '2026-11-01');
	assert.equal(journeys.docs[0].get('timeZoneId'), 'America/Los_Angeles');
	assert.equal(
		journeys.docs[0].get('startingMotivation.text'),
		'Private motivation',
	);
	const revision = await journeys.docs[0].ref
		.collection('writingRevisions')
		.doc('motivation-1')
		.get();
	assert.equal(revision.get('text'), 'Private motivation');
	assert.equal(
		(
			await database
				.doc(
					'users/member/journeySetupDrafts/current/writingRevisions/motivation-1',
				)
				.get()
		).get('text'),
		'Private motivation',
	);
	const publicSchedule = await database
		.doc(
			`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
		)
		.get();
	assert.equal(
		JSON.stringify(publicSchedule.data()).includes('Private motivation'),
		false,
	);
});

test('missed Day 1, withdrawn enrollment and active personal journey never start a second journey', async () => {
	const schedule = await configured();
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	const afterDay1 = Timestamp.fromMillis(Date.UTC(2026, 10, 2, 10));
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'missed',
			activationDependencies(afterDay1),
		),
		'StartBlocked',
	);
	assert.equal(
		(
			await database
				.doc(
					`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
				)
				.get()
		).get('lifecycle.reason'),
		'MissedStartDate',
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
	await database
		.doc(
			`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
		)
		.update({ lifecycle: { status: 'Enrolled' } });
	await database
		.collection('users/member/journeys')
		.doc('ordinary')
		.set({ state: { status: 'Active' }, startDate: '2026-09-15' });
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'active',
			activationDependencies(
				Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10)),
			),
		),
		'StartBlocked',
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		1,
	);
});

test('cancel, removal, unverified account and unavailable content block without creating a journey', async () => {
	const day1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10));
	for (const condition of ['Canceled', 'Removed', 'Unverified', 'Content']) {
		await clear();
		await seed();
		const schedule = await configured();
		await enrollments.enrollCommunityJourneyForAccount(
			'member',
			enrollRequest(schedule.communityJourneyId),
			dependencies(),
		);
		if (condition === 'Canceled')
			await database
				.doc(
					`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
				)
				.update({
					lifecycle: { status: 'Canceled', canceledAt: day1 },
				});
		if (condition === 'Removed')
			await database
				.doc('communities/alpha/members/member')
				.update({ lifecycle: { status: 'Removed', removedAt: day1 } });
		if (condition === 'Content')
			await database
				.doc('bibleTextEditions/web-edition')
				.update({ releaseState: { status: 'Withdrawn' } });
		const checked = {
			database,
			now: day1,
			verifiedAccount: async () => condition !== 'Unverified',
		};
		assert.equal(
			await activations.activateCommunityJourneyEnrollment(
				'member',
				'alpha',
				schedule.communityJourneyId,
				`condition-${condition}`,
				checked,
			),
			'StartBlocked',
		);
		assert.equal(
			(await database.collection('users/member/journeys').get()).size,
			0,
		);
	}
});

test('public schedule advances and completes on its own calendar even with no practice totals', async () => {
	const schedule = await configured();
	assert.equal(
		await activations.reconcileCommunityJourneySchedule(
			'alpha',
			schedule.communityJourneyId,
			activationDependencies(
				Timestamp.fromMillis(Date.UTC(2026, 10, 1, 6)),
			),
		),
		'Active',
	);
	assert.equal(
		await activations.reconcileCommunityJourneySchedule(
			'alpha',
			schedule.communityJourneyId,
			activationDependencies(
				Timestamp.fromMillis(Date.UTC(2027, 0, 17, 6)),
			),
		),
		'Completed',
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
});

test('bounded worker dry run and repeated batches are resumable; withdrawal races activation', async () => {
	const schedule = await configured();
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	const day1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10));
	const checked = activationDependencies(day1);
	assert.equal(
		(await activations.runDueCommunityJourneyBatch(checked, true))
			.enrollments,
		1,
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
	await Promise.allSettled([
		activations.runDueCommunityJourneyBatch(checked),
		enrollments.withdrawCommunityJourneyEnrollmentForAccount(
			'member',
			{
				communityId: 'alpha',
				communityJourneyId: schedule.communityJourneyId,
				operationId: 'withdraw-race',
			},
			dependencies(day1),
		),
	]);
	await activations.runDueCommunityJourneyBatch(checked);
	const enrollment = await database
		.doc(
			`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
		)
		.get();
	const personal = await database.collection('users/member/journeys').get();
	assert.ok(
		['Withdrawn', 'Started'].includes(enrollment.get('lifecycle.status')),
	);
	assert.equal(
		personal.size,
		enrollment.get('lifecycle.status') === 'Started' ? 1 : 0,
	);
	if (personal.size) {
		await database
			.doc('communities/alpha/members/member')
			.update({ lifecycle: { status: 'Left', leftAt: day1 } });
		await database
			.doc('communities/alpha')
			.update({ lifecycle: { status: 'Closed', closedAt: day1 } });
		assert.equal(
			(await personal.docs[0].ref.get()).get('state.status'),
			'Active',
		);
	}
});

test('ordinary start racing enrolled activation still leaves only one active personal journey', async () => {
	const schedule = await configured();
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	const reviewDate = getJourneyCalendarDate(new Date(), 'UTC');
	const day1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10));
	const outcomes = await Promise.allSettled([
		personalStarts.startJourneyForAccount(
			'member',
			{
				operationId: 'normal-race',
				setupDraftId: 'current',
				expectedSetupRevision: 4,
				review: {
					observedPhoneTimeZoneId: 'UTC',
					reviewedStartDate: reviewDate,
				},
			},
			database,
		),
		activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'group-race',
			activationDependencies(day1),
		),
	]);
	assert.ok(outcomes.some((outcome) => outcome.status === 'fulfilled'));
	const active = await database
		.collection('users/member/journeys')
		.where('state.status', '==', 'Active')
		.get();
	assert.equal(active.size, 1);
});

test('source writing conflicts remain private and recoverable after activation', async () => {
	const schedule = await configured();
	const conflict = {
		userId: 'member',
		target: { kind: 'SetupMotivation', setupDraftId: 'current' },
		currentRevisionId: 'motivation-1',
		competingRevisionId: 'motivation-2',
		resolution: { status: 'Unresolved' },
		createdAt: now,
		updatedAt: now,
	};
	await database
		.doc(
			'users/member/journeySetupDrafts/current/writingConflicts/conflict-1',
		)
		.set(conflict);
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	const day1 = Timestamp.fromMillis(Date.UTC(2026, 10, 1, 10));
	assert.equal(
		await activations.activateCommunityJourneyEnrollment(
			'member',
			'alpha',
			schedule.communityJourneyId,
			'conflict-start',
			activationDependencies(day1),
		),
		'Started',
	);
	const retained = await database
		.doc(
			'users/member/journeySetupDrafts/current/writingConflicts/conflict-1',
		)
		.get();
	assert.equal(retained.get('resolution.status'), 'Unresolved');
	assert.equal(
		(
			await database.doc('users/member/journeySetupDrafts/current').get()
		).get('startingMotivation.text'),
		'Private motivation',
	);
});

test('authorization, stale setup, choices, content and active personal journey are rejected', async () => {
	const schedule = await configured();
	const input = enrollRequest(schedule.communityJourneyId);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'owner',
			input,
			dependencies(),
		),
		fails('OrganizerCannotEnroll'),
	);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			{ ...input, expectedSetupRevision: 3 },
			dependencies(),
		),
		fails('SetupChanged'),
	);
	await database.doc('users/member/journeySetupDrafts/current').update({
		choices: {
			readiness: 'ReadyForReview',
			optionalPracticeIds: ['Movement', 'Movement'],
			bibleVersionId: 'Web',
		},
	});
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		fails('SetupInvalid'),
	);
	await database
		.doc('users/member/journeySetupDrafts/current')
		.update({ choices: draft().choices });
	await database
		.doc('bibleTextEditions/web-edition')
		.update({ releaseState: { status: 'Withdrawn', withdrawnAt: now } });
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		fails('ContentUnavailable'),
	);
	await database
		.doc('bibleTextEditions/web-edition')
		.update({ releaseState: { status: 'Released', releasedAt: now } });
	await database
		.doc('users/member/journeys/personal')
		.set({ state: { status: 'Active' } });
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		fails('ActivePersonalJourney'),
	);
});

test('closed enrollment window and closed parent deny a new participant snapshot', async () => {
	const schedule = await configured();
	const schedulePath = `communities/alpha/communityJourneys/${schedule.communityJourneyId}`;
	await database.doc(schedulePath).update({
		lifecycle: { status: 'Scheduled', enrollmentWindow: 'Closed' },
	});
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			enrollRequest(schedule.communityJourneyId),
			dependencies(),
		),
		fails('EnrollmentClosed'),
	);
	await database.doc(schedulePath).update({
		lifecycle: { status: 'Scheduled', enrollmentWindow: 'Open' },
	});
	await database
		.doc('communities/alpha')
		.update({ lifecycle: { status: 'Closed', closedAt: now } });
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			enrollRequest(schedule.communityJourneyId),
			dependencies(),
		),
		fails('CommunityClosed'),
	);
	assert.equal(
		(
			await database
				.doc(
					`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
				)
				.get()
		).exists,
		false,
	);
});

test('deadline uses community zone; retry IDs and withdrawal never restore eligibility', async () => {
	const schedule = await configured();
	const input = enrollRequest(schedule.communityJourneyId);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(Timestamp.fromMillis(Date.UTC(2026, 10, 1, 4))),
		),
		fails('EnrollmentClosed'),
	);
	const result = await enrollments.enrollCommunityJourneyForAccount(
		'member',
		input,
		dependencies(),
	);
	assert.deepEqual(
		await enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		result,
	);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			{ ...input, startingTimeZoneId: 'UTC' },
			dependencies(),
		),
		fails('OperationPayloadMismatch'),
	);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			{ ...input, operationId: 'enroll-2' },
			dependencies(),
		),
		fails('EnrollmentAlreadyExists'),
	);
	const withdrawal = {
		communityId: 'alpha',
		communityJourneyId: schedule.communityJourneyId,
		operationId: 'withdraw-1',
	};
	const withdrawn =
		await enrollments.withdrawCommunityJourneyEnrollmentForAccount(
			'member',
			withdrawal,
			dependencies(),
		);
	assert.deepEqual(
		await enrollments.withdrawCommunityJourneyEnrollmentForAccount(
			'member',
			withdrawal,
			dependencies(),
		),
		withdrawn,
	);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		fails('EnrollmentWithdrawn'),
	);
	assert.equal(
		(
			await enrollments.getCommunityJourneyEnrollmentForAccount(
				'member',
				{
					communityId: 'alpha',
					communityJourneyId: schedule.communityJourneyId,
				},
				dependencies(),
			)
		).enrollment.activationEligibility,
		'Withdrawn',
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
});

test('schedule cancellation and membership loss prevent retry, while owner can withdraw', async () => {
	const schedule = await configured();
	const input = enrollRequest(schedule.communityJourneyId);
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		input,
		dependencies(),
	);
	await schedules.cancelCommunityJourneyForAccount(
		'owner',
		{
			communityId: 'alpha',
			communityJourneyId: schedule.communityJourneyId,
			expectedRevision: 0,
			operationId: 'cancel-1',
		},
		dependencies(),
	);
	await assert.rejects(
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		fails('ScheduleCanceled'),
	);
	await database
		.doc('communities/alpha/members/member')
		.update({ lifecycle: { status: 'Left', leftAt: now } });
	assert.equal(
		(
			await enrollments.getCommunityJourneyEnrollmentForAccount(
				'member',
				{
					communityId: 'alpha',
					communityJourneyId: schedule.communityJourneyId,
				},
				dependencies(),
			)
		).enrollment.activationEligibility,
		'MembershipEnded',
	);
	await enrollments.withdrawCommunityJourneyEnrollmentForAccount(
		'member',
		{
			communityId: 'alpha',
			communityJourneyId: schedule.communityJourneyId,
			operationId: 'withdraw-1',
		},
		dependencies(),
	);
});

test('enrollment serializes against schedule revision', async () => {
	const schedule = await configured();
	const input = enrollRequest(schedule.communityJourneyId);
	const revise = {
		...scheduleRequest(),
		operationId: 'revise-race',
		communityJourneyId: schedule.communityJourneyId,
		expectedRevision: 0,
		startDate: '2026-12-01',
	};
	const results = await Promise.allSettled([
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			input,
			dependencies(),
		),
		schedules.reviseCommunityJourneyForAccount(
			'owner',
			revise,
			dependencies(),
		),
	]);
	assert.equal(
		results.filter((result) => result.status === 'fulfilled').length,
		1,
	);
	const saved = await database
		.doc(
			`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
		)
		.get();
	if (saved.exists) {
		assert.equal(saved.get('scheduleRevision'), 0);
		assert.equal(
			(
				await database
					.doc(
						`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
					)
					.get()
			).get('firstEnrollmentAcceptedAt') != null,
			true,
		);
	} else {
		assert.equal(
			(
				await database
					.doc(
						`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
					)
					.get()
			).get('revision'),
			1,
		);
	}
});

test('enrollment versus cancel leaves a valid schedule and never starts a personal journey', async () => {
	const schedule = await configured();
	const outcomes = await Promise.allSettled([
		enrollments.enrollCommunityJourneyForAccount(
			'member',
			enrollRequest(schedule.communityJourneyId),
			dependencies(),
		),
		schedules.cancelCommunityJourneyForAccount(
			'owner',
			{
				communityId: 'alpha',
				communityJourneyId: schedule.communityJourneyId,
				expectedRevision: 0,
				operationId: 'cancel-race',
			},
			dependencies(),
		),
	]);
	assert.ok(outcomes.some((outcome) => outcome.status === 'fulfilled'));
	const privateSnapshot = await database
		.doc(
			`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
		)
		.get();
	const publicSnapshot = await database
		.doc(
			`communities/alpha/communityJourneys/${schedule.communityJourneyId}`,
		)
		.get();
	if (privateSnapshot.exists) {
		assert.ok(
			['Scheduled', 'Canceled'].includes(
				publicSnapshot.get('lifecycle.status'),
			),
		);
		assert.ok(publicSnapshot.get('firstEnrollmentAcceptedAt'));
		if (publicSnapshot.get('lifecycle.status') === 'Canceled') {
			assert.equal(outcomes[0].status, 'fulfilled');
			assert.equal(outcomes[1].status, 'fulfilled');
		}
	} else {
		assert.equal(publicSnapshot.get('lifecycle.status'), 'Canceled');
		assert.equal(publicSnapshot.get('firstEnrollmentAcceptedAt'), null);
	}
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
});

test('a started enrollment cannot be withdrawn to end a personal journey', async () => {
	const schedule = await configured();
	await enrollments.enrollCommunityJourneyForAccount(
		'member',
		enrollRequest(schedule.communityJourneyId),
		dependencies(),
	);
	await database
		.doc(
			`users/member/communityJourneyEnrollments/${schedule.communityJourneyId}`,
		)
		.update({
			lifecycle: {
				status: 'Started',
				journeyId: 'personal',
				startedAt: now,
			},
		});
	await database
		.doc('users/member/journeys/personal')
		.set({ state: { status: 'Active' } });
	await assert.rejects(
		enrollments.withdrawCommunityJourneyEnrollmentForAccount(
			'member',
			{
				communityId: 'alpha',
				communityJourneyId: schedule.communityJourneyId,
				operationId: 'withdraw-after-start',
			},
			dependencies(),
		),
		fails('EnrollmentStarted'),
	);
	assert.equal(
		(await database.doc('users/member/journeys/personal').get()).get(
			'state.status',
		),
		'Active',
	);
});
