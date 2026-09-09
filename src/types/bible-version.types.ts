export const BibleVersion = {
  NewAmericanStandardBible2020: {
    abbreviation: 'NASB 2020',
    name: 'New American Standard Bible 2020',
  },
  NewInternationalVersion: {
    abbreviation: 'NIV',
    name: 'New International Version',
  },
  NewLivingTranslation: {
    abbreviation: 'NLT',
    name: 'New Living Translation',
  },
  EnglishStandardVersion: {
    abbreviation: 'ESV',
    name: 'English Standard Version',
  },
  TheMessage: {
    abbreviation: 'MSG',
    name: 'The Message',
  },
  KingJamesVersion: {
    abbreviation: 'KJV',
    name: 'King James Version',
  },
  NewKingJamesVersion: {
    abbreviation: 'NKJV',
    name: 'New King James Version',
  },
  ChristianStandardBible: {
    abbreviation: 'CSB',
    name: 'Christian Standard Bible',
  },
  WorldEnglishBible: {
    abbreviation: 'WEB',
    name: 'World English Bible',
  },
} as const;

export type TBibleVersion = (typeof BibleVersion)[keyof typeof BibleVersion];
