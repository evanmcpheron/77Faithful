const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	buildTodayVerseDocuments,
	seedTodayVerses,
} = require('../scripts/seed-today-verses.cjs');
const source = require('../content/today-verses/Nlt.json');

test('assigns all 154 supplied verses exactly once across 77 days', () => {
	const documents = buildTodayVerseDocuments();
	assert.equal(documents.size, 154);
	const assigned = [];
	for (let day = 1; day <= 77; day++) {
		const assignment = documents.get(`todayVerseDays/${day}`);
		const text = documents.get(`todayVerseDays/${day}/translations/Nlt`);
		assert.equal(assignment.dayNumber, day);
		assert.equal(assignment.top, text.top.verse);
		assert.equal(assignment.bottom, text.bottom.verse);
		assigned.push(text.top, text.bottom);
	}
	assert.deepEqual(assigned, source);
	assert.equal(new Set(assigned.map(({ verse }) => verse)).size, 154);
});

test('keeps assignments identical when another translation is reordered', () => {
	const translated = source
		.map(({ verse }) => ({ verse, text: `Translated ${verse}` }))
		.reverse();
	const documents = buildTodayVerseDocuments(translated, 'Niv');
	assert.deepEqual(
		documents.get('todayVerseDays/1'),
		buildTodayVerseDocuments().get('todayVerseDays/1'),
	);
	assert.equal(
		documents.get('todayVerseDays/1/translations/Niv').top.text,
		'Translated 1 Thessalonians 5:16',
	);
});

test('rejects missing, duplicate, blank, and changed references', () => {
	assert.throws(() => buildTodayVerseDocuments(source.slice(1)));
	assert.throws(() =>
		buildTodayVerseDocuments([source[1], ...source.slice(1)]),
	);
	assert.throws(() =>
		buildTodayVerseDocuments([
			{ ...source[0], text: ' ' },
			...source.slice(1),
		]),
	);
	assert.throws(() =>
		buildTodayVerseDocuments([
			{ ...source[0], verse: 'Unknown 1:1' },
			...source.slice(1),
		]),
	);
});

const createDatabase = (stored = new Map()) => ({
	doc: (path) => ({ path }),
	runTransaction: async (callback) => {
		const pending = [];
		const result = await callback({
			getAll: async (...refs) =>
				refs.map(({ path }) => ({
					exists: stored.has(path),
					data: () => stored.get(path),
				})),
			create: ({ path }, value) => pending.push([path, value]),
		});
		for (const [path, value] of pending) stored.set(path, value);
		return result;
	},
});

test('seeding is repeatable and adding a translation preserves NLT', async () => {
	const stored = new Map();
	const database = createDatabase(stored);
	assert.deepEqual(
		await seedTodayVerses(database, buildTodayVerseDocuments()),
		{ created: 154, unchanged: 0 },
	);
	assert.deepEqual(
		await seedTodayVerses(database, buildTodayVerseDocuments()),
		{ created: 0, unchanged: 154 },
	);
	await seedTodayVerses(database, buildTodayVerseDocuments(source, 'Niv'));
	assert.equal(stored.size, 231);
	assert.equal(
		stored.get('todayVerseDays/77/translations/Nlt').bottom.text,
		source[153].text,
	);
});

test('conflicting existing content aborts the entire import', async () => {
	const stored = new Map([['todayVerseDays/77', { top: 'Changed' }]]);
	await assert.rejects(
		seedTodayVerses(createDatabase(stored), buildTodayVerseDocuments()),
		/Existing content differs/,
	);
	assert.equal(stored.size, 1);
});
