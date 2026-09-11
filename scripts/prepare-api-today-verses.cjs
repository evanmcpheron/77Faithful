const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { buildTodayVerseDocuments } = require('./seed-today-verses.cjs');

const buildApiTodayVerseDocuments = (verses, metadata) => {
	const documents = buildTodayVerseDocuments(verses, metadata.bibleVersionId);
	if (
		!/^[a-f0-9]{16}-\d{2}$/.test(metadata.bibleId) ||
		!Number.isFinite(Date.parse(metadata.fetchedAt)) ||
		Date.now() - Date.parse(metadata.fetchedAt) >= 30 * 86400000 ||
		!metadata.copyright
	)
		throw new Error('Missing or expired API.Bible source metadata.');
	const passages = new Map(
		metadata.passages.map((passage) => [passage.verse, passage]),
	);
	for (const [documentPath, document] of documents) {
		if (!documentPath.includes('/translations/')) continue;
		for (const slot of ['top', 'bottom']) {
			const passage = passages.get(document[slot].verse);
			if (!passage?.sourceId || !passage.sourceReference)
				throw new Error('Missing passage provenance.');
			document[slot] = {
				...document[slot],
				sourceId: passage.sourceId,
				sourceReference: passage.sourceReference,
			};
		}
		document.source = {
			provider: 'API.Bible',
			bibleId: metadata.bibleId,
			verifiedAt: metadata.fetchedAt,
			copyright: metadata.copyright,
			available: true,
		};
	}
	return documents;
};

if (require.main === module) {
	const [sourceDirectory, excerptDirectory, outputDirectory] =
		process.argv.slice(2);
	if (!sourceDirectory || !excerptDirectory || !outputDirectory)
		throw new Error(
			'Usage: node scripts/prepare-api-today-verses.cjs SOURCE_DIRECTORY EXCERPT_DIRECTORY OUTPUT_DIRECTORY',
		);
	const metadataPath = path.join(outputDirectory, 'api-sources.json');
	const metadata = existsSync(metadataPath)
		? JSON.parse(readFileSync(metadataPath, 'utf8'))
		: {};
	const versions = (process.argv[5] || 'Nasb2020,Csb,Msg,Amp,Gnt').split(',');
	for (const version of versions) {
		const source = JSON.parse(
			readFileSync(
				path.join(sourceDirectory, `${version}.source.json`),
				'utf8',
			),
		);
		const excerpts = readFileSync(
			path.join(excerptDirectory, `77faithful-${version}-excerpts`),
			'utf8',
		)
			.trim()
			.split('\n');
		if (excerpts.length !== 154 || source.entries.length !== 154)
			throw new Error('Expected 154 excerpts and source passages.');
		const verses = excerpts.map((text, index) => {
			const entry = source.entries[index];
			if (!text.trim() || !entry.text.includes(text))
				throw new Error(
					`Excerpt is not exact source text: ${version} ${entry.verse}.`,
				);
			return { verse: entry.verse, text };
		});
		metadata[version] = {
			bibleVersionId: version,
			bibleId: source.bibleId,
			fetchedAt: source.fetchedAt,
			copyright: [
				...new Set(source.entries.map(({ copyright }) => copyright)),
			].join('\n'),
			passages: source.entries.map(
				({ verse, sourceId, sourceReference }) => ({
					verse,
					sourceId,
					sourceReference,
				}),
			),
		};
		buildApiTodayVerseDocuments(verses, metadata[version]);
		writeFileSync(
			path.join(outputDirectory, `${version}.json`),
			`${JSON.stringify(verses, null, 2)}\n`,
		);
		console.log(`${version}: 154 exact excerpts verified against source`);
	}
	writeFileSync(
		path.join(outputDirectory, 'api-sources.json'),
		`${JSON.stringify(metadata, null, 2)}\n`,
	);
}
module.exports = { buildApiTodayVerseDocuments };
