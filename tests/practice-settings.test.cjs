const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const functionsRequire = createRequire(
	require.resolve('../functions/package.json'),
);
const { Timestamp } = functionsRequire('firebase-admin/firestore');
const {
	getPracticeSettingsForAccount: load,
	confirmPracticeSettingsForAccount: confirm,
	cancelPracticeSettingsForAccount: cancel,
} = require('../functions/lib/src/journey/practice-settings');
const {
	parseConfirmPracticeSettingsRequest: parseConfirm,
	parseCancelPracticeSettingsRequest: parseCancel,
	parsePracticeSettingsRequest: parseLoad,
} = require('../functions/lib/src/journey/practice-settings-request');
const { readJourneyDay } = require('../functions/lib/src/journey/journey-day');
const root = 'users/owner/journeys/current';
const clock = () => new Date('2026-09-11T16:00:00Z');
const request = (patch = {}) =>
	parseConfirm({
		operationId: 'confirm-1',
		journeyId: 'current',
		expectedScheduleRevision: 0,
		optionalPracticeIds: ['Worship', 'Generosity'],
		reviewedEffectiveDayNumber: 2,
		reviewedEffectiveDate: '2026-09-12',
		observedPhoneTimeZoneId: 'America/New_York',
		...patch,
	});
const cancellation = (result, patch = {}) =>
	parseCancel({
		operationId: 'cancel-1',
		journeyId: 'current',
		expectedScheduleRevision: result.selection.scheduleRevision,
		practiceChangeId: result.practiceChangeId,
		observedPhoneTimeZoneId: 'America/New_York',
		...patch,
	});

const fixture = () => {
	const documents = new Map();
	let nextId = 0;
	let fail = false;
	const reference = (path, filter) => ({
		path,
		id: path.split('/').at(-1),
		filter,
		collection: (name) => reference(`${path}/${name}`),
		doc: (id = `change-${++nextId}`) => reference(`${path}/${id}`),
		where: (field, _operator, value) => reference(path, { field, value }),
		limit: () => reference(path, filter),
	});
	const snapshot = (ref) => ({
		ref,
		id: ref.id,
		exists: documents.has(ref.path),
		data: () => documents.get(ref.path),
	});
	const database = {
		doc: reference,
		runTransaction: async (callback) => {
			for (let attempt = 0; attempt < 5; attempt++) {
				const reads = new Map();
				const collections = [];
				const writes = [];
				const result = await callback({
					get: async (ref) => {
						assert.equal(
							writes.length,
							0,
							'all reads precede writes',
						);
						if (ref.path.split('/').length % 2 === 0) {
							reads.set(ref.path, documents.get(ref.path));
							return snapshot(ref);
						}
						const paths = [...documents.keys()].filter(
							(path) =>
								path.startsWith(`${ref.path}/`) &&
								path.split('/').length ===
									ref.path.split('/').length + 1,
						);
						collections.push({ prefix: ref.path, paths });
						for (const path of paths)
							reads.set(path, documents.get(path));
						const docs = paths
							.filter(
								(path) =>
									!ref.filter ||
									ref.filter.field
										.split('.')
										.reduce(
											(value, key) => value?.[key],
											documents.get(path),
										) === ref.filter.value,
							)
							.map((path) => snapshot(reference(path)));
						return {
							docs,
							size: docs.length,
							empty: docs.length === 0,
						};
					},
					create: (ref, value) =>
						writes.push(() => {
							assert.ok(!documents.has(ref.path));
							documents.set(ref.path, value);
						}),
					update: (ref, value) =>
						writes.push(() =>
							documents.set(ref.path, {
								...documents.get(ref.path),
								...value,
							}),
						),
				});
				if (
					[...reads].some(
						([path, value]) => documents.get(path) !== value,
					) ||
					collections.some(
						({ prefix, paths }) =>
							[...documents.keys()].filter(
								(path) =>
									path.startsWith(`${prefix}/`) &&
									path.split('/').length ===
										prefix.split('/').length + 1,
							).length !== paths.length,
					)
				)
					continue;
				if (fail) throw new Error('commit failed');
				writes.forEach((write) => write());
				return result;
			}
			throw new Error('contention');
		},
	};
	documents.set(root, {
		userId: 'owner',
		startDate: '2026-09-11',
		initialOptionalPracticeIds: ['Movement', 'Gratitude'],
		practiceScheduleRevision: 0,
		state: { status: 'Active' },
		course: { courseId: 'course', courseVersionId: 'v1' },
	});
	return {
		database,
		documents,
		fail: () => {
			fail = true;
		},
	};
};
const expectCode = (code) => (error) => error.code === code;

