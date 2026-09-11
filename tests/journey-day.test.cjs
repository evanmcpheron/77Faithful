const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const functionsRequire = createRequire(
	require.resolve('../functions/package.json'),
);
const { Timestamp } = functionsRequire('firebase-admin/firestore');
const {
	getJourneyDayForAccount,
} = require('../functions/lib/src/journey/journey-day');
const {
	completeJourneyPracticeForAccount,
	saveJourneyReflectionForAccount,
} = require('../functions/lib/src/journey/journey-day-participation');
const {
	parseGetJourneyDayRequest,
	parseCompleteJourneyPracticeRequest,
	parseSaveJourneyReflectionRequest,
} = require('../functions/lib/src/journey/journey-day-request');
const {
	buildProvisionalCourse,
	courseId,
	courseVersionId,
	bibleTextEditionId,
} = require('../scripts/provisional-course.cjs');
const scripture = require('../content/provisional-course/scripture-web.json');
const manuscript = require('../content/provisional-course/manuscript.json');

const createDatabase = () => {
	const now = Timestamp.now();
	const documents = buildProvisionalCourse(now);
	documents.set('formationConfiguration/current', {
		courseId,
		courseVersionId,
		bibleTextEditionIds: { Web: bibleTextEditionId },
	});
	documents.set(`bibleTextEditions/${bibleTextEditionId}`, {
		bibleVersionId: 'Web',
		releaseState: { status: 'Released' },
		acknowledgments: scripture.acknowledgments,
	});
	documents.set('users/owner', { preferredName: 'Alex' });
	documents.set('users/owner/preferences/current', { bibleVersionId: 'Web' });
	documents.set('users/owner/journeys/current', {
		schemaVersion: 1,
		userId: 'owner',
		course: { courseId, courseVersionId },
		startDate: new Date().toISOString().slice(0, 10),
		timeZoneId: 'UTC',
		initialOptionalPracticeIds: ['Movement', 'ServeOrEncourage'],
		practiceScheduleRevision: 0,
		state: { status: 'Active' },
		startingMotivation: null,
		createdAt: now,
		updatedAt: now,
	});
	const reference = (path) => ({
		path,
		id: path.split('/').at(-1),
		collection: (name) => reference(`${path}/${name}`),
		doc: (id) => reference(`${path}/${id}`),
	});
	const snapshot = (ref) => ({
		exists: documents.has(ref.path),
		data: () => documents.get(ref.path),
		id: ref.id,
		ref,
	});
	const database = {
		doc: reference,
		runTransaction: async (callback) => {
			const writes = [];
			const result = await callback({
				get: async (ref) => {
					assert.equal(writes.length, 0, 'reads precede writes');
					if (ref.path.split('/').length % 2 === 0)
						return snapshot(ref);
					return {
						docs: [...documents.keys()]
							.filter(
								(path) =>
									path.startsWith(`${ref.path}/`) &&
									path.split('/').length ===
										ref.path.split('/').length + 1,
							)
							.map((path) => snapshot(reference(path))),
					};
				},
				create: (ref, document) => {
					assert.equal(documents.has(ref.path), false);
					writes.push([ref.path, document]);
				},
				set: (ref, document) => writes.push([ref.path, document]),
			});
			for (const [path, document] of writes)
				documents.set(path, document);
			return result;
		},
	};
	return { documents, database };
};

const dayRequest = {
	journeyId: 'current',
	dayNumber: 1,
	observedPhoneTimeZoneId: 'UTC',
};
const origin = (id) => ({
	operationId: id,
	deviceId: 'test-device',
	recordedOnDeviceAt: { seconds: 1, nanoseconds: 0 },
});
const completeRequest = (
	id,
	practiceId = 'ReadScripture',
	revision = 0,
	isComplete = true,
) => ({
	...dayRequest,
	practiceId,
	isComplete,
	expectedCompletionRevision: revision,
	origin: origin(id),
});
const reflectionRequest = (id, text, expectedRevisionId = null) => ({
	target: { kind: 'DailyReflection', journeyId: 'current', dayNumber: 1 },
	text,
	expectedRevisionId,
	origin: origin(id),
	observedPhoneTimeZoneId: 'UTC',
});

