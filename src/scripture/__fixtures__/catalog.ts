import type { ScriptureCatalog } from '../types';

export function createScriptureFixture(): ScriptureCatalog {
  const themes = Array.from({ length: 11 }, (_, index) => ({
    id: `fixture-week-${index + 1}`,
    name: `Synthetic theme ${index + 1}`,
  }));
  const passages = [
    {
      id: 'fixture-opening',
      bookId: 'fixture-book',
      reference: 'Synthetic reference 1:1–2',
      ranges: [{ chapter: 1, startVerse: 1, endVerse: 2 }],
    },
    {
      id: 'fixture-crossing',
      bookId: 'fixture-book',
      reference: 'Synthetic reference 1:2–2:2',
      ranges: [
        { chapter: 1, startVerse: 2, endVerse: 3 },
        { chapter: 2, startVerse: 1, endVerse: 2 },
      ],
    },
  ];
  const translations = ['bsb', 'kjv'].map((id) => ({
    id,
    abbreviation: `FIXTURE ${id}`,
    displayName: `Synthetic ${id} fixture — not Scripture`,
    enabled: true,
    license: {
      status: 'cleared' as const,
      evidence: 'TEST ONLY: synthetic data, no Bible text or production permission.',
      attribution: 'Synthetic test attribution. Not a publisher notice.',
    },
    content: {
      storage: 'bundled' as const,
      source: 'Synthetic test fixture',
      revision: 'test-only',
    },
  }));
  return {
    dayCount: 77,
    themes,
    plans: [
      {
        version: 'fixture-v1',
        publication: { status: 'published', approval: 'TEST ONLY: not production approval.' },
        days: Array.from({ length: 77 }, (_, index) => ({
          dayNumber: index + 1,
          themeId: themes[Math.floor(index / 7)].id,
          passageId: passages[index % 2].id,
        })),
      },
    ],
    books: [
      {
        id: 'fixture-book',
        name: 'Synthetic book, not a biblical book',
        chapterVerseCounts: [3, 2],
        source: 'Invented test coordinates only; no biblical verse counts.',
      },
    ],
    passages,
    translations,
    texts: translations.flatMap((translation) =>
      passages.map((passage) => ({
        passageId: passage.id,
        translationId: translation.id,
        verses: passage.ranges.flatMap(({ chapter, startVerse, endVerse }) =>
          Array.from({ length: endVerse - startVerse + 1 }, (_, index) => ({
            chapter,
            verse: startVerse + index,
            text: `Non-Scripture fixture ${translation.id}, coordinate ${chapter}:${startVerse + index}.`,
          })),
        ),
      })),
    ),
    fallbackTranslationId: 'bsb',
  };
}
