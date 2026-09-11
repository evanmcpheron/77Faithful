const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const source = require('../content/provisional-course/scripture-web.json');

// Pass the extracted engwebp_vpl.txt from source.sourceUrl.
const input = readFileSync(process.argv[2]);
if (
	`sha256:${createHash('sha256').update(input).digest('hex')}` !==
	source.sourceRevision
)
	throw new Error(
		'The chapter source must match the assigned Scripture edition.',
	);
const books = {
	Matthew: 'MAT',
	Mark: 'MAR',
	Luke: 'LUK',
	John: 'JOH',
	Acts: 'ACT',
	Romans: 'ROM',
	'1 Corinthians': '1CO',
	'2 Corinthians': '2CO',
	Galatians: 'GAL',
	Ephesians: 'EPH',
	Philippians: 'PHI',
	Colossians: 'COL',
	'1 Timothy': '1TI',
	'2 Timothy': '2TI',
	Hebrews: 'HEB',
	James: 'JAM',
	'1 Peter': '1PE',
	'1 John': '1JO',
	Jude: 'JUD',
	Psalm: 'PSA',
	Nehemiah: 'NEH',
	Ezekiel: 'EZE',
};
const lines = input.toString('utf8').split('\n');
const chapters = {};
for (const [reference, assigned] of Object.entries(source.readings)) {
	const book = reference.match(/^(.+?) \d/)?.[1];
	if (!books[book]) throw new Error(`Unknown book: ${reference}`);
	for (const run of assigned) {
		const chapter = run.verseLabel.split(':')[0];
		const key = `${book} ${chapter}`;
		if (!chapters[key]) {
			const prefix = `${books[book]} ${chapter}:`;
			chapters[key] = lines
				.filter((line) => line.startsWith(prefix))
				.map((line) => {
					const [, verseLabel, text] =
						line.match(/^\S+ (\d+:\d+) (.*)$/);
					return { verseLabel, text };
				});
		}
		if (
			!chapters[key].some(
				(verse) =>
					verse.verseLabel === run.verseLabel &&
					verse.text === run.text,
			)
		)
			throw new Error(
				`Assigned text does not match ${key}:${run.verseLabel}`,
			);
	}
}
writeFileSync(
	path.join(__dirname, '../content/provisional-course/chapters-web.json'),
	JSON.stringify(
		{
			sourceRevision: source.sourceRevision,
			chapters,
		},
		null,
		'\t',
	) + '\n',
);
