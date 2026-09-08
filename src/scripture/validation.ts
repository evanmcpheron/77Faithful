import type { ScriptureCatalog, ScripturePassage } from './types';
import {
  JOURNEY_DAY_COUNT,
  JOURNEY_WEEK_COUNT,
  isJourneyDayNumber,
  journeyWeekForDay,
} from '../journey/invariants.ts';

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function verseKeys(passage: ScripturePassage): string[] {
  return passage.ranges.flatMap(({ chapter, startVerse, endVerse }) =>
    Array.from(
      { length: endVerse - startVerse + 1 },
      (_, index) => `${chapter}:${startVerse + index}`,
    ),
  );
}

export function validateScriptureCatalog(catalog: ScriptureCatalog): string[] {
  const errors: string[] = [];
  const { dayCount, themes, plans, books, passages, translations, texts } = catalog;

  function check(condition: boolean, message: string) {
    if (!condition) errors.push(message);
  }

  function checkIds(label: string, ids: readonly string[]) {
    const seen = new Set<string>();
    for (const id of ids) {
      check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), `${label}: malformed identifier ${id}.`);
      check(!seen.has(id), `${label}: duplicate identifier ${id}.`);
      seen.add(id);
    }
  }

  check(dayCount === JOURNEY_DAY_COUNT, 'The V1 plan must represent 77 journey days.');
  check(themes.length === JOURNEY_WEEK_COUNT, 'The V1 plan must have 11 weekly themes.');
  checkIds(
    'Theme',
    themes.map(({ id }) => id),
  );
  checkIds(
    'Plan',
    plans.map(({ version }) => version),
  );
  checkIds(
    'Book',
    books.map(({ id }) => id),
  );
  checkIds(
    'Passage',
    passages.map(({ id }) => id),
  );
  checkIds(
    'Translation',
    translations.map(({ id }) => id),
  );
  themes.forEach((theme) => check(hasText(theme.name), `Theme ${theme.id}: name is required.`));

  for (const book of books) {
    check(hasText(book.name) && hasText(book.source), `Book ${book.id}: name/source is required.`);
    check(
      book.chapterVerseCounts.length > 0 && book.chapterVerseCounts.every(isPositiveInteger),
      `Book ${book.id}: verified chapter verse counts are required.`,
    );
  }

  const validPassages = new Set<ScripturePassage>();
  for (const passage of passages) {
    const previousErrorCount = errors.length;
    const book = books.find(({ id }) => id === passage.bookId);
    check(Boolean(book), `Passage ${passage.id}: unknown book ${passage.bookId}.`);
    check(hasText(passage.reference), `Passage ${passage.id}: display reference is required.`);
    check(passage.ranges.length > 0, `Passage ${passage.id}: verse ranges are required.`);
    let previousRange = null;
    for (const range of passage.ranges) {
      const { chapter, startVerse, endVerse } = range;
      check(
        isPositiveInteger(chapter) &&
          isPositiveInteger(startVerse) &&
          isPositiveInteger(endVerse) &&
          startVerse <= endVerse &&
          endVerse <= (book?.chapterVerseCounts[chapter - 1] ?? 0),
        `Passage ${passage.id}: invalid range ${chapter}:${startVerse}-${endVerse}.`,
      );
      if (previousRange) {
        check(
          chapter === previousRange.chapter + 1 &&
            startVerse === 1 &&
            previousRange.endVerse === book?.chapterVerseCounts[previousRange.chapter - 1],
          `Passage ${passage.id}: chapter-spanning ranges must be contiguous and ordered.`,
        );
      }
      previousRange = range;
    }
    if (errors.length === previousErrorCount) validPassages.add(passage);
  }

  const requiredPassages = new Set<string>();
  for (const plan of plans) {
    const days = new Set<number>();
    const published = plan.publication.status === 'published';
    if (plan.publication.status === 'published') {
      check(
        hasText(plan.publication.approval),
        `Plan ${plan.version}: approval evidence is required.`,
      );
      check(
        plan.days.length === dayCount,
        `Plan ${plan.version}: all ${dayCount} days are required.`,
      );
    }
    for (const day of plan.days) {
      check(
        isJourneyDayNumber(day.dayNumber),
        `Plan ${plan.version}: invalid day ${day.dayNumber}.`,
      );
      check(!days.has(day.dayNumber), `Plan ${plan.version}: duplicate day ${day.dayNumber}.`);
      days.add(day.dayNumber);
      check(
        isJourneyDayNumber(day.dayNumber) &&
          day.themeId === themes[journeyWeekForDay(day.dayNumber) - 1]?.id,
        `Plan ${plan.version} day ${day.dayNumber}: incorrect weekly theme.`,
      );
      check(
        passages.some(({ id }) => id === day.passageId),
        `Plan ${plan.version} day ${day.dayNumber}: unknown passage ${day.passageId}.`,
      );
      if (published) requiredPassages.add(day.passageId);
    }
  }

  for (const translation of translations) {
    check(
      hasText(translation.abbreviation) && hasText(translation.displayName),
      `Translation ${translation.id}: abbreviation/name is required.`,
    );
    if (translation.license.status === 'cleared') {
      check(
        hasText(translation.license.evidence),
        `Translation ${translation.id}: license evidence is required.`,
      );
      check(
        translation.license.attribution === null || hasText(translation.license.attribution),
        `Translation ${translation.id}: attribution must be verified text or null when not required.`,
      );
    } else {
      check(
        hasText(translation.license.notes),
        `Translation ${translation.id}: licensing TODO is required.`,
      );
    }
    if (translation.content.storage === 'bundled') {
      check(
        translation.license.status === 'cleared' &&
          hasText(translation.content.source) &&
          hasText(translation.content.revision),
        `Translation ${translation.id}: bundled content requires cleared rights and source/revision.`,
      );
    }
    if (translation.enabled) {
      check(
        translation.license.status === 'cleared' && translation.content.storage === 'bundled',
        `Translation ${translation.id}: enabled content must be cleared and supplied.`,
      );
      check(requiredPassages.size > 0, `Translation ${translation.id}: no published reading plan.`);
      for (const passageId of requiredPassages) {
        check(
          texts.some(
            (text) => text.translationId === translation.id && text.passageId === passageId,
          ),
          `Translation ${translation.id}: missing required passage ${passageId}.`,
        );
      }
    }
  }
  check(
    translations.some(({ id }) => id === catalog.fallbackTranslationId),
    `Unknown fallback translation ${catalog.fallbackTranslationId}.`,
  );

  const combinations = new Set<string>();
  const sharedVerses = new Map<string, string>();
  for (const text of texts) {
    const key = `${text.translationId}/${text.passageId}`;
    check(!combinations.has(key), `Text ${key}: duplicate passage/translation combination.`);
    combinations.add(key);
    const passage = passages.find(({ id }) => id === text.passageId);
    const translation = translations.find(({ id }) => id === text.translationId);
    check(Boolean(passage), `Text ${key}: unknown passage.`);
    check(Boolean(translation), `Text ${key}: unknown translation.`);
    check(
      translation?.license.status === 'cleared' && translation.content.storage === 'bundled',
      `Text ${key}: storing text requires verified rights and bundled source metadata.`,
    );
    check(text.verses.length > 0, `Text ${key}: verses are required.`);
    const expectedVerses = passage && validPassages.has(passage) ? verseKeys(passage) : [];
    check(
      text.verses.length === expectedVerses.length &&
        text.verses.every(
          (verse, index) => `${verse.chapter}:${verse.verse}` === expectedVerses[index],
        ),
      `Text ${key}: verses must exactly cover the passage in order.`,
    );
    for (const verse of text.verses) {
      check(hasText(verse.text), `Text ${key}: nonempty verse text is required.`);
      const verseKey = `${text.translationId}/${passage?.bookId}/${verse.chapter}:${verse.verse}`;
      const previousText = sharedVerses.get(verseKey);
      check(
        previousText === undefined || previousText === verse.text,
        `Text ${key}: overlapping verse ${verse.chapter}:${verse.verse} has inconsistent text.`,
      );
      sharedVerses.set(verseKey, verse.text);
    }
  }
  return errors;
}