test('seeded weeks and days follow the revised weekly theme order', () => {
	const expectedThemes = [
		'AbidingInChrist',
		'Identity',
		'Scripture',
		'Prayer',
		'Renewal',
		'Love',
		'ChristianCommunity',
		'Service',
		'Stewardship',
		'Mission',
		'Perseverance',
	];
	const documents = buildProvisionalCourse(Timestamp.now());
	const versionPath = `formationCourses/${courseId}/versions/${courseVersionId}`;
	for (const [index, themeId] of expectedThemes.entries()) {
		const weekNumber = index + 1;
		for (const collection of ['weekOverviews', 'weekIntroductions']) {
			const week = documents.get(
				`${versionPath}/${collection}/${weekNumber}`,
			);
			assert.equal(week.weekNumber, weekNumber);
			assert.equal(week.themeId, themeId);
		}
		for (let offset = 1; offset <= 7; offset++) {
			const dayNumber = index * 7 + offset;
			const day = documents.get(`${versionPath}/days/${dayNumber}`);
			assert.equal(day.dayNumber, dayNumber);
			assert.equal(day.weekNumber, weekNumber);
			assert.equal(day.themeId, themeId);
		}
	}
});

test('all 77 readings retain their full source text and actual translation', async () => {
	const { database, documents } = createDatabase();
	documents.get('users/owner/journeys/current').state = {
		status: 'Completed',
	};
	for (const day of manuscript.days) {
		const session = await getJourneyDayForAccount(
			'owner',
			{ ...dayRequest, dayNumber: day.dayNumber },
			database,
		);
		assert.equal(session.scriptureReference, day.passage);
		assert.equal(session.translation.bibleVersionId, 'Web');
		assert.deepEqual(
			session.scripture.primaryPassage.paragraphs.flatMap(
				(paragraph) => paragraph.runs,
			),
			scripture.readings[day.passage],
		);
		assert.equal(session.day.practices.readScripture.status, 'NotMarked');
		assert.equal(session.day.practices.optionalPractices.length, 2);
		assert.equal(session.day.reflection, null);
		assert.equal(typeof session.day.createdAt.seconds, 'number');
	}
});

test('opening a day is idempotent and never completes a practice', async () => {
	const { database, documents } = createDatabase();
	const first = await getJourneyDayForAccount('owner', dayRequest, database);
	const second = await getJourneyDayForAccount('owner', dayRequest, database);
	assert.deepEqual(first, second);
	assert.equal(
		documents.get('users/owner/journeys/current/days/1')
			.lastParticipantUpdateAt,
		null,
	);
});

test('completion survives reopening, can be undone, and retries do not create extra revisions', async () => {
	const { database } = createDatabase();
	const request = completeRequest('complete-scripture');
	const first = await completeJourneyPracticeForAccount(
		'owner',
		request,
		database,
	);
	assert.equal(first.completion.revision, 1);
	assert.deepEqual(
		await completeJourneyPracticeForAccount('owner', request, database),
		first,
	);
	assert.equal(
		(await getJourneyDayForAccount('owner', dayRequest, database)).day
			.practices.readScripture.status,
		'Complete',
	);
	await completeJourneyPracticeForAccount(
		'owner',
		completeRequest('undo-scripture', 'ReadScripture', 1, false),
		database,
	);
	assert.equal(
		(await getJourneyDayForAccount('owner', dayRequest, database)).day
			.practices.readScripture.status,
		'NotMarked',
	);
	await completeJourneyPracticeForAccount(
		'owner',
		completeRequest('complete-movement', 'Movement'),
		database,
	);
	const session = await getJourneyDayForAccount(
		'owner',
		dayRequest,
		database,
	);
	assert.equal(
		session.day.practices.optionalPractices[0].completion.status,
		'Complete',
	);
	assert.equal(session.day.practices.pray.status, 'NotMarked');
});

