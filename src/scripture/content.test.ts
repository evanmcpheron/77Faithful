import { bibleTranslations } from '@/content/scripture/translations';
import {
  getAvailableTranslations,
  getDailyReading,
  loadScriptureText,
  resolveTranslationPreference,
  scriptureCatalog,
} from '@/services/scripture';

import { auditReadingPlan, validateScriptureCatalog } from './validation';

it('validates the checked-in content without presenting draft material as published', async () => {
  expect(validateScriptureCatalog(scriptureCatalog)).toEqual([]);
  expect(getDailyReading('v1-draft', 1)).toBeNull();
  expect(getAvailableTranslations('v1-draft')).toEqual([]);
  expect(resolveTranslationPreference('v1-draft', undefined)).toEqual({
    translation: null,
    usedFallback: false,
  });
  expect(await loadScriptureText('v1-draft', 'unknown', 'bsb')).toEqual({
    status: 'unavailable',
    reason: 'passage',
  });
  expect(auditReadingPlan(scriptureCatalog.plans[0].version, scriptureCatalog)).toMatchObject({
    readingDays: 0,
    uniquePassages: 0,
    uniqueVerses: null,
    completeBooks: null,
  });
});

it('keeps the target registry complete and its internal IDs distinct', () => {
  expect(bibleTranslations.map(({ id }) => id)).toEqual([
    'nasb2020',
    'niv',
    'nlt',
    'esv',
    'msg',
    'csb',
    'nkjv',
    'kjv',
    'bsb',
    'nrsvue',
    'lsb',
    'nasb1995',
    'net',
    'amp',
  ]);
});

it('preserves the settled weekly theme order', () => {
  expect(scriptureCatalog.themes.map(({ name }) => name)).toEqual([
    'Abiding in Christ',
    'Scripture',
    'Prayer',
    'Renewal',
    'Identity in Christ',
    'Love',
    'Service',
    'Stewardship',
    'Christian Community',
    'Mission',
    'Perseverance',
  ]);
});
