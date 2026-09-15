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
const schedules = require('../functions/lib/src/community/community-journey');
const calendar = require('../functions/lib/generated/features/journey/journey-calendar');
const projectId = 'faithful-community-journey-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 15));
let database;
const dependencies = (instant = now) => ({ database, now: instant });
const request = (operationId = 'schedule-1') => ({
	communityId: 'alpha',
	course: { courseId: 'course', courseVersionId: 'v1' },
	startDate: '2026-11-01',
	timeZoneId: 'America/New_York',
	operationId,
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
const seed = async () => {
	for (const userId of ['owner', 'member']) {
		await database.doc(`users/${userId}`).set({
			schemaVersion: 1,
			revision: 0,
			preferredName: userId,
			createdAt: now,
			updatedAt: now,
		});
		await database
			.doc(`communities/alpha/members/${userId}`)
			.set(member(userId, userId === 'owner' ? 'Organizer' : 'Member'));
	}
	await database.doc('communities/alpha').set({
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
	await database
		.doc('formationConfiguration/current')
		.set({ courseId: 'course', courseVersionId: 'v1' });
	await database.doc('formationCourses/course').set({
		schemaVersion: 1,
		title: '77 Days',
		description: 'A formation course.',
		createdAt: now,
		updatedAt: now,
	});
	await database.doc('formationCourses/course/versions/v1').set({
		schemaVersion: 1,
		courseId: 'course',
		dayCount: 77,
		weekCount: 11,
		publicationState: { status: 'Published', publishedAt: now },
		createdAt: now,
		updatedAt: now,
	});
	const batch = database.batch();
	for (let dayNumber = 1; dayNumber <= 77; dayNumber++)
		batch.set(
			database.doc(
				`formationCourses/course/versions/v1/days/day-${dayNumber}`,
			),
			{
				courseId: 'course',
				courseVersionId: 'v1',
				dayNumber,
				weekNumber: Math.ceil(dayNumber / 7),
			},
		);
	for (let weekNumber = 1; weekNumber <= 11; weekNumber++)
		batch.set(
			database.doc(
				`formationCourses/course/versions/v1/weekIntroductions/week-${weekNumber}`,
			),
			{ courseId: 'course', courseVersionId: 'v1', weekNumber },
		);
	await batch.commit();
};
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
test('organizer schedules current published course, member sees safe preview, and no private records exist', async () => {
	assert.deepEqual(
		(
			await schedules.getCommunityJourneyCourseOptionForAccount(
				'owner',
				{ communityId: 'alpha' },
				dependencies(),
			)
		).course,
		{ courseId: 'course', courseVersionId: 'v1' },
	);
	await assert.rejects(
		schedules.getCommunityJourneyCourseOptionForAccount(
			'member',
			{ communityId: 'alpha' },
			dependencies(),
		),
		fails('OrganizerRequired'),
	);
	await assert.rejects(
		schedules.configureCommunityJourneyForAccount(
			'member',
			request(),
			dependencies(),
		),
		fails('OrganizerRequired'),
	);
	const first = await schedules.configureCommunityJourneyForAccount(
		'owner',
		request(),
		dependencies(),
	);
	assert.deepEqual(
		await schedules.configureCommunityJourneyForAccount(
			'owner',
			request(),
			dependencies(),
		),
		first,
	);
	assert.equal(first.communityJourney.canEnroll, true);
	assert.equal(first.communityJourney.canRevise, true);
	assert.deepEqual(
		(
			await schedules.getCommunityJourneyScheduleForAccount(
				'member',
				{ communityId: 'alpha' },
				dependencies(),
			)
		).communityJourney,
		{ ...first.communityJourney, canRevise: false },
	);
	assert.equal(
		(await database.collection('users/member/journeys').get()).size,
		0,
	);
	assert.equal(
		(await database.collection('users/owner/journeys').get()).size,
		0,
	);
	assert.equal(
		(
			await database
				.collection('communities/alpha/communityJourneyEnrollments')
				.get()
		).size,
		0,
	);
	await assert.rejects(
		schedules.configureCommunityJourneyForAccount(
			'owner',
			{ ...request(), startDate: '2026-12-01' },
			dependencies(),
		),
		fails('OperationPayloadMismatch'),
	);
});
test('rejects invalid dates, zones, elapsed dates, forged fields, and unavailable course', async () => {
	for (const bad of [
		{ startDate: '2026-02-30' },
		{ timeZoneId: '+05:00' },
		{ timeZoneId: 'Mars/Olympus' },
		{ startDate: '2026-09-15' },
		{ currentDay: 1 },
		{ course: { courseId: 'fake', courseVersionId: 'v1' } },
	]) {
		const attempt = { ...request('bad-' + Object.keys(bad)[0]), ...bad };
		await assert.rejects(
			schedules.configureCommunityJourneyForAccount(
				'owner',
				attempt,
				dependencies(),
			),
			fails(
				bad.startDate === '2026-09-15'
					? 'EnrollmentClosed'
					: bad.course
						? 'CourseUnavailable'
						: 'InvalidInput',
			),
		);
	}
	await database.doc('formationCourses/course/versions/v1').update({
		publicationState: { status: 'Withdrawn', withdrawnAt: now },
	});
	assert.equal(
		(
			await schedules.getCommunityJourneyCourseOptionForAccount(
				'owner',
				{ communityId: 'alpha' },
				dependencies(),
			)
		).course,
		null,
	);
});
test('two concurrent schedules serialize on the community pointer', async () => {
	const outcomes = await Promise.allSettled([
		schedules.configureCommunityJourneyForAccount(
			'owner',
			request('one'),
			dependencies(),
		),
		schedules.configureCommunityJourneyForAccount(
			'owner',
			request('two'),
			dependencies(),
		),
	]);
	assert.equal(
		outcomes.filter((outcome) => outcome.status === 'fulfilled').length,
		1,
	);
	assert.equal(
		outcomes.filter(
			(outcome) =>
				outcome.status === 'rejected' &&
				outcome.reason.details?.reason === 'ScheduleExists',
		).length,
		1,
	);
	assert.equal(
		(await database.collection('communities/alpha/communityJourneys').get())
			.size,
		1,
	);
});
test('revision, permanent enrollment marker, cancellation, and new history identity', async () => {
	const first = (
		await schedules.configureCommunityJourneyForAccount(
			'owner',
			request(),
			dependencies(),
		)
	).communityJourney;
	const revised = (
		await schedules.reviseCommunityJourneyForAccount(
			'owner',
			{
				...request('revise'),
				communityJourneyId: first.communityJourneyId,
				expectedRevision: 0,
				startDate: '2026-12-01',
			},
			dependencies(),
		)
	).communityJourney;
	assert.equal(revised.revision, 1);
	await assert.rejects(
		schedules.reviseCommunityJourneyForAccount(
			'owner',
			{
				...request('stale'),
				communityJourneyId: first.communityJourneyId,
				expectedRevision: 0,
			},
			dependencies(),
		),
		fails('RevisionConflict'),
	);
	await database
		.doc(`communities/alpha/communityJourneys/${first.communityJourneyId}`)
		.update({ firstEnrollmentAcceptedAt: now });
	await assert.rejects(
		schedules.reviseCommunityJourneyForAccount(
			'owner',
			{
				...request('frozen'),
				communityJourneyId: first.communityJourneyId,
				expectedRevision: 1,
			},
			dependencies(),
		),
		fails('ScheduleFrozen'),
	);
	const canceled = (
		await schedules.cancelCommunityJourneyForAccount(
			'owner',
			{
				communityId: 'alpha',
				communityJourneyId: first.communityJourneyId,
				expectedRevision: 1,
				operationId: 'cancel',
			},
			dependencies(),
		)
	).communityJourney;
	assert.equal(canceled.status, 'Canceled');
	assert.equal(
		(
			await schedules.getCommunityJourneyScheduleForAccount(
				'member',
				{ communityId: 'alpha' },
				dependencies(),
			)
		).communityJourney,
		null,
	);
	const second = (
		await schedules.configureCommunityJourneyForAccount(
			'owner',
			request('second'),
			dependencies(),
		)
	).communityJourney;
	assert.notEqual(second.communityJourneyId, first.communityJourneyId);
	const page1 = await schedules.listCommunityJourneyHistoryForAccount(
		'member',
		{ communityId: 'alpha', pageSize: 1 },
		dependencies(),
	);
	const page2 = await schedules.listCommunityJourneyHistoryForAccount(
		'member',
		{ communityId: 'alpha', pageSize: 1, cursor: page1.nextCursor },
		dependencies(),
	);
	assert.deepEqual(
		new Set(
			[...page1.communityJourneys, ...page2.communityJourneys].map(
				(journey) => journey.communityJourneyId,
			),
		),
		new Set([first.communityJourneyId, second.communityJourneyId]),
	);
	await assert.rejects(
		schedules.listCommunityJourneyHistoryForAccount(
			'member',
			{ communityId: 'alpha', cursor: page1.nextCursor + 'x' },
			dependencies(),
		),
		fails('InvalidCursor'),
	);
});
test('closed parent invalidates pending schedule operations', async () => {
	const first = (
		await schedules.configureCommunityJourneyForAccount(
			'owner',
			request(),
			dependencies(),
		)
	).communityJourney;
	await database
		.doc('communities/alpha')
		.update({ lifecycle: { status: 'Closed', closedAt: now } });
	await assert.rejects(
		schedules.configureCommunityJourneyForAccount(
			'owner',
			request(),
			dependencies(),
		),
		fails('CommunityClosed'),
	);
	await assert.rejects(
		schedules.cancelCommunityJourneyForAccount(
			'owner',
			{
				communityId: 'alpha',
				communityJourneyId: first.communityJourneyId,
				expectedRevision: 0,
				operationId: 'cancel',
			},
			dependencies(),
		),
		fails('CommunityClosed'),
	);
});
test('community calendar display crosses DST and year/month boundaries', () => {
	assert.equal(
		calendar.getJourneyCalendarDate(
			new Date('2026-11-01T03:59:59Z'),
			'America/New_York',
		),
		'2026-10-31',
	);
	assert.equal(
		calendar.getJourneyCalendarDate(
			new Date('2026-11-01T04:00:00Z'),
			'America/New_York',
		),
		'2026-11-01',
	);
	assert.equal(
		calendar.getJourneyCalendarDate(
			new Date('2027-01-01T04:59:59Z'),
			'America/New_York',
		),
		'2026-12-31',
	);
	assert.equal(
		calendar.getJourneyCalendarDate(
			new Date('2027-01-01T05:00:00Z'),
			'America/New_York',
		),
		'2027-01-01',
	);
	assert.equal(
		calendar.getJourneyCalendarDate(
			new Date('2026-03-01T04:59:59Z'),
			'America/New_York',
		),
		'2026-02-28',
	);
});
