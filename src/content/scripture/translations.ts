import type { BibleTranslation } from '@/scripture/types';

const pendingLicense = {
  status: 'pending',
  notes: 'TODO: verify permission for the intended storage/distribution and the exact attribution.',
} as const;

export const bibleTranslations = [
  {
    id: 'nasb2020',
    abbreviation: 'NASB 2020',
    displayName: 'New American Standard Bible 2020',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'niv',
    abbreviation: 'NIV',
    displayName: 'New International Version',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'nlt',
    abbreviation: 'NLT',
    displayName: 'New Living Translation',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'esv',
    abbreviation: 'ESV',
    displayName: 'English Standard Version',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'msg',
    abbreviation: 'MSG',
    displayName: 'The Message',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'csb',
    abbreviation: 'CSB',
    displayName: 'Christian Standard Bible',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'nkjv',
    abbreviation: 'NKJV',
    displayName: 'New King James Version',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'kjv',
    abbreviation: 'KJV',
    displayName: 'King James Version',
    enabled: false,
    license: {
      status: 'pending',
      notes:
        'TODO: verify the exact source edition, distribution territories (including UK rights), and attribution before importing text.',
    },
    content: { storage: 'unavailable' },
  },
  {
    id: 'bsb',
    abbreviation: 'BSB',
    displayName: 'Berean Standard Bible',
    enabled: false,
    license: {
      status: 'cleared',
      evidence: 'https://berean.bible/terms.htm',
      // Verified 2026-09-07: public-domain dedication; attribution is optional. No text imported.
      attribution: null,
    },
    content: { storage: 'unavailable' },
  },
  {
    id: 'nrsvue',
    abbreviation: 'NRSVue',
    displayName: 'New Revised Standard Version Updated Edition',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'lsb',
    abbreviation: 'LSB',
    displayName: 'Legacy Standard Bible',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'nasb1995',
    abbreviation: 'NASB 1995',
    displayName: 'New American Standard Bible 1995',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'net',
    abbreviation: 'NET',
    displayName: 'New English Translation',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
  {
    id: 'amp',
    abbreviation: 'AMP',
    displayName: 'Amplified Bible',
    enabled: false,
    license: pendingLicense,
    content: { storage: 'unavailable' },
  },
] as const satisfies readonly BibleTranslation[];

export type TranslationId = (typeof bibleTranslations)[number]['id'];
export const FALLBACK_TRANSLATION_ID: TranslationId = 'bsb';
