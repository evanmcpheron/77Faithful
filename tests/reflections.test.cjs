const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	getReflectionsForAccount,
	listReflections,
} = require('../functions/lib/src/journey/list-reflections');
const writing = {
	revisionId: 'saved',
	text: 'Private words',
	updatedAt: { seconds: 1, nanoseconds: 0 },
};
const day = (journeyId, dayNumber, patch = {}) => ({
	userId: 'owner',
	journeyId,
	dayNumber,
	calendarDate: `2026-09-${String(dayNumber).padStart(2, '0')}`,
	reflection: writing,
	...patch,
});
const fixture = (journeys, reads = []) => ({
	collection: (path) => {
		assert.equal(path, 'users/owner/journeys');
		return {
			get: async () => ({
				docs: journeys.map(({ id, state, days, userId = 'owner' }) => ({
					id,
					data: () => ({ userId, state, startDate: '2026-09-01' }),
					ref: {
						collection: (name) => {
							assert.equal(name, 'days');
							return {
								where: (field, operator, cutoff) => {
									assert.equal(field, 'dayNumber');
									assert.equal(operator, '<=');
									return {
										orderBy: (field, direction) => {
											assert.equal(field, 'dayNumber');
											assert.equal(direction, 'desc');
											return {
												limit: (count) => {
													assert.equal(count, 8);
													return {
														get: async () => {
															const docs = days
																.filter(
																	(entry) =>
																		entry.dayNumber <=
																		cutoff,
																)
																.sort(
																	(a, b) =>
																		b.dayNumber -
																		a.dayNumber,
																)
																.slice(0, count)
																.map(
																	(
																		entry,
																	) => ({
																		data: () =>
																			entry,
																	}),
																);
															reads.push(
																docs.length,
															);
															return {
																docs,
																empty: !docs.length,
																size: docs.length,
															};
														},
													};
												},
											};
										},
									};
								},
							};
						},
					},
				})),
			}),
		};
	},
});
test('rejects unauthenticated and unconfirmed requests before reading private history', async () => {
	for (const auth of [
		undefined,
		{ uid: 'owner', token: { email_verified: false } },
	])
		await assert.rejects(listReflections.run({ auth, data: {} }), {
			code: 'permission-denied',
		});
});
test('rejects an invalid time zone', async () => {
	await assert.rejects(
		listReflections.run({
			auth: { uid: 'owner', token: { email_verified: true } },
			data: { observedPhoneTimeZoneId: 'invalid' },
		}),
		{ code: 'invalid-argument' },
	);
});
test('returns only owned, nonempty writing from reached days across journey states, newest first', async () => {
	const database = fixture([
		{
			id: 'active',
			state: { status: 'Active' },
			days: [
				day('active', 1),
				day('active', 2, { reflection: null }),
				day('active', 3, { reflection: { ...writing, text: null } }),
				day('active', 4, { reflection: { ...writing, text: '  ' } }),
				day('active', 5, { userId: 'other' }),
				day('active', 6, { journeyId: 'other' }),
				day('active', 12),
			],
		},
		{
			id: 'ended',
			state: { status: 'EndedEarly', lastReachedDayNumber: 7 },
			days: [day('ended', 7), day('ended', 8)],
		},
		{
			id: 'complete',
			state: { status: 'Completed' },
			days: [day('complete', 10)],
		},
		{
			id: 'foreign',
			userId: 'other',
			state: { status: 'Completed' },
			days: [day('foreign', 11)],
		},
	]);
	const result = await getReflectionsForAccount(
		'owner',
		'UTC',
		database,
		new Date('2026-09-11T12:00:00Z'),
	);
	assert.deepEqual(
		result.entries.map((entry) => [entry.journeyId, entry.dayNumber]),
		[
			['ended', 7],
			['complete', 10],
			['active', 1],
		],
	);
	assert.deepEqual(Object.keys(result.entries[0]).sort(), [
		'calendarDate',
		'dayNumber',
		'journeyId',
		'reflection',
		'userId',
	]);
});
test('does not read a journey before its first calendar day', async () => {
	const result = await getReflectionsForAccount(
		'owner',
		'UTC',
		fixture([
			{
				id: 'active',
				state: { status: 'Active' },
				days: [day('active', 1)],
			},
		]),
		new Date('2026-08-31T12:00:00Z'),
	);
	assert.deepEqual(result, { entries: [], nextCursor: null });
});

test('pages through 77 reflections four at a time without omissions or duplicates', async () => {
	const reads = [];
	const database = fixture(
		[
			{
				id: 'complete',
				state: { status: 'Completed' },
				days: Array.from({ length: 77 }, (_, i) =>
					day('complete', i + 1),
				),
			},
		],
		reads,
	);
	let cursor = null;
	const seen = [];
	do {
		const page = await getReflectionsForAccount(
			'owner',
			'UTC',
			database,
			new Date('2026-09-11T12:00:00Z'),
			cursor,
		);
		assert.ok(page.entries.length <= 4);
		seen.push(...page.entries.map((entry) => entry.dayNumber));
		cursor = page.nextCursor;
	} while (cursor);
	assert.deepEqual(
		seen,
		Array.from({ length: 77 }, (_, i) => 77 - i),
	);
	assert.ok(reads.every((count) => count <= 8));
});
test('bounds scans through empty writing and allows continuation', async () => {
	const reads = [];
	const database = fixture(
		[
			{
				id: 'complete',
				state: { status: 'Completed' },
				days: Array.from({ length: 77 }, (_, i) =>
					day('complete', i + 1, { reflection: null }),
				),
			},
		],
		reads,
	);
	const page = await getReflectionsForAccount(
		'owner',
		'UTC',
		database,
		new Date(),
		null,
	);
	assert.equal(
		reads.reduce((a, b) => a + b, 0),
		32,
	);
	assert.equal(page.entries.length, 0);
	assert.ok(page.nextCursor);
});
test('rejects a cursor for a journey outside the account', async () => {
	await assert.rejects(
		getReflectionsForAccount('owner', 'UTC', fixture([]), new Date(), {
			journeyId: 'foreign',
			beforeDayNumber: 5,
		}),
		{ code: 'invalid-argument' },
	);
});
