const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { isDeepStrictEqual } = require('node:util');
const source = require('../content/today-verses/Nlt.json');
const versionIds = [
	'Nasb2020',
	'Niv',
	'Nlt',
	'Msg',
	'Kjv',
	'Nkjv',
	'Csb',
	'Web',
	'Amp',
	'Gnt',
];

const buildTodayVerseDocuments = (verses = source, bibleVersionId = 'Nlt') => {
	if (
		!versionIds.includes(bibleVersionId) ||
		!Array.isArray(verses) ||
		verses.length !== 154
	)
		throw new Error(
			'Provide a supported Bible version and exactly 154 verses.',
		);
	const byReference = new Map();
	for (const entry of verses) {
		if (
			!entry ||
			typeof entry.verse !== 'string' ||
			typeof entry.text !== 'string' ||
			!entry.text.trim() ||
			byReference.has(entry.verse)
		)
			throw new Error(
				'Every verse needs a unique reference and nonempty text.',
			);
		byReference.set(entry.verse, { verse: entry.verse, text: entry.text });
	}
	const documents = new Map();
	for (let dayNumber = 1; dayNumber <= 77; dayNumber++) {
		const top = source[(dayNumber - 1) * 2].verse;
		const bottom = source[(dayNumber - 1) * 2 + 1].verse;
		if (!byReference.has(top) || !byReference.has(bottom))
			throw new Error(
				`Translation is missing an assigned reference for day ${dayNumber}.`,
			);
		const path = `todayVerseDays/${dayNumber}`;
		documents.set(path, { schemaVersion: 1, dayNumber, top, bottom });
		documents.set(`${path}/translations/${bibleVersionId}`, {
			schemaVersion: 1,
			bibleVersionId,
			top: byReference.get(top),
			bottom: byReference.get(bottom),
		});
	}
	return documents;
};

const seedTodayVerses = async (database, documents) =>
	database.runTransaction(async (transaction) => {
		const entries = [...documents];
		const snapshots = await transaction.getAll(
			...entries.map(([path]) => database.doc(path)),
		);
		for (let index = 0; index < entries.length; index++) {
			if (
				snapshots[index].exists &&
				!isDeepStrictEqual(snapshots[index].data(), entries[index][1])
			)
				throw new Error(
					`Existing content differs at ${entries[index][0]}; no documents were written.`,
				);
		}
		let created = 0;
		for (let index = 0; index < entries.length; index++) {
			if (!snapshots[index].exists) {
				transaction.create(
					database.doc(entries[index][0]),
					entries[index][1],
				);
				created++;
			}
		}
		return { created, unchanged: entries.length - created };
	});

const run = async () => {
	const [projectId, bibleVersionId = 'Nlt', inputFile] = process.argv
		.slice(2)
		.filter((arg) => arg !== '--write');
	if (!projectId || projectId.startsWith('-'))
		throw new Error(
			'Usage: node scripts/seed-today-verses.cjs PROJECT_ID [VERSION_ID] [JSON_FILE] [--write]',
		);
	if (bibleVersionId !== 'Nlt' && !inputFile)
		throw new Error('Supply the translated JSON file.');
	let documents = buildTodayVerseDocuments(
		inputFile ? JSON.parse(readFileSync(inputFile, 'utf8')) : source,
		bibleVersionId,
	);
	const metadata = require('../content/today-verses/api-sources.json')[
		bibleVersionId
	];
	if (metadata) {
		const {
			buildApiTodayVerseDocuments,
		} = require('./prepare-api-today-verses.cjs');
		documents = buildApiTodayVerseDocuments(
			JSON.parse(readFileSync(inputFile, 'utf8')),
			metadata,
		);
	}
	console.log({
		projectId,
		bibleVersionId,
		days: 77,
		documents: documents.size,
		write: process.argv.includes('--write'),
	});
	if (!process.argv.includes('--write')) return;
	const functionsRequire = createRequire(
		require.resolve('../functions/package.json'),
	);
	const { initializeApp, applicationDefault } =
		functionsRequire('firebase-admin/app');
	const { getFirestore } = functionsRequire('firebase-admin/firestore');
	initializeApp({ projectId, credential: applicationDefault() });
	console.log(await seedTodayVerses(getFirestore(), documents));
};
module.exports = { buildTodayVerseDocuments, seedTodayVerses };
if (require.main === module)
	run().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