export function auditReadingPlan(contentVersion: string, catalog: ScriptureCatalog) {
  const errors = validateScriptureCatalog(catalog);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  const plan = catalog.plans.find(({ version }) => version === contentVersion);
  if (!plan) throw new Error(`Unknown reading plan ${contentVersion}.`);

  const passageIds = new Set(plan.days.map(({ passageId }) => passageId));
  const versesByBook = new Map<string, Set<string>>();
  for (const passage of catalog.passages.filter(({ id }) => passageIds.has(id))) {
    const verses = versesByBook.get(passage.bookId) ?? new Set<string>();
    verseKeys(passage).forEach((verse) => verses.add(verse));
    versesByBook.set(passage.bookId, verses);
  }
  const complete = plan.publication.status === 'published' && plan.days.length === catalog.dayCount;
  return {
    version: plan.version,
    publication: plan.publication.status,
    readingDays: plan.days.length,
    uniquePassages: passageIds.size,
    uniqueVerses: complete
      ? [...versesByBook.values()].reduce((total, verses) => total + verses.size, 0)
      : null,
    completeBooks: complete
      ? catalog.books
          .filter(
            (book) =>
              versesByBook.get(book.id)?.size ===
              book.chapterVerseCounts.reduce((sum, count) => sum + count, 0),
          )
          .map(({ id }) => id)
      : null,
    note: complete
      ? 'Structural counts use the documented canonical versification; review translation differences for permissions.'
      : 'The 77 passages are not finalized; the final unique verse count and complete-book audit cannot yet be calculated.',
  };
}
