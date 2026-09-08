import { bibleBooks, scripturePassages } from '@/content/scripture/passages';
import { JOURNEY_DAY_COUNT, readingPlans, weeklyThemes } from '@/content/scripture/reading-plans';
import { scriptureTexts } from '@/content/scripture/texts';
import {
  bibleTranslations,
  FALLBACK_TRANSLATION_ID,
  type TranslationId,
} from '@/content/scripture/translations';
import type { BibleTranslation, ScriptureCatalog, ScriptureVerse } from '@/scripture/types';

export const scriptureCatalog: ScriptureCatalog = {
  dayCount: JOURNEY_DAY_COUNT,
  themes: weeklyThemes,
  plans: readingPlans,
  books: bibleBooks,
  passages: scripturePassages,
  translations: bibleTranslations,
  texts: scriptureTexts,
  fallbackTranslationId: FALLBACK_TRANSLATION_ID,
};

export type ReaderTranslation = {
  id: TranslationId;
  abbreviation: string;
  displayName: string;
  attribution: string | null;
};

export function getDailyReading(contentVersion: string, dayNumber: number) {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > JOURNEY_DAY_COUNT) return null;
  const plan = readingPlans.find(
    (plan) => plan.version === contentVersion && plan.publication.status === 'published',
  );
  const day = plan?.days.find((day) => day.dayNumber === dayNumber);
  const passage = scripturePassages.find((passage) => passage.id === day?.passageId);
  const theme = weeklyThemes.find((theme) => theme.id === day?.themeId);
  return day && passage && theme ? { contentVersion, dayNumber, theme, passage } : null;
}

export function getAvailableTranslations(contentVersion: string): ReaderTranslation[] {
  const plan = readingPlans.find(
    (plan) => plan.version === contentVersion && plan.publication.status === 'published',
  );
  if (!plan || plan.days.length !== JOURNEY_DAY_COUNT) return [];

  const translations: readonly (BibleTranslation & { id: TranslationId })[] = bibleTranslations;
  return translations.flatMap((translation) => {
    if (
      !translation.enabled ||
      translation.license.status !== 'cleared' ||
      translation.content.storage !== 'bundled' ||
      !plan.days.every((day) =>
        scriptureTexts.some(
          (text) =>
            text.passageId === day.passageId &&
            text.translationId === translation.id &&
            text.verses.length > 0,
        ),
      )
    )
      return [];
    return [
      {
        id: translation.id,
        abbreviation: translation.abbreviation,
        displayName: translation.displayName,
        attribution: translation.license.attribution,
      },
    ];
  });
}

export function resolveTranslationPreference(contentVersion: string, savedPreference: unknown) {
  const available = getAvailableTranslations(contentVersion);
  const saved = available.find(({ id }) => id === savedPreference);
  const translation = saved ?? available.find(({ id }) => id === FALLBACK_TRANSLATION_ID) ?? null;
  return { translation, usedFallback: translation !== null && saved === undefined };
}

export type ScriptureResult =
  | { status: 'unavailable'; reason: 'passage' | 'translation' | 'text' }
  | { status: 'ready'; translation: ReaderTranslation; verses: readonly ScriptureVerse[] };

// The async boundary also accommodates a licensed remote source without exposing storage to readers.
export async function loadScriptureText(
  contentVersion: string,
  passageId: string,
  translationId: TranslationId,
): Promise<ScriptureResult> {
  const plan = readingPlans.find(
    (plan) => plan.version === contentVersion && plan.publication.status === 'published',
  );
  if (
    !plan?.days.some((day) => day.passageId === passageId) ||
    !scripturePassages.some(({ id }) => id === passageId)
  ) {
    return { status: 'unavailable', reason: 'passage' };
  }
  const translation = getAvailableTranslations(contentVersion).find(
    ({ id }) => id === translationId,
  );
  if (!translation) return { status: 'unavailable', reason: 'translation' };
  const text = scriptureTexts.find(
    (text) => text.passageId === passageId && text.translationId === translation.id,
  );
  if (!text) return { status: 'unavailable', reason: 'text' };
  return { status: 'ready', translation, verses: text.verses };
}
