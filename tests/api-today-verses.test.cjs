const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	buildApiTodayVerseDocuments,
} = require('../scripts/prepare-api-today-verses.cjs');
const {
	readTodayVerses,
} = require('../functions/lib/src/journey/today-verses');
const {
	verifyApiExcerpt,
} = require('../functions/lib/src/journey/refresh-today-verses');
const metadata = require('../content/today-verses/api-sources.json');
const nlt = require('../content/today-verses/Nlt.json');

const read = (documents, version) => {
	const ref = (path) => ({
		path,
		collection: (name) => ({ doc: (id) => ref(`${path}/${name}/${id}`) }),
	});
	return readTodayVerses(
		{ get: async ({ path }) => ({ data: () => documents.get(path) }) },
		{ doc: ref },
		1,
		version,
	);
};

for (const version of [
	'Nasb2020',
	'Csb',
	'Msg',
	'Nkjv',
	'Niv',
	'Kjv',
	'Amp',
	'Gnt',
]) {
	test(`${version} preserves every daily assignment and carries source attribution`, () => {
		const verses = require(`../content/today-verses/${version}.json`);
		const documents = buildApiTodayVerseDocuments(verses, {
			...metadata[version],
			fetchedAt: new Date().toISOString(),
		});
		assert.equal(documents.size, 154);
		const references = [];
		for (let day = 1; day <= 77; day++) {
			const doc = documents.get(
				`todayVerseDays/${day}/translations/${version}`,
			);
			for (const slot of ['top', 'bottom']) {
				references.push(doc[slot].verse);
				assert.ok(doc[slot].sourceId);
				assert.ok(doc[slot].sourceReference);
				assert.ok(doc[slot].text.length < 240);
			}
			assert.equal(doc.source.bibleId, metadata[version].bibleId);
			assert.ok(doc.source.copyright);
		}
		assert.deepEqual(
			references,
			nlt.map(({ verse }) => verse),
		);
	});
}

test('MSG shows the actual source range while preserving the assigned single verse', async () => {
	const documents = buildApiTodayVerseDocuments(
		require('../content/today-verses/Msg.json'),
		{ ...metadata.Msg, fetchedAt: new Date().toISOString() },
	);
	const result = await read(documents, 'Msg');
	assert.equal(result.top.verse, '1 Thessalonians 5:16');
	assert.equal(result.top.displayReference, '1 Thessalonians 5:16-18');
	assert.equal(result.top.text, 'Be cheerful no matter what');
	assert.equal(result.providerUrl, 'https://api.bible');
	assert.ok(result.copyright);
});

test('expired, withdrawn, or malformed API caches show references without stale text', async () => {
	const documents = buildApiTodayVerseDocuments(
		require('../content/today-verses/Msg.json'),
		{ ...metadata.Msg, fetchedAt: new Date().toISOString() },
	);
	const doc = documents.get('todayVerseDays/1/translations/Msg');
	for (const source of [
		{
			...doc.source,
			verifiedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
		},
		{ ...doc.source, available: false },
		{ ...doc.source, verifiedAt: 'invalid' },
		{
			...doc.source,
			verifiedAt: new Date(Date.now() + 86400000).toISOString(),
		},
	]) {
		documents.set('todayVerseDays/1/translations/Msg', { ...doc, source });
		const result = await read(documents, 'Msg');
		assert.equal(result.top.text, null);
		assert.equal(result.bottom.text, null);
	}
});

test('refresh checks exact wording, edition, source range, and attribution', () => {
	const excerpt = {
		text: 'Exact words.',
		sourceId: 'JHN.1.5',
		sourceReference: 'John 1:5',
	};
	const passage = {
		bibleId: 'edition',
		id: 'JHN.1.5',
		reference: 'John 1:5',
		content: '  Exact\nwords. ',
		copyright: 'Attribution',
	};
	assert.equal(verifyApiExcerpt(passage, 'edition', excerpt), true);
	for (const invalid of [
		{ ...passage, content: 'Changed words.' },
		{ ...passage, bibleId: 'wrong' },
		{ ...passage, id: 'JHN.1.6' },
		{ ...passage, reference: 'John 1:5-7' },
		{ ...passage, copyright: '' },
	])
		assert.equal(verifyApiExcerpt(invalid, 'edition', excerpt), false);
});

test('book matching handles Roman numerals and singular Psalm', () => {
	const { normalizeBookName } = require('../scripts/fetch-today-verses.cjs');
	assert.equal(
		normalizeBookName('II Corinthians'),
		normalizeBookName('2 Corinthians'),
	);
	assert.equal(normalizeBookName('Psalm'), normalizeBookName('Psalms'));
});

