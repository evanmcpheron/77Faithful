export type WeeklyTheme = {
  id: string;
  name: string;
};

export type ReadingDay = {
  dayNumber: number;
  themeId: string;
  passageId: string;
};

export type ReadingPlan = {
  version: string;
  publication: { status: 'draft' } | { status: 'published'; approval: string };
  days: readonly ReadingDay[];
};

export type BibleBook = {
  id: string;
  name: string;
  chapterVerseCounts: readonly number[];
  source: string;
};

export type VerseRange = {
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export type ScripturePassage = {
  id: string;
  bookId: string;
  reference: string;
  ranges: readonly VerseRange[];
};

export type BibleTranslation = {
  id: string;
  abbreviation: string;
  displayName: string;
  enabled: boolean;
  license:
    | { status: 'pending'; notes: string }
    | { status: 'cleared'; evidence: string; attribution: string | null };
  content: { storage: 'unavailable' } | { storage: 'bundled'; source: string; revision: string };
};

export type ScriptureVerse = {
  chapter: number;
  verse: number;
  text: string;
};

export type ScriptureText = {
  passageId: string;
  translationId: string;
  verses: readonly ScriptureVerse[];
};

export type ScriptureCatalog = {
  dayCount: number;
  themes: readonly WeeklyTheme[];
  plans: readonly ReadingPlan[];
  books: readonly BibleBook[];
  passages: readonly ScripturePassage[];
  translations: readonly BibleTranslation[];
  texts: readonly ScriptureText[];
  fallbackTranslationId: string;
};