test('loads selection without requiring Scripture content and confirms only the next day', async () => {
	const { database, documents } = fixture();
	const loaded = await load(
		'owner',
		parseLoad({ observedPhoneTimeZoneId: 'America/New_York' }),
		database,
		clock,
	);
	assert.equal(loaded.dayNumber, 1);
	assert.deepEqual(loaded.nextDay, {
		dayNumber: 2,
		calendarDate: '2026-09-12',
	});
	const result = await confirm('owner', request(), database, clock);
	assert.deepEqual(result.selection.currentOptionalPracticeIds, [
		'Movement',
		'Gratitude',
	]);
	assert.deepEqual(result.selection.pendingChange.optionalPracticeIds, [
		'Worship',
		'Generosity',
	]);
	assert.equal(documents.get(root).practiceScheduleRevision, 1);
	assert.deepEqual(documents.get(root).initialOptionalPracticeIds, [
		'Movement',
		'Gratitude',
	]);
	assert.equal(
		[...documents.keys()].some((path) => path.includes('/days/')),
		false,
	);
});

test('repeated operations recover their receipt, including after midnight or ending, but reused IDs cannot change payload', async () => {
	const { database, documents } = fixture();
	const first = await confirm('owner', request(), database, clock);
	documents.set(root, {
		...documents.get(root),
		state: { status: 'EndedEarly', lastReachedDayNumber: 1 },
	});
	assert.deepEqual(
		await confirm(
			'owner',
			request(),
			database,
			() => new Date('2026-09-12T16:00:00Z'),
		),
		first,
	);
	await assert.rejects(
		confirm(
			'owner',
			request({ optionalPracticeIds: ['Movement', 'Worship'] }),
			database,
			clock,
		),
		expectCode('already-exists'),
	);
	assert.equal(documents.get(root).practiceScheduleRevision, 1);
});

test('revising supersedes exactly one upcoming selection and cancellation preserves history', async () => {
	const { database, documents } = fixture();
	const first = await confirm('owner', request(), database, clock);
	const revised = await confirm(
		'owner',
		request({
			operationId: 'revise',
			expectedScheduleRevision: 1,
			optionalPracticeIds: ['Movement', 'Worship', 'Generosity'],
		}),
		database,
		clock,
	);
	assert.equal(
		documents.get(`${root}/practiceChanges/${first.practiceChangeId}`)
			.status,
		'Superseded',
	);
	const canceled = await cancel(
		'owner',
		cancellation(revised),
		database,
		clock,
	);
	assert.equal(canceled.selection.pendingChange, null);
	assert.deepEqual(canceled.selection.currentOptionalPracticeIds, [
		'Movement',
		'Gratitude',
	]);
	assert.equal(canceled.selection.scheduleRevision, 3);
	assert.equal(
		documents.get(`${root}/practiceChanges/${revised.practiceChangeId}`)
			.status,
		'Canceled',
	);
	assert.deepEqual(
		await cancel('owner', cancellation(revised), database, clock),
		canceled,
	);
});

test('concurrent confirmations with the same revision allow exactly one winner', async () => {
	const { database, documents } = fixture();
	const results = await Promise.allSettled([
		confirm('owner', request(), database, clock),
		confirm(
			'owner',
			request({
				operationId: 'competing',
				optionalPracticeIds: ['Movement', 'Worship'],
			}),
			database,
			clock,
		),
	]);
	assert.equal(
		results.filter((result) => result.status === 'fulfilled').length,
		1,
	);
	assert.equal(documents.get(root).practiceScheduleRevision, 1);
	assert.equal(
		[...documents.keys()].filter((path) =>
			path.includes('/practiceChanges/'),
		).length,
		1,
	);
});

test('concurrent cancellation and replacement cannot silently overwrite one another', async () => {
	const { database, documents } = fixture();
	const initial = await confirm('owner', request(), database, clock);
	const results = await Promise.allSettled([
		cancel('owner', cancellation(initial), database, clock),
		confirm(
			'owner',
			request({
				operationId: 'revise',
				expectedScheduleRevision: 1,
				optionalPracticeIds: ['Movement', 'Worship'],
			}),
			database,
			clock,
		),
	]);
	assert.equal(
		results.filter((result) => result.status === 'fulfilled').length,
		1,
	);
	assert.equal(documents.get(root).practiceScheduleRevision, 2);
});

