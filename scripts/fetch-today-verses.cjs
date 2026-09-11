const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const source = require('../content/today-verses/Nlt.json');

const editions = {
	Amp: { id: 'a81b73293d3080c9-01', name: 'Amplified Bible' },
	Gnt: {
		id: '61fd76eafa1577c2-01',
		name: 'Good News Translation (US Version)',
	},
	Nasb2020: {
		id: 'a761ca71e0b3ddcf-01',
		name: 'New American Standard Bible 2020',
	},
	Csb: { id: 'a556c5305ee15c3f-01', name: 'Christian Standard Bible' },
	Msg: { id: '6f11a7de016f942e-01', name: 'The Message' },
	Nkjv: { id: '63097d2a0a2f7db3-01', name: 'New King James Version' },
	Niv: { id: '78a9f6124f344018-01', name: 'New International Version 2011' },
	Kjv: {
		id: 'a6aee10bb058511c-02',
		name: 'King James Version, American Edition',
	},
};

const normalizeBookName = (name) =>
	name
		.trim()
		.replace(
			/^(III|II|I) /,
			(_, number) => `${{ I: 1, II: 2, III: 3 }[number]} `,
		)
		.toLowerCase()
		.replace(/^revelations$/, 'revelation')
		.replace(/^psalm$/, 'psalms');

const fetchTodayVerseSources = async (outputDirectory, selectedVersion) => {
	const apiKey = process.env.API_BIBLE_KEY;
	if (!apiKey) throw new Error('Set API_BIBLE_KEY in the environment.');
	const request = async (resource, parameters = {}) => {
		const url = new URL(`https://rest.api.bible/v1/${resource}`);
		url.search = new URLSearchParams(parameters).toString();
		const response = await fetch(url, {
			headers: { 'api-key': apiKey },
			signal: AbortSignal.timeout(30000),
		});
		if (!response.ok)
			throw new Error(
				`API.Bible returned HTTP ${response.status} for ${resource}.`,
			);
		const body = await response.json();
		if (!body.data)
			throw new Error(`API.Bible returned no data for ${resource}.`);
		return body.data;
	};
	const selected = selectedVersion
		? selectedVersion.split(',')
		: Object.keys(editions);
	if (selected.some((version) => !editions[version]))
		throw new Error('Unknown edition requested.');
	const available = await request('bibles');
	for (const version of selected) {
		const edition = editions[version];
		if (
			!available.some(
				({ id, name }) => id === edition.id && name === edition.name,
			)
		)
			throw new Error(
				`The exact edition is unavailable: ${edition.name}.`,
			);
	}
	mkdirSync(outputDirectory, { recursive: true });
	const results = await Promise.allSettled(
		Object.entries(editions)
			.filter(([version]) => selected.includes(version))
			.map(async ([version, edition]) => {
				const books = await request(`bibles/${edition.id}/books`);
				const entries = [];
				for (const { verse } of source) {
					const match = /^(.*) (\d+):(\d+)$/.exec(verse);
					if (!match) throw new Error(`Invalid reference: ${verse}.`);
					const bookName =
						match[1] === 'Acts of the Apostles' ? 'Acts' : match[1];
					const book = books.find(
						({ name, nameLong }) =>
							normalizeBookName(name) ===
								normalizeBookName(bookName) ||
							normalizeBookName(nameLong) ===
								normalizeBookName(bookName),
					);
					if (!book)
						throw new Error(
							`No ${version} book found for ${verse}.`,
						);
					const requestedId = `${book.id}.${match[2]}.${match[3]}`;
					let sourceId = requestedId;
					if (version === 'Msg') {
						const verses = await request(
							`bibles/${edition.id}/chapters/${book.id}.${match[2]}/verses`,
						);
						const candidate = verses.find(({ id }) => {
							const bounds = id
								.split('-')
								.map((part) =>
									/^(\w+)\.(\d+)\.(\d+)[a-z]?$/.exec(part),
								);
							return (
								bounds.every(Boolean) &&
								bounds[0][1] === book.id &&
								bounds[0][2] === match[2] &&
								bounds.at(-1)[2] === match[2] &&
								Number(bounds[0][3]) <= Number(match[3]) &&
								Number(bounds.at(-1)[3]) >= Number(match[3])
							);
						});
						if (!candidate)
							throw new Error(`No MSG passage covers ${verse}.`);
						sourceId = candidate.id;
					}
					const passage = await request(
						`bibles/${edition.id}/verses/${sourceId}`,
						{
							'content-type': 'text',
							'include-notes': 'false',
							'include-titles': 'false',
							'include-chapter-numbers': 'false',
							'include-verse-numbers': 'false',
						},
					);
					if (
						passage.bibleId !== edition.id ||
						passage.bookId !== book.id ||
						typeof passage.content !== 'string' ||
						!passage.content.trim() ||
						typeof passage.reference !== 'string' ||
						typeof passage.copyright !== 'string'
					)
						throw new Error(
							`Invalid ${version} response for ${verse}.`,
						);
					entries.push({
						verse,
						requestedId,
						sourceId: passage.id,
						sourceReference: passage.reference,
						text: passage.content.replace(/\s+/gu, ' ').trim(),
						copyright: passage.copyright,
					});
					if (entries.length % 25 === 0)
						console.log(
							`${version}: ${entries.length}/154 retrieved`,
						);
					await new Promise((resolve) => setTimeout(resolve, 350));
				}
				const output = {
					provider: 'API.Bible',
					bibleVersionId: version,
					bibleId: edition.id,
					editionName: edition.name,
					fetchedAt: new Date().toISOString(),
					entries,
				};
				writeFileSync(
					path.join(outputDirectory, `${version}.source.json`),
					`${JSON.stringify(output, null, 2)}\n`,
				);
				console.log(
					`${version}: saved all ${entries.length} source passages`,
				);
			}),
	);
	const failed = results.filter((result) => result.status === 'rejected');
	if (failed.length)
		throw new Error(failed.map(({ reason }) => reason.message).join('; '));
};

if (require.main === module) {
	const directory = process.argv[2];
	if (!directory)
		throw new Error(
			'Usage: API_BIBLE_KEY=... node scripts/fetch-today-verses.cjs OUTPUT_DIRECTORY',
		);
	fetchTodayVerseSources(directory, process.argv[3]).catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
module.exports = { fetchTodayVerseSources, normalizeBookName };
