const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	readTodayVerses,
} = require('../functions/lib/src/journey/today-verses');
const {
	buildTodayVerseDocuments,
} = require('../scripts/seed-today-verses.cjs');

const read = (documents, dayNumber, version) => {
	const reference = (path) => ({
		path,
		collection: (name) => ({
			doc: (id) => reference(`${path}/${name}/${id}`),
		}),
	});
	return readTodayVerses(
		{ get: async ({ path }) => ({ data: () => documents.get(path) }) },
		{ doc: reference },
		dayNumber,
		version,
	);
};

test('reads the requested day and exact selected translation', async () => {
	const documents = buildTodayVerseDocuments();
	const result = await read(documents, 77, 'Nlt');
	assert.deepEqual(result.bottom, {
		verse: 'Luke 1:37',
		text: 'The word of God will never fail.',
	});
});

test('missing translations retain references without substituting NLT', async () => {
	const result = await read(buildTodayVerseDocuments(), 1, 'Niv');
	assert.deepEqual(result, {
		top: { verse: '1 Thessalonians 5:16', text: null },
		bottom: { verse: 'Psalms 46:10', text: null },
	});
});

test('rejects text with a different reference or mislabeled translation', async () => {
	const documents = buildTodayVerseDocuments();
	const translated = documents.get('todayVerseDays/1/translations/Nlt');
	documents.set('todayVerseDays/1/translations/Nlt', {
		...translated,
		top: { verse: 'John 1:1', text: 'Wrong verse' },
	});
	assert.equal((await read(documents, 1, 'Nlt')).top.text, null);
	assert.equal(
		(await read(documents, 1, 'Nlt')).bottom.text,
		translated.bottom.text,
	);
	documents.set('todayVerseDays/1/translations/Nlt', {
		...translated,
		bibleVersionId: 'Niv',
	});
	assert.equal((await read(documents, 1, 'Nlt')).bottom.text, null);
});

test('missing and malformed assignments do not prevent the day from loading', async () => {
	assert.equal(await read(new Map(), 1, 'Nlt'), null);
	assert.equal(
		await read(
			new Map([
				[
					'todayVerseDays/1',
					{ schemaVersion: 1, dayNumber: 2, top: 'A', bottom: 'B' },
				],
			]),
			1,
			'Nlt',
		),
		null,
	);
});