test('midnight invalidates a stale review and makes a pending change effective before Applied is persisted', async () => {
	const { database, documents } = fixture();
	const first = await confirm('owner', request(), database, clock);
	const tomorrow = () => new Date('2026-09-12T04:00:00Z');
	await assert.rejects(
		cancel('owner', cancellation(first), database, tomorrow),
		expectCode('failed-precondition'),
	);
	await assert.rejects(
		confirm(
			'owner',
			request({ operationId: 'stale', expectedScheduleRevision: 1 }),
			database,
			tomorrow,
		),
		expectCode('failed-precondition'),
	);
	const loaded = await load(
		'owner',
		{ observedPhoneTimeZoneId: 'America/New_York' },
		database,
		tomorrow,
	);
	assert.deepEqual(loaded.selection.currentOptionalPracticeIds, [
		'Worship',
		'Generosity',
	]);
	assert.equal(loaded.selection.pendingChange, null);
	assert.equal(
		documents.get(`${root}/practiceChanges/${first.practiceChangeId}`)
			.status,
		'Applied',
	);
});

test('travel cannot cancel an applied selection or rewrite a previously assigned next day', async () => {
	const { database, documents } = fixture();
	const result = await confirm('owner', request(), database, clock);
	const day = {
		userId: 'owner',
		journeyId: 'current',
		dayNumber: 2,
		practices: {
			optionalPractices: [
				{ practiceId: 'Worship' },
				{ practiceId: 'Generosity' },
			],
		},
	};
	documents.set(`${root}/days/2`, day);
	const loaded = await load(
		'owner',
		{ observedPhoneTimeZoneId: 'America/New_York' },
		database,
		clock,
	);
	assert.equal(loaded.nextDay, null);
	await assert.rejects(
		cancel('owner', cancellation(result), database, clock),
		expectCode('failed-precondition'),
	);
	await assert.rejects(
		confirm(
			'owner',
			request({
				operationId: 'rewrite',
				expectedScheduleRevision: 1,
				optionalPracticeIds: ['Movement', 'Worship'],
			}),
			database,
			clock,
		),
		expectCode('failed-precondition'),
	);
	assert.deepEqual(documents.get(`${root}/days/2`), day);
});

test('Day 76 can schedule Day 77, while Day 77 and elapsed or terminal journeys reject changes', async () => {
	const { database, documents } = fixture();
	documents.set(root, { ...documents.get(root), startDate: '2026-06-28' });
	await confirm(
		'owner',
		request({ reviewedEffectiveDayNumber: 77 }),
		database,
		clock,
	);
	const lastDay = () => new Date('2026-09-12T16:00:00Z');
	assert.equal(
		(
			await load(
				'owner',
				{ observedPhoneTimeZoneId: 'UTC' },
				database,
				lastDay,
			)
		).nextDay,
		null,
	);
	await assert.rejects(
		confirm(
			'owner',
			request({ operationId: 'day78', expectedScheduleRevision: 1 }),
			database,
			lastDay,
		),
		expectCode('failed-precondition'),
	);
	assert.equal(
		(
			await load(
				'owner',
				{ observedPhoneTimeZoneId: 'UTC' },
				database,
				() => new Date('2026-09-13T16:00:00Z'),
			)
		).status,
		'Completed',
	);
	for (const status of ['Completed', 'EndedEarly']) {
		documents.set(root, { ...documents.get(root), state: { status } });
		await assert.rejects(
			confirm(
				'owner',
				request({ operationId: status, expectedScheduleRevision: 1 }),
				database,
				clock,
			),
			expectCode('failed-precondition'),
		);
	}
});

test('calendar review uses the current phone zone and calendar days across DST', async () => {
	const { database, documents } = fixture();
	documents.set(root, { ...documents.get(root), startDate: '2026-03-08' });
	const instant = () => new Date('2026-03-09T03:30:00Z');
	const local = await load(
		'owner',
		{ observedPhoneTimeZoneId: 'America/New_York' },
		database,
		instant,
	);
	assert.equal(local.dayNumber, 1);
	assert.equal(local.nextDay.calendarDate, '2026-03-09');
	assert.equal(
		(
			await load(
				'owner',
				{ observedPhoneTimeZoneId: 'UTC' },
				database,
				instant,
			)
		).dayNumber,
		2,
	);
	await confirm(
		'owner',
		request({ reviewedEffectiveDate: '2026-03-09' }),
		database,
		instant,
	);
});

test('other accounts cannot read or change a participant’s selection', async () => {
	const { database } = fixture();
	assert.equal(
		(
			await load(
				'other',
				{ observedPhoneTimeZoneId: 'UTC' },
				database,
				clock,
			)
		).status,
		'NoActiveJourney',
	);
	await assert.rejects(
		confirm('other', request(), database, clock),
		expectCode('not-found'),
	);
});

test('a failed transaction leaves no changed schedule or receipt', async () => {
	const { database, documents, fail } = fixture();
	fail();
	await assert.rejects(confirm('owner', request(), database, clock));
	assert.equal(documents.get(root).practiceScheduleRevision, 0);
	assert.equal(documents.size, 1);
});

