#!/usr/bin/env node
// Node.js 18+. No packages required. API key is never written to the output.
const fs = require('node:fs');
const readline = require('node:readline/promises');

const editions = {
	AMP: 'a81b73293d3080c9-01',
	GNT: '61fd76eafa1577c2-01',
};
const references = [
	{
		verse: '1 Thessalonians 5:16',
		id: '1TH.5.16',
	},
	{
		verse: 'Psalms 46:10',
		id: 'PSA.46.10',
	},
	{
		verse: '1 Corinthians 10:13',
		id: '1CO.10.13',
	},
	{
		verse: 'Philippians 4:7',
		id: 'PHP.4.7',
	},
	{
		verse: 'James 1:17',
		id: 'JAS.1.17',
	},
	{
		verse: 'Zechariah 4:6',
		id: 'ZEC.4.6',
	},
	{
		verse: 'Genesis 1:31',
		id: 'GEN.1.31',
	},
	{
		verse: '2 Corinthians 5:17',
		id: '2CO.5.17',
	},
	{
		verse: 'Romans 15:13',
		id: 'ROM.15.13',
	},
	{
		verse: 'Romans 8:28',
		id: 'ROM.8.28',
	},
	{
		verse: 'Philippians 4:8',
		id: 'PHP.4.8',
	},
	{
		verse: 'Mark 10:27',
		id: 'MRK.10.27',
	},
	{
		verse: 'Hebrews 13:5',
		id: 'HEB.13.5',
	},
	{
		verse: 'Colossians 3:15',
		id: 'COL.3.15',
	},
	{
		verse: 'Genesis 50:20',
		id: 'GEN.50.20',
	},
	{
		verse: 'Hebrews 10:23',
		id: 'HEB.10.23',
	},
	{
		verse: 'Psalms 34:18',
		id: 'PSA.34.18',
	},
	{
		verse: 'Psalms 73:26',
		id: 'PSA.73.26',
	},
	{
		verse: 'Genesis 28:15',
		id: 'GEN.28.15',
	},
	{
		verse: 'Deuteronomy 31:6',
		id: 'DEU.31.6',
	},
	{
		verse: 'Isaiah 41:13',
		id: 'ISA.41.13',
	},
	{
		verse: '1 Kings 8:57',
		id: '1KI.8.57',
	},
	{
		verse: 'Psalms 90:14',
		id: 'PSA.90.14',
	},
	{
		verse: '1 Thessalonians 5:17',
		id: '1TH.5.17',
	},
	{
		verse: 'Isaiah 40:29',
		id: 'ISA.40.29',
	},
	{
		verse: 'Isaiah 40:31',
		id: 'ISA.40.31',
	},
	{
		verse: 'Philippians 4:13',
		id: 'PHP.4.13',
	},
	{
		verse: '2 Samuel 22:31',
		id: '2SA.22.31',
	},
	{
		verse: 'John 15:11',
		id: 'JHN.15.11',
	},
	{
		verse: 'Zephaniah 3:17',
		id: 'ZEP.3.17',
	},
	{
		verse: '1 John 4:16',
		id: '1JN.4.16',
	},
	{
		verse: 'Romans 12:21',
		id: 'ROM.12.21',
	},
	{
		verse: 'Proverbs 3:6',
		id: 'PRO.3.6',
	},
	{
		verse: 'John 10:10',
		id: 'JHN.10.10',
	},
	{
		verse: 'Psalms 31:24',
		id: 'PSA.31.24',
	},
	{
		verse: 'Proverbs 4:23',
		id: 'PRO.4.23',
	},
	{
		verse: 'Deuteronomy 31:8',
		id: 'DEU.31.8',
	},
	{
		verse: 'Romans 8:18',
		id: 'ROM.8.18',
	},
	{
		verse: 'John 3:16',
		id: 'JHN.3.16',
	},
	{
		verse: 'Psalms 27:1',
		id: 'PSA.27.1',
	},
	{
		verse: 'Psalms 91:1',
		id: 'PSA.91.1',
	},
	{
		verse: 'Hebrews 4:16',
		id: 'HEB.4.16',
	},
	{
		verse: 'Luke 12:32',
		id: 'LUK.12.32',
	},
	{
		verse: 'Psalms 34:4',
		id: 'PSA.34.4',
	},
	{
		verse: '2 Corinthians 5:7',
		id: '2CO.5.7',
	},
	{
		verse: 'Lamentations 3:23',
		id: 'LAM.3.23',
	},
	{
		verse: '1 Corinthians 16:14',
		id: '1CO.16.14',
	},
	{
		verse: 'Acts of the Apostles 20:35',
		id: 'ACT.20.35',
	},
	{
		verse: 'James 1:5',
		id: 'JAS.1.5',
	},
	{
		verse: 'Romans 8:37',
		id: 'ROM.8.37',
	},
	{
		verse: 'Psalms 139:14',
		id: 'PSA.139.14',
	},
	{
		verse: '1 Corinthians 15:57',
		id: '1CO.15.57',
	},
	{
		verse: 'Ephesians 2:10',
		id: 'EPH.2.10',
	},
	{
		verse: 'Mark 9:23',
		id: 'MRK.9.23',
	},
	{
		verse: 'Psalms 147:3',
		id: 'PSA.147.3',
	},
	{
		verse: 'Matthew 11:28',
		id: 'MAT.11.28',
	},
	{
		verse: 'Psalms 55:22',
		id: 'PSA.55.22',
	},
	{
		verse: 'Matthew 6:26',
		id: 'MAT.6.26',
	},
	{
		verse: 'Philippians 4:19',
		id: 'PHP.4.19',
	},
	{
		verse: 'Hebrews 11:1',
		id: 'HEB.11.1',
	},
	{
		verse: 'Acts of the Apostles 1:8',
		id: 'ACT.1.8',
	},
	{
		verse: 'John 1:5',
		id: 'JHN.1.5',
	},
	{
		verse: 'Psalms 46:1',
		id: 'PSA.46.1',
	},
	{
		verse: 'Psalms 30:5',
		id: 'PSA.30.5',
	},
	{
		verse: 'Romans 5:5',
		id: 'ROM.5.5',
	},
	{
		verse: 'Psalms 62:5',
		id: 'PSA.62.5',
	},
	{
		verse: '1 Corinthians 13:13',
		id: '1CO.13.13',
	},
	{
		verse: 'Exodus 15:2',
		id: 'EXO.15.2',
	},
	{
		verse: 'Psalms 32:7',
		id: 'PSA.32.7',
	},
	{
		verse: '1 John 1:9',
		id: '1JN.1.9',
	},
	{
		verse: 'Romans 12:12',
		id: 'ROM.12.12',
	},
	{
		verse: 'Psalms 118:6',
		id: 'PSA.118.6',
	},
	{
		verse: '1 Peter 5:10',
		id: '1PE.5.10',
	},
	{
		verse: 'Psalms 23:4',
		id: 'PSA.23.4',
	},
	{
		verse: 'Proverbs 17:22',
		id: 'PRO.17.22',
	},
	{
		verse: 'Habakkuk 3:18',
		id: 'HAB.3.18',
	},
	{
		verse: 'Matthew 7:7',
		id: 'MAT.7.7',
	},
	{
		verse: 'Job 42:2',
		id: 'JOB.42.2',
	},
	{
		verse: 'Matthew 19:26',
		id: 'MAT.19.26',
	},
	{
		verse: 'Numbers 6:24',
		id: 'NUM.6.24',
	},
	{
		verse: 'Psalms 37:5',
		id: 'PSA.37.5',
	},
	{
		verse: 'Galatians 6:9',
		id: 'GAL.6.9',
	},
	{
		verse: 'Psalms 23:1',
		id: 'PSA.23.1',
	},
	{
		verse: 'Colossians 3:17',
		id: 'COL.3.17',
	},
	{
		verse: 'Jude 1:24',
		id: 'JUD.1.24',
	},
	{
		verse: 'Psalms 84:11',
		id: 'PSA.84.11',
	},
	{
		verse: '2 Corinthians 12:9',
		id: '2CO.12.9',
	},
	{
		verse: 'Ephesians 4:32',
		id: 'EPH.4.32',
	},
	{
		verse: '1 Samuel 16:7',
		id: '1SA.16.7',
	},
	{
		verse: 'Psalms 118:24',
		id: 'PSA.118.24',
	},
	{
		verse: 'Jeremiah 29:11',
		id: 'JER.29.11',
	},
	{
		verse: 'Philippians 4:4',
		id: 'PHP.4.4',
	},
	{
		verse: 'Galatians 5:1',
		id: 'GAL.5.1',
	},
	{
		verse: 'Isaiah 41:10',
		id: 'ISA.41.10',
	},
	{
		verse: 'Philippians 1:6',
		id: 'PHP.1.6',
	},
	{
		verse: 'Psalms 37:4',
		id: 'PSA.37.4',
	},
	{
		verse: 'Proverbs 16:3',
		id: 'PRO.16.3',
	},
	{
		verse: 'Hebrews 13:8',
		id: 'HEB.13.8',
	},
	{
		verse: '1 Peter 5:7',
		id: '1PE.5.7',
	},
	{
		verse: 'Matthew 5:16',
		id: 'MAT.5.16',
	},
	{
		verse: 'Lamentations 3:22',
		id: 'LAM.3.22',
	},
	{
		verse: 'John 16:33',
		id: 'JHN.16.33',
	},
	{
		verse: 'Ephesians 2:8',
		id: 'EPH.2.8',
	},
	{
		verse: '2 Corinthians 4:16',
		id: '2CO.4.16',
	},
	{
		verse: 'Jeremiah 17:7',
		id: 'JER.17.7',
	},
	{
		verse: 'Romans 8:1',
		id: 'ROM.8.1',
	},
	{
		verse: 'Psalms 100:5',
		id: 'PSA.100.5',
	},
	{
		verse: 'Psalms 121:2',
		id: 'PSA.121.2',
	},
	{
		verse: 'Psalms 34:8',
		id: 'PSA.34.8',
	},
	{
		verse: 'John 14:27',
		id: 'JHN.14.27',
	},
	{
		verse: '1 Thessalonians 5:11',
		id: '1TH.5.11',
	},
	{
		verse: '1 Chronicles 28:20',
		id: '1CH.28.20',
	},
	{
		verse: 'Nehemiah 8:10',
		id: 'NEH.8.10',
	},
	{
		verse: 'Numbers 6:25',
		id: 'NUM.6.25',
	},
	{
		verse: 'Proverbs 3:5',
		id: 'PRO.3.5',
	},
	{
		verse: '1 Chronicles 16:11',
		id: '1CH.16.11',
	},
	{
		verse: 'Romans 8:31',
		id: 'ROM.8.31',
	},
	{
		verse: 'Joshua 1:9',
		id: 'JOS.1.9',
	},
	{
		verse: 'Isaiah 58:11',
		id: 'ISA.58.11',
	},
	{
		verse: '2 Timothy 1:7',
		id: '2TI.1.7',
	},
	{
		verse: 'Ephesians 3:20',
		id: 'EPH.3.20',
	},
	{
		verse: '1 Thessalonians 5:18',
		id: '1TH.5.18',
	},
	{
		verse: 'Proverbs 18:10',
		id: 'PRO.18.10',
	},
	{
		verse: 'Matthew 6:33',
		id: 'MAT.6.33',
	},
	{
		verse: 'Ephesians 6:10',
		id: 'EPH.6.10',
	},
	{
		verse: 'Philippians 4:6',
		id: 'PHP.4.6',
	},
	{
		verse: 'Deuteronomy 7:9',
		id: 'DEU.7.9',
	},
	{
		verse: 'Isaiah 54:10',
		id: 'ISA.54.10',
	},
	{
		verse: 'Joshua 1:5',
		id: 'JOS.1.5',
	},
	{
		verse: 'Jeremiah 31:3',
		id: 'JER.31.3',
	},
	{
		verse: 'Ezekiel 36:26',
		id: 'EZK.36.26',
	},
	{
		verse: 'John 15:5',
		id: 'JHN.15.5',
	},
	{
		verse: 'John 11:25',
		id: 'JHN.11.25',
	},
	{
		verse: 'Exodus 33:14',
		id: 'EXO.33.14',
	},
	{
		verse: '1 John 4:4',
		id: '1JN.4.4',
	},
	{
		verse: 'Matthew 28:20',
		id: 'MAT.28.20',
	},
	{
		verse: '2 Chronicles 15:7',
		id: '2CH.15.7',
	},
	{
		verse: 'John 14:1',
		id: 'JHN.14.1',
	},
	{
		verse: 'Micah 6:8',
		id: 'MIC.6.8',
	},
	{
		verse: 'Isaiah 26:3',
		id: 'ISA.26.3',
	},
	{
		verse: 'Exodus 14:14',
		id: 'EXO.14.14',
	},
	{
		verse: 'Isaiah 43:2',
		id: 'ISA.43.2',
	},
	{
		verse: 'Luke 6:31',
		id: 'LUK.6.31',
	},
	{
		verse: '2 Thessalonians 3:3',
		id: '2TH.3.3',
	},
	{
		verse: 'Psalms 42:11',
		id: 'PSA.42.11',
	},
	{
		verse: 'Psalms 28:7',
		id: 'PSA.28.7',
	},
	{
		verse: 'John 8:12',
		id: 'JHN.8.12',
	},
	{
		verse: 'Psalms 56:3',
		id: 'PSA.56.3',
	},
	{
		verse: 'Job 19:25',
		id: 'JOB.19.25',
	},
	{
		verse: 'Revelation 21:4',
		id: 'REV.21.4',
	},
	{
		verse: 'Numbers 6:26',
		id: 'NUM.6.26',
	},
	{
		verse: '1 Chronicles 16:34',
		id: '1CH.16.34',
	},
	{
		verse: 'Psalms 94:19',
		id: 'PSA.94.19',
	},
	{
		verse: 'Luke 1:37',
		id: 'LUK.1.37',
	},
];

