import type {
	IScriptureAssignmentTextDocument,
	ITranslatedScripturePassage,
} from '@td/types/formation/scripture.types';
import source from '../../../content/provisional-course/scripture-web.json';
import { getScriptureChapters, isAssignedVerse } from './scripture-chapters';

const assignmentFor = (
	reference: keyof typeof source.readings,
): IScriptureAssignmentTextDocument => {
	const [first, ...rest] = source.readings[reference];
	if (!first) throw new Error('Missing fixture');
	return {
		scriptureAssignmentId: reference,
		bibleVersionId: 'Web',
		bibleTextEditionId: `web-${source.sourceRevision.slice(7, 23)}`,
		createdAt: { seconds: 0, nanoseconds: 0 },
		updatedAt: { seconds: 0, nanoseconds: 0 },
		primaryPassage: {
			passageId: reference,
			displayReference: reference,
			paragraphs: [{ runs: [first, ...rest] }],
			versificationNote: null,
		},
		supportingPassage: null,
	};
};

it('provides complete matching chapters for every assigned reading without changing its text', () => {
	for (const reference of Object.keys(
		source.readings,
	) as (keyof typeof source.readings)[]) {
		const assignment = assignmentFor(reference);
		const chapters = getScriptureChapters(assignment);
		expect(chapters?.length).toBeGreaterThan(0);
		const highlighted = chapters?.flatMap((chapter) =>
			chapter.paragraphs.flatMap((paragraph) =>
				paragraph.runs.filter((run) =>
					isAssignedVerse(chapter, run, [assignment.primaryPassage]),
				),
			),
		);
		expect(highlighted).toEqual(source.readings[reference]);
	}
});
it('expands both chapters of a cross-chapter assignment', () => {
	const chapters = getScriptureChapters(assignmentFor('Galatians 3:23–4:7'));
	expect(chapters?.map((chapter) => chapter.displayReference)).toEqual([
		'Galatians 3',
		'Galatians 4',
	]);
	expect(
		chapters?.map((chapter) => chapter.paragraphs[0].runs.length),
	).toEqual([29, 31]);
});
it('does not substitute another translation, revision, or altered verse', () => {
	const assignment = assignmentFor('John 15:1–11');
	expect(
		getScriptureChapters({ ...assignment, bibleVersionId: 'Niv' }),
	).toBeNull();
	expect(
		getScriptureChapters({
			...assignment,
			bibleTextEditionId: 'another-edition',
		}),
	).toBeNull();
	const changed: ITranslatedScripturePassage = {
		...assignment.primaryPassage,
		paragraphs: [
			{ runs: [{ verseLabel: '15:1', text: 'Different wording' }] },
		],
	};
	expect(
		getScriptureChapters({ ...assignment, primaryPassage: changed }),
	).toBeNull();
});
it('does not highlight the same verse number in a different book', () => {
	const assignment = assignmentFor('John 15:1–11');
	const run = assignment.primaryPassage.paragraphs[0].runs[0];
	expect(
		isAssignedVerse(
			{ ...assignment.primaryPassage, displayReference: 'Luke 15' },
			run,
			[assignment.primaryPassage],
		),
	).toBe(false);
});