test('unassigned practices, reused operation IDs, and stale completions cannot overwrite records', async () => {
	const { database } = createDatabase();
	await assert.rejects(
		completeJourneyPracticeForAccount(
			'owner',
			completeRequest('bad-practice', 'Worship'),
			database,
		),
		{ code: 'failed-precondition' },
	);
	await completeJourneyPracticeForAccount(
		'owner',
		completeRequest('first'),
		database,
	);
	await assert.rejects(
		completeJourneyPracticeForAccount(
			'owner',
			completeRequest('stale'),
			database,
		),
		{ code: 'aborted' },
	);
	await assert.rejects(
		completeJourneyPracticeForAccount(
			'owner',
			completeRequest('first', 'Pray'),
			database,
		),
		{ code: 'already-exists' },
	);
});

test('reflection saving and completion remain independent, including an empty reflection', async () => {
	const { database, documents } = createDatabase();
	const saved = await saveJourneyReflectionForAccount(
		'owner',
		reflectionRequest('first-writing', 'A private response'),
		database,
	);
	assert.equal(saved.currentWriting.text, 'A private response');
	assert.equal(
		(await getJourneyDayForAccount('owner', dayRequest, database)).day
			.practices.reflect.status,
		'NotMarked',
	);
	await completeJourneyPracticeForAccount(
		'owner',
		completeRequest('reflect', 'Reflect'),
		database,
	);
	await saveJourneyReflectionForAccount(
		'owner',
		reflectionRequest('empty-writing', '', 'first-writing'),
		database,
	);
	const reopened = await getJourneyDayForAccount(
		'owner',
		dayRequest,
		database,
	);
	assert.equal(reopened.day.reflection.text, '');
	assert.equal(reopened.day.practices.reflect.status, 'Complete');
	assert.equal(
		documents.get(
			'users/owner/journeys/current/writingRevisions/first-writing',
		).text,
		'A private response',
	);
});

test('competing reflection saves preserve the account version and reject a stale replacement', async () => {
	const { database } = createDatabase();
	const request = reflectionRequest('first-writing', 'Original response');
	const saved = await saveJourneyReflectionForAccount(
		'owner',
		request,
		database,
	);
	assert.deepEqual(
		await saveJourneyReflectionForAccount('owner', request, database),
		saved,
	);
	await assert.rejects(
		saveJourneyReflectionForAccount(
			'owner',
			reflectionRequest('stale-writing', 'Stale response'),
			database,
		),
		{ code: 'aborted' },
	);
	assert.equal(
		(await getJourneyDayForAccount('owner', dayRequest, database)).day
			.reflection.text,
		'Original response',
	);
});

test('future days, unreached days after early ending, and another account are inaccessible', async () => {
	const { database, documents } = createDatabase();
	await assert.rejects(
		getJourneyDayForAccount(
			'owner',
			{ ...dayRequest, dayNumber: 2 },
			database,
		),
		{ code: 'failed-precondition' },
	);
	await assert.rejects(
		getJourneyDayForAccount('other', dayRequest, database),
		{
			code: 'not-found',
		},
	);
	await assert.rejects(
		completeJourneyPracticeForAccount(
			'other',
			completeRequest('other'),
			database,
		),
		{ code: 'not-found' },
	);
	documents.get('users/owner/journeys/current').state = {
		status: 'EndedEarly',
		lastReachedDayNumber: 1,
	};
	await assert.rejects(
		saveJourneyReflectionForAccount(
			'owner',
			{
				...reflectionRequest('future', 'Text'),
				target: {
					kind: 'DailyReflection',
					journeyId: 'current',
					dayNumber: 2,
				},
			},
			database,
		),
		{ code: 'failed-precondition' },
	);
});

