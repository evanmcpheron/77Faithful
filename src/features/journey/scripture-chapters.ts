import type {
	IScriptureAssignmentTextDocument,
	IScriptureTextRun,
	ITranslatedScripturePassage,
} from '@td/types/formation/scripture.types';
import chapterSource from '../../../content/provisional-course/chapters-web.json';

const chapters: Readonly<Record<string, readonly IScriptureTextRun[]>> =
	chapterSource.chapters;

export const getScriptureChapters = (
	assignment: IScriptureAssignmentTextDocument,
): ITranslatedScripturePassage[] | null => {
	const editionId = `web-${chapterSource.sourceRevision.slice(7, 23)}`;
	if (
		assignment.bibleVersionId !== 'Web' ||
		assignment.bibleTextEditionId !== editionId
	)
		return null;
	const result = new Map<string, ITranslatedScripturePassage>();
	for (const passage of [
		assignment.primaryPassage,
		assignment.supportingPassage,
	]) {
		if (!passage) continue;
		const book = passage.displayReference.match(/^(.+?) \d/)?.[1];
		if (!book) return null;
		for (const paragraph of passage.paragraphs) {
			for (const run of paragraph.runs) {
				const chapter = run.verseLabel?.match(/^(\d+):\d+$/)?.[1];
				if (!chapter) return null;
				const reference = `${book} ${chapter}`;
				const verses = chapters[reference];
				const first = verses?.[0];
				if (
					!verses ||
					!first ||
					!verses.some(
						(verse) =>
							verse.verseLabel === run.verseLabel &&
							verse.text === run.text,
					)
				)
					return null;
				result.set(reference, {
					passageId: reference,
					displayReference: reference,
					paragraphs: [{ runs: [first, ...verses.slice(1)] }],
					versificationNote: passage.versificationNote,
				});
			}
		}
	}
	return result.size ? [...result.values()] : null;
};

export const isAssignedVerse = (
	passage: ITranslatedScripturePassage,
	run: IScriptureTextRun,
	assigned: readonly ITranslatedScripturePassage[],
) =>
	assigned.some(
		(item) =>
			item.displayReference.match(/^(.+?) \d/)?.[1] ===
				passage.displayReference.match(/^(.+?) \d/)?.[1] &&
			item.paragraphs.some((paragraph) =>
				paragraph.runs.some(
					(verse) =>
						verse.verseLabel === run.verseLabel &&
						verse.text === run.text,
				),
			),
	);