async function main() {
	let apiKey = process.env.API_BIBLE_KEY?.trim();
	if (!apiKey) {
		const prompt = readline.createInterface({
			input: process.stdin,
			output: process.stderr,
		});
		try {
			apiKey = (await prompt.question('API.Bible key: ')).trim();
		} finally {
			prompt.close();
		}
	}
	if (!apiKey) throw new Error('An API.Bible key is required.');

	const filename = process.argv[2] || 'amp-gnt-responses.json';
	// Avoid overwriting a previous successful export.
	const output = fs.openSync(filename, 'wx');
	const result = { fetchedAt: new Date().toISOString(), editions: {} };
	const request = async (resource, verse = false) => {
		const url = new URL('https://rest.api.bible/v1/' + resource);
		if (verse)
			url.search = new URLSearchParams({
				'content-type': 'text',
				'include-notes': 'false',
				'include-titles': 'false',
				'include-chapter-numbers': 'false',
				'include-verse-numbers': 'false',
			}).toString();
		try {
			const response = await fetch(url, {
				headers: { 'api-key': apiKey },
				signal: AbortSignal.timeout(30000),
			});
			const body = await response.text();
			let parsed;
			try {
				parsed = JSON.parse(body);
			} catch {
				parsed = { rawBody: body };
			}
			return { status: response.status, ok: response.ok, body: parsed };
		} catch (error) {
			return {
				status: null,
				ok: false,
				error: error.name + ': request failed',
			};
		}
	};

	try {
		for (const [version, bibleId] of Object.entries(editions)) {
			console.error('Checking ' + version + ' (' + bibleId + ')...');
			const edition = await request('bibles/' + bibleId);
			const entry = { bibleId, edition, verses: [] };
			result.editions[version] = entry;
			// Test a verse even if the edition metadata request fails.
			for (const reference of references) {
				const response = await request(
					'bibles/' + bibleId + '/verses/' + reference.id,
					true,
				);
				entry.verses.push({
					reference: reference.verse,
					requestedId: reference.id,
					...response,
				});
				if ([401, 403, 429].includes(response.status)) {
					console.error(
						version +
							': HTTP ' +
							response.status +
							'; response saved. Stopping this edition.',
					);
					break;
				}
				if (entry.verses.length % 25 === 0)
					console.error(
						version + ': ' + entry.verses.length + '/154',
					);
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
			const successes = entry.verses.filter(
				(verse) => verse.ok && verse.body?.data?.content,
			).length;
			console.error(
				version + ': ' + successes + '/154 verses retrieved.',
			);
			if (successes !== references.length) process.exitCode = 1;
		}
	} finally {
		// Redact the key defensively if a server ever echoes it in an error.
		const json = JSON.stringify(result, null, 2)
			.split(apiKey)
			.join('[REDACTED]');
		fs.writeFileSync(output, json + '\n');
		fs.closeSync(output);
		console.error('Saved responses to ' + filename);
	}
}

main().catch((error) => {
	console.error(
		error.code === 'EEXIST'
			? 'Output file already exists. Choose another filename: node export-api-bible-verses.cjs another-output.json'
			: error.message,
	);
	process.exitCode = 1;
});