test('refresh verifies newly licensed editions and skips inaccessible editions', async () => {
	const {
		refreshTodayVerseSources,
	} = require('../functions/lib/src/journey/refresh-today-verses');
	const documents = new Map();
	const updates = new Map();
	for (const version of ['Nasb2020', 'Nkjv', 'Niv', 'Kjv', 'Amp', 'Gnt']) {
		const docs = buildApiTodayVerseDocuments(
			require(`../content/today-verses/${version}.json`),
			{ ...metadata[version], fetchedAt: new Date().toISOString() },
		);
		const path = `todayVerseDays/1/translations/${version}`;
		documents.set(path, docs.get(path));
	}
	const database = {
		doc: (path) => ({ path }),
		getAll: async (...refs) =>
			refs.map(({ path }) => ({
				exists: documents.has(path),
				data: () => documents.get(path),
				updateTime: 'revision',
				ref: {
					path,
					update: async (values, precondition) => {
						assert.deepEqual(precondition, {
							lastUpdateTime: 'revision',
						});
						updates.set(path, values);
					},
				},
			})),
	};
	let passageRequests = 0;
	const request = async (url) => {
		if (String(url).endsWith('/bibles'))
			return {
				ok: true,
				json: async () => ({
					data: ['Nkjv', 'Niv', 'Kjv', 'Amp', 'Gnt'].map((v) => ({
						id: metadata[v].bibleId,
					})),
				}),
			};
		passageRequests++;
		const parsed = new URL(url);
		const [, , , bibleId, , sourceId] = parsed.pathname.split('/');
		const doc = [...documents.values()].find(
			(d) => d.source.bibleId === bibleId,
		);
		const excerpt = [doc.top, doc.bottom].find(
			(e) => e.sourceId === sourceId,
		);
		return {
			ok: true,
			json: async () => ({
				data: {
					bibleId,
					id: sourceId,
					reference: excerpt.sourceReference,
					content: excerpt.text,
					copyright: 'Fresh attribution',
				},
			}),
		};
	};
	await refreshTodayVerseSources(database, request, 'test-key');
	assert.equal(passageRequests, 10);
	assert.equal(updates.has('todayVerseDays/1/translations/Nasb2020'), false);
	for (const version of ['Nkjv', 'Niv', 'Kjv', 'Amp', 'Gnt']) {
		const updated = updates.get(`todayVerseDays/1/translations/${version}`);
		assert.equal(updated['source.available'], true);
		assert.equal(updated['source.copyright'], 'Fresh attribution');
		assert.ok(Number.isFinite(Date.parse(updated['source.verifiedAt'])));
	}
});

for (const [version, abbreviation] of [
	['Amp', 'AMP'],
	['Gnt', 'GNT'],
]) {
	test(`${abbreviation} is in the shared catalog and reads its own attributed text`, async () => {
		const {
			BibleVersion,
		} = require('../functions/lib/generated/types/formation/bible-version.types');
		const entry = Object.values(BibleVersion).find(
			(entry) => entry.bibleVersionId === version,
		);
		assert.equal(entry.abbreviation, abbreviation);
		const verses = require(`../content/today-verses/${version}.json`);
		const documents = buildApiTodayVerseDocuments(verses, {
			...metadata[version],
			fetchedAt: new Date().toISOString(),
		});
		const result = await read(documents, version);
		assert.equal(result.top.text, verses[0].text);
		assert.equal(result.bottom.text, verses[1].text);
		assert.equal(result.copyright, metadata[version].copyright);
		const notices = require('../src/features/information/scripture-acknowledgments.json');
		assert.equal(
			notices.find((entry) => entry.bibleVersionId === version).copyright,
			metadata[version].copyright,
		);
	});
}

test('GNT keeps the actual combined passage range for Ephesians 2:8', () => {
	const verses = require('../content/today-verses/Gnt.json');
	const documents = buildApiTodayVerseDocuments(verses, {
		...metadata.Gnt,
		fetchedAt: new Date().toISOString(),
	});
	const excerpt = [...documents.values()]
		.flatMap((doc) => [doc.top, doc.bottom])
		.find((entry) => entry?.verse === 'Ephesians 2:8');
	assert.equal(excerpt.sourceId, 'EPH.2.8-EPH.2.9');
	assert.equal(excerpt.sourceReference, 'Ephesians 2:8-9');
});
