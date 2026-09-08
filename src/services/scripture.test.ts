import { scriptureTexts } from '@/content/scripture/texts';
import { bibleTranslations } from '@/content/scripture/translations';
import type * as ScriptureFixtures from '@/scripture/__fixtures__/catalog';
import type { BibleTranslation } from '@/scripture/types';

import {
  getAvailableTranslations,
  getDailyReading,
  loadScriptureText,
  resolveTranslationPreference,
} from './scripture';

jest.mock('@/content/scripture/reading-plans', () => {
  const { createScriptureFixture } = jest.requireActual<typeof ScriptureFixtures>(
    '@/scripture/__fixtures__/catalog',
  );
  const catalog = createScriptureFixture();
  return { readingPlans: catalog.plans, weeklyThemes: catalog.themes, JOURNEY_DAY_COUNT: 77 };
});
jest.mock('@/content/scripture/passages', () => {
  const { createScriptureFixture } = jest.requireActual<typeof ScriptureFixtures>(
    '@/scripture/__fixtures__/catalog',
  );
  const catalog = createScriptureFixture();
  return { bibleBooks: catalog.books, scripturePassages: catalog.passages };
});
jest.mock('@/content/scripture/translations', () => {
  const { createScriptureFixture } = jest.requireActual<typeof ScriptureFixtures>(
    '@/scripture/__fixtures__/catalog',
  );
  return {
    bibleTranslations: createScriptureFixture().translations,
    FALLBACK_TRANSLATION_ID: 'bsb',
  };
});
jest.mock('@/content/scripture/texts', () => {
  const { createScriptureFixture } = jest.requireActual<typeof ScriptureFixtures>(
    '@/scripture/__fixtures__/catalog',
  );
  return { scriptureTexts: createScriptureFixture().texts };
});

it.each([1, 12, 24, 77])('resolves day %i from its pinned plan and theme', (dayNumber) => {
  expect(getDailyReading('fixture-v1', dayNumber)).toMatchObject({
    contentVersion: 'fixture-v1',
    dayNumber,
    theme: { id: `fixture-week-${Math.ceil(dayNumber / 7)}` },
    passage: { id: dayNumber % 2 ? 'fixture-opening' : 'fixture-crossing' },
  });
});

it.each([0, 78, 1.5, NaN])('does not resolve invalid day %s', (dayNumber) => {
  expect(getDailyReading('fixture-v1', dayNumber)).toBeNull();
});

it('does not replace a missing pinned version with another plan', async () => {
  expect(getDailyReading('missing-version', 1)).toBeNull();
  expect(getAvailableTranslations('missing-version')).toEqual([]);
  expect(await loadScriptureText('missing-version', 'fixture-opening', 'bsb')).toEqual({
    status: 'unavailable',
    reason: 'passage',
  });
});

it('resolves stored internal IDs and exposes only reader metadata', () => {
  expect(resolveTranslationPreference('fixture-v1', 'kjv')).toEqual({
    translation: {
      id: 'kjv',
      abbreviation: 'FIXTURE kjv',
      displayName: 'Synthetic kjv fixture — not Scripture',
      attribution: 'Synthetic test attribution. Not a publisher notice.',
    },
    usedFallback: false,
  });
});

it.each([undefined, null, '', 'unknown-id', 123, { id: 'kjv' }])(
  'uses the configured fallback for invalid/missing preference %j',
  (preference) => {
    expect(resolveTranslationPreference('fixture-v1', preference)).toMatchObject({
      translation: { id: 'bsb' },
      usedFallback: true,
    });
  },
);

it('removes an incomplete translation from choices and resolves its preference to the labeled fallback', async () => {
  for (const text of scriptureTexts.filter((text) => text.translationId === 'kjv')) {
    jest.replaceProperty(text, 'verses', []);
  }
  expect(getAvailableTranslations('fixture-v1').map(({ id }) => id)).toEqual(['bsb']);
  expect(resolveTranslationPreference('fixture-v1', 'kjv')).toMatchObject({
    translation: { id: 'bsb' },
    usedFallback: true,
  });
  expect(await loadScriptureText('fixture-v1', 'fixture-opening', 'kjv')).toEqual({
    status: 'unavailable',
    reason: 'translation',
  });
});

it('returns unavailable if the fallback is unavailable, without choosing an arbitrary translation', () => {
  for (const text of scriptureTexts.filter((text) => text.translationId === 'bsb')) {
    jest.replaceProperty(text, 'verses', []);
  }
  expect(resolveTranslationPreference('fixture-v1', undefined)).toEqual({
    translation: null,
    usedFallback: false,
  });
  expect(resolveTranslationPreference('fixture-v1', 'kjv')).toMatchObject({
    translation: { id: 'kjv' },
    usedFallback: false,
  });
});

it('never selects disabled translations', () => {
  const translations: readonly BibleTranslation[] = bibleTranslations;
  for (const translation of translations) {
    jest.replaceProperty(translation, 'enabled', false);
  }
  expect(getAvailableTranslations('fixture-v1')).toEqual([]);
});

it('returns the exact selected text and attribution without a network call', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Network must not be used'));
  const reading = getDailyReading('fixture-v1', 2);
  expect(reading?.passage.reference).toBe('Synthetic reference 1:2–2:2');
  const result = await loadScriptureText('fixture-v1', 'fixture-crossing', 'kjv');
  expect(result).toMatchObject({
    status: 'ready',
    translation: { id: 'kjv', attribution: 'Synthetic test attribution. Not a publisher notice.' },
  });
  if (result.status !== 'ready') throw new Error('Expected ready fixture');
  expect(result.verses).toEqual(
    scriptureTexts.find(
      (text) => text.passageId === 'fixture-crossing' && text.translationId === 'kjv',
    )?.verses,
  );
  expect(result.verses[0].text).toBe('Non-Scripture fixture kjv, coordinate 1:2.');
  expect(fetch).not.toHaveBeenCalled();
});

it('does not retrieve an arbitrary passage outside the curated plan', async () => {
  expect(await loadScriptureText('fixture-v1', 'unassigned', 'bsb')).toEqual({
    status: 'unavailable',
    reason: 'passage',
  });
});