test('withdrawn or mismatched Scripture stays unavailable without substituting translations', async () => {
	const { database, documents } = createDatabase();
	documents.get(
		`bibleTextEditions/${bibleTextEditionId}`,
	).releaseState.status = 'Withdrawn';
	const session = await getJourneyDayForAccount(
		'owner',
		dayRequest,
		database,
	);
	assert.equal(session.scripture, null);
	assert.equal(session.scriptureReference, manuscript.days[0].passage);
	assert.equal(session.translation.abbreviation, 'WEB');
	await completeJourneyPracticeForAccount(
		'owner',
		completeRequest('physical-bible'),
		database,
	);
	documents.get('users/owner/preferences/current').bibleVersionId = 'Niv';
	const niv = await getJourneyDayForAccount('owner', dayRequest, database);
	assert.equal(niv.translation.abbreviation, 'NIV');
	assert.equal(niv.scripture, null);
});

test('four chosen practices are preserved and effective changes apply only to the assigned day', async () => {
	const { database, documents } = createDatabase();
	const journey = documents.get('users/owner/journeys/current');
	journey.initialOptionalPracticeIds = [
		'Movement',
		'ServeOrEncourage',
		'Gratitude',
		'Worship',
	];
	journey.practiceScheduleRevision = 1;
	journey.state.status = 'Completed';
	documents.set('users/owner/journeys/current/practiceChanges/change', {
		effectiveDayNumber: 2,
		scheduleRevision: 1,
		status: 'Pending',
		optionalPracticeIds: ['ChristianReading', 'Generosity'],
	});
	assert.equal(
		(await getJourneyDayForAccount('owner', dayRequest, database)).day
			.practices.optionalPractices.length,
		4,
	);
	const second = await getJourneyDayForAccount(
		'owner',
		{ ...dayRequest, dayNumber: 2 },
		database,
	);
	assert.deepEqual(
		second.day.practices.optionalPractices.map(
			(practice) => practice.practiceId,
		),
		['ChristianReading', 'Generosity'],
	);
});

test('request boundaries reject invalid dates, IDs, revisions, timestamps, and writing targets', () => {
	assert.deepEqual(parseGetJourneyDayRequest(dayRequest), dayRequest);
	assert.deepEqual(
		parseCompleteJourneyPracticeRequest(completeRequest('valid')),
		completeRequest('valid'),
	);
	assert.deepEqual(
		parseSaveJourneyReflectionRequest(reflectionRequest('valid', 'Text')),
		reflectionRequest('valid', 'Text'),
	);
	for (const request of [
		{ ...dayRequest, dayNumber: 0 },
		{ ...dayRequest, dayNumber: 78 },
		{ ...dayRequest, dayNumber: 1.5 },
		{ ...dayRequest, journeyId: '../other' },
		{ ...dayRequest, observedPhoneTimeZoneId: 'invalid' },
	]) {
		assert.throws(() => parseGetJourneyDayRequest(request), {
			code: 'invalid-argument',
		});
	}
	assert.throws(
		() =>
			parseCompleteJourneyPracticeRequest({
				...completeRequest('bad'),
				expectedCompletionRevision: -1,
			}),
		{ code: 'invalid-argument' },
	);
	assert.throws(
		() =>
			parseCompleteJourneyPracticeRequest({
				...completeRequest('bad'),
				origin: {
					...origin('bad'),
					recordedOnDeviceAt: { seconds: 1, nanoseconds: 1e9 },
				},
			}),
		{ code: 'invalid-argument' },
	);
	assert.throws(
		() =>
			parseSaveJourneyReflectionRequest(
				reflectionRequest('long', 'x'.repeat(10001)),
			),
		{ code: 'invalid-argument' },
	);
	assert.throws(
		() =>
			parseSaveJourneyReflectionRequest({
				...reflectionRequest('wrong', 'Text'),
				target: { kind: 'SetupMotivation' },
			}),
		{ code: 'invalid-argument' },
	);
});
