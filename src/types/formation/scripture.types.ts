import type { IDocumentTimestamps } from '../shared/persistence.types';
import type { TBibleVersionId } from './bible-version.types';

export interface IScripturePassageReference {
  readonly passageId: string;
  readonly displayReference: string;
}

/** scriptureAssignmentId identifies an immutable reading; corrections get new document IDs. */
export interface IScriptureAssignmentDocument extends IDocumentTimestamps {
  readonly displayReference: string;
  readonly primaryPassage: IScripturePassageReference;
  readonly supportingPassage: IScripturePassageReference | null;
}

/** Labels preserve edition-specific verse ranges or omissions; text is never paraphrased. */
export interface IScriptureTextRun {
  readonly verseLabel: string | null;
  readonly text: string;
}

export interface IScriptureParagraph {
  readonly runs: readonly [IScriptureTextRun, ...IScriptureTextRun[]];
}

export interface ITranslatedScripturePassage {
  readonly passageId: string;
  readonly displayReference: string;
  readonly paragraphs: readonly [IScriptureParagraph, ...IScriptureParagraph[]];
  readonly versificationNote: string | null;
}

/** Bounded by one assigned reading; both passages must match its exact released edition. */
export interface IScriptureAssignmentTextDocument extends IDocumentTimestamps {
  readonly scriptureAssignmentId: string;
  readonly bibleVersionId: TBibleVersionId;
  readonly bibleTextEditionId: string;
  readonly primaryPassage: ITranslatedScripturePassage;
  readonly supportingPassage: ITranslatedScripturePassage | null;
}
