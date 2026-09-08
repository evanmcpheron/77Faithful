import { createScriptureFixture } from './__fixtures__/catalog';
import type { ScriptureCatalog } from './types';
import { auditReadingPlan, validateScriptureCatalog } from './validation';

it('validates a complete synthetic plan with chapter-spanning and overlapping passages', () => {
  expect(validateScriptureCatalog(createScriptureFixture())).toEqual([]);
});

it.each<{ name: string; change: (catalog: ScriptureCatalog) => ScriptureCatalog; error: string }>([
  {
    name: 'unknown day passage',
    change: (catalog) => ({ ...catalog, passages: catalog.passages.slice(1) }),
    error: 'day 1: unknown passage fixture-opening',
  },
  {
    name: 'duplicate day',
    change: (catalog) => ({
      ...catalog,
      plans: [{ ...catalog.plans[0], days: [...catalog.plans[0].days, catalog.plans[0].days[0]] }],
    }),
    error: 'duplicate day 1',
  },
  {
    name: 'incomplete published plan',
    change: (catalog) => ({
      ...catalog,
      plans: [{ ...catalog.plans[0], days: catalog.plans[0].days.slice(1) }],
    }),
    error: 'all 77 days are required',
  },
  {
    name: 'out-of-range day',
    change: (catalog) => ({
      ...catalog,
      plans: [{ ...catalog.plans[0], days: [{ ...catalog.plans[0].days[0], dayNumber: 78 }] }],
    }),
    error: 'invalid day 78',
  },
  {
    name: 'incorrect weekly membership',
    change: (catalog) => ({ ...catalog, themes: [...catalog.themes].reverse() }),
    error: 'incorrect weekly theme',
  },
  {
    name: 'missing human approval evidence',
    change: (catalog) => ({
      ...catalog,
      plans: [{ ...catalog.plans[0], publication: { status: 'published', approval: ' ' } }],
    }),
    error: 'approval evidence is required',
  },
  {
    name: 'duplicate passage identity',
    change: (catalog) => ({ ...catalog, passages: [...catalog.passages, catalog.passages[0]] }),
    error: 'Passage: duplicate identifier fixture-opening',
  },
  {
    name: 'unknown text passage',
    change: (catalog) => ({ ...catalog, texts: [{ ...catalog.texts[0], passageId: 'unknown' }] }),
    error: 'Text bsb/unknown: unknown passage',
  },
  {
    name: 'unknown text translation',
    change: (catalog) => ({
      ...catalog,
      texts: [{ ...catalog.texts[0], translationId: 'unknown' }],
    }),
    error: 'Text unknown/fixture-opening: unknown translation',
  },
  {
    name: 'enabled translation missing a passage',
    change: (catalog) => ({ ...catalog, texts: catalog.texts.slice(1) }),
    error: 'Translation bsb: missing required passage fixture-opening',
  },
  {
    name: 'duplicate text combination',
    change: (catalog) => ({ ...catalog, texts: [...catalog.texts, catalog.texts[0]] }),
    error: 'duplicate passage/translation combination',
  },
  {
    name: 'empty verse text',
    change: (catalog) => ({
      ...catalog,
      texts: [{ ...catalog.texts[0], verses: [{ chapter: 1, verse: 1, text: '  ' }] }],
    }),
    error: 'nonempty verse text is required',
  },
  {
    name: 'missing or reordered verses',
    change: (catalog) => ({
      ...catalog,
      texts: [{ ...catalog.texts[0], verses: [...catalog.texts[0].verses].reverse() }],
    }),
    error: 'verses must exactly cover the passage in order',
  },
  {
    name: 'inconsistent overlapping text',
    change: (catalog) => ({
      ...catalog,
      texts: catalog.texts.map((text, index) =>
        index === 1
          ? {
              ...text,
              verses: text.verses.map((verse) => ({
                ...verse,
                text: 'Different non-Scripture fixture text.',
              })),
            }
          : text,
      ),
    }),
    error: 'overlapping verse 1:2 has inconsistent text',
  },
  {
    name: 'blank display reference',
    change: (catalog) => ({ ...catalog, passages: [{ ...catalog.passages[0], reference: '' }] }),
    error: 'display reference is required',
  },
  {
    name: 'reversed verse range',
    change: (catalog) => ({
      ...catalog,
      passages: [{ ...catalog.passages[0], ranges: [{ chapter: 1, startVerse: 3, endVerse: 1 }] }],
    }),
    error: 'invalid range 1:3-1',
  },
  {
    name: 'verse past the end of the documented chapter',
    change: (catalog) => ({
      ...catalog,
      passages: [{ ...catalog.passages[0], ranges: [{ chapter: 1, startVerse: 1, endVerse: 4 }] }],
    }),
    error: 'invalid range 1:1-4',
  },
  {
    name: 'gap between chapter ranges',
    change: (catalog) => ({
      ...catalog,
      passages: [
        {
          ...catalog.passages[1],
          ranges: [
            { chapter: 1, startVerse: 2, endVerse: 2 },
            { chapter: 2, startVerse: 1, endVerse: 2 },
          ],
        },
      ],
    }),
    error: 'chapter-spanning ranges must be contiguous and ordered',
  },
  {
    name: 'uncleared text even when disabled',
    change: (catalog) => ({
      ...catalog,
      translations: catalog.translations.map((translation) => ({
        ...translation,
        enabled: false,
        license: { status: 'pending', notes: 'TODO test permission' },
      })),
    }),
    error: 'storing text requires verified rights',
  },
  {
    name: 'missing source provenance',
    change: (catalog) => ({
      ...catalog,
      translations: catalog.translations.map((translation) => ({
        ...translation,
        content: { storage: 'bundled', source: '', revision: '' },
      })),
    }),
    error: 'bundled content requires cleared rights and source/revision',
  },
  {
    name: 'unknown fallback',
    change: (catalog) => ({ ...catalog, fallbackTranslationId: 'unknown' }),
    error: 'Unknown fallback translation unknown',
  },
])('detects $name', ({ change, error }) => {
  expect(validateScriptureCatalog(change(createScriptureFixture())).join('\n')).toContain(error);
});

