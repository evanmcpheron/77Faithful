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
const projectId = 'faithful-community-enrollment-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 15));
let database;
const dependencies = (instant = now) => ({ database, now: instant });
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

test('enrollment versus cancel leaves either a frozen enrolled schedule or a canceled empty schedule', async () => {
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
	assert.equal(
		outcomes.filter((outcome) => outcome.status === 'fulfilled').length,
		1,
	);
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
		assert.equal(publicSnapshot.get('lifecycle.status'), 'Scheduled');
		assert.ok(publicSnapshot.get('firstEnrollmentAcceptedAt'));
	} else {
		assert.equal(publicSnapshot.get('lifecycle.status'), 'Canceled');
		assert.equal(publicSnapshot.get('firstEnrollmentAcceptedAt'), null);
	}
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