test('lazy historical day materialization uses effective history and gives replacements fresh completion states', async (t) => {
	t.mock.timers.enable({
		apis: ['Date'],
		now: new Date('2026-09-13T16:00:00Z'),
	});
	const { database, documents } = fixture();
	await confirm('owner', request(), database, clock);
	documents.set('formationCourses/course/versions/v1', {
		publicationState: { status: 'Published' },
	});
	for (const dayNumber of [1, 2])
		documents.set(`formationCourses/course/versions/v1/days/${dayNumber}`, {
			dayNumber,
			weekNumber: 1,
			themeId: 'AbidingInChrist',
			courseId: 'course',
			courseVersionId: 'v1',
		});
	const read = (dayNumber) =>
		database.runTransaction(async (transaction) => {
			const result = await readJourneyDay(
				transaction,
				database,
				'owner',
				{
					journeyId: 'current',
					dayNumber,
					observedPhoneTimeZoneId: 'UTC',
				},
			);
			if (result.isNew)
				transaction.create(result.dayReference, result.day);
			return result.day;
		});
	const yesterday = await read(1);
	const today = await read(2);
	assert.deepEqual(
		yesterday.practices.optionalPractices.map((item) => item.practiceId),
		['Movement', 'Gratitude'],
	);
	assert.deepEqual(
		today.practices.optionalPractices.map((item) => item.practiceId),
		['Worship', 'Generosity'],
	);
	assert.ok(
		today.practices.optionalPractices.every(
			(item) =>
				item.completion.status === 'NotMarked' &&
				item.completion.revision === 0,
		),
	);
	assert.deepEqual(await read(1), yesterday);
});

test('callable endpoints reject unverified and unauthenticated accounts', async () => {
	const endpoints = require('../functions/lib/src/index');
	for (const name of [
		'getPracticeSettings',
		'confirmOptionalPracticeReplacement',
		'cancelOptionalPracticeReplacement',
	]) {
		for (const auth of [
			undefined,
			{ uid: 'owner', token: { email_verified: false } },
		])
			await assert.rejects(
				endpoints[name].run({ data: {}, auth }),
				expectCode('permission-denied'),
			);
	}
});

for (const patch of [
	{ optionalPracticeIds: ['Movement'] },
	{ optionalPracticeIds: ['Movement', 'Movement'] },
	{ optionalPracticeIds: ['ReadScripture', 'Worship'] },
	{ optionalPracticeIds: ['Invalid', 'Worship'] },
	{
		optionalPracticeIds: [
			'Movement',
			'Worship',
			'Generosity',
			'Gratitude',
			'ChristianReading',
		],
	},
	{ observedPhoneTimeZoneId: 'Invalid/Zone' },
	{ observedPhoneTimeZoneId: '+03:00' },
	{ reviewedEffectiveDate: '2026-02-30' },
	{ reviewedEffectiveDayNumber: 78 },
	{ expectedScheduleRevision: -1 },
	{ journeyId: '../other' },
	{ operationId: 'a/b' },
])
	test(`rejects malformed input ${JSON.stringify(patch)}`, () =>
		assert.throws(() => request(patch), expectCode('invalid-argument')));

test('an applied change stays immutable after travel even without a materialized day', async () => {
	const { database } = fixture();
	const result = await confirm('owner', request(), database, clock);
	await load(
		'owner',
		{ observedPhoneTimeZoneId: 'America/New_York' },
		database,
		() => new Date('2026-09-12T16:00:00Z'),
	);
	const earlier = await load(
		'owner',
		{ observedPhoneTimeZoneId: 'America/New_York' },
		database,
		clock,
	);
	assert.equal(earlier.nextDay, null);
	await assert.rejects(
		confirm(
			'owner',
			request({
				operationId: 'travel',
				expectedScheduleRevision: 1,
				optionalPracticeIds: ['Movement', 'Worship'],
			}),
			database,
			clock,
		),
		expectCode('failed-precondition'),
	);
	await assert.rejects(
		cancel('owner', cancellation(result), database, clock),
		expectCode('failed-precondition'),
	);
});

test('crossing midnight during transaction reads requires another review', async () => {
	const { database, documents } = fixture();
	let reads = 0;
	const boundaryClock = () =>
		++reads === 1
			? new Date('2026-09-12T03:59:59Z')
			: new Date('2026-09-12T04:00:00Z');
	await assert.rejects(
		confirm('owner', request(), database, boundaryClock),
		expectCode('failed-precondition'),
	);
	assert.equal(documents.get(root).practiceScheduleRevision, 0);
});

test('simultaneous retries of the same operation commit only one change', async () => {
	const { database, documents } = fixture();
	const results = await Promise.all([
		confirm('owner', request(), database, clock),
		confirm('owner', request(), database, clock),
	]);
	assert.deepEqual(results[0], results[1]);
	assert.equal(documents.get(root).practiceScheduleRevision, 1);
});