it('requires enabled translations to cover retained published versions', () => {
  const catalog = createScriptureFixture();
  const oldPassage = { ...catalog.passages[0], id: 'fixture-old' };
  const oldPlan = {
    ...catalog.plans[0],
    version: 'fixture-old',
    days: catalog.plans[0].days.map((day) => ({ ...day, passageId: oldPassage.id })),
  };
  expect(
    validateScriptureCatalog({
      ...catalog,
      passages: [...catalog.passages, oldPassage],
      plans: [...catalog.plans, oldPlan],
    }).join('\n'),
  ).toContain('missing required passage fixture-old');
});

it('deduplicates repeated and overlapping readings and detects a whole synthetic book', () => {
  const catalog = createScriptureFixture();
  expect(auditReadingPlan(catalog.plans[0].version, catalog)).toMatchObject({
    readingDays: 77,
    uniquePassages: 2,
    uniqueVerses: 5,
    completeBooks: ['fixture-book'],
  });
});

it('does not report a partially represented book as complete', () => {
  const catalog = createScriptureFixture();
  const plan = {
    ...catalog.plans[0],
    days: catalog.plans[0].days.map((day) => ({ ...day, passageId: 'fixture-opening' })),
  };
  expect(auditReadingPlan(plan.version, { ...catalog, plans: [plan] })).toMatchObject({
    uniqueVerses: 2,
    completeBooks: [],
  });
});

it('refuses to calculate authoritative counts from invalid content', () => {
  const catalog = createScriptureFixture();
  expect(() => auditReadingPlan(catalog.plans[0].version, { ...catalog, passages: [] })).toThrow(
    'unknown passage',
  );
});
