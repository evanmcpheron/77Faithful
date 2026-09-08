const { bibleBooks, scripturePassages } = require('../src/content/scripture/passages.ts');
const {
  JOURNEY_DAY_COUNT,
  readingPlans,
  weeklyThemes,
} = require('../src/content/scripture/reading-plans.ts');
const { scriptureTexts } = require('../src/content/scripture/texts.ts');
const {
  bibleTranslations,
  FALLBACK_TRANSLATION_ID,
} = require('../src/content/scripture/translations.ts');
const { auditReadingPlan, validateScriptureCatalog } = require('../src/scripture/validation.ts');

const catalog = {
  dayCount: JOURNEY_DAY_COUNT,
  themes: weeklyThemes,
  plans: readingPlans,
  books: bibleBooks,
  passages: scripturePassages,
  translations: bibleTranslations,
  texts: scriptureTexts,
  fallbackTranslationId: FALLBACK_TRANSLATION_ID,
};

const errors = validateScriptureCatalog(catalog);
if (process.argv.includes('--release')) {
  if (!readingPlans.some((plan) => plan.publication.status === 'published')) {
    errors.push('Release requires a complete, human-approved published reading plan.');
  }
  if (
    !bibleTranslations.some(
      (translation) => translation.id === FALLBACK_TRANSLATION_ID && translation.enabled,
    )
  ) {
    errors.push('Release requires an enabled fallback translation with verified content.');
  }
}
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      readingPlans.map((plan) => auditReadingPlan(plan.version, catalog)),
      null,
      2,
    ),
  );
}
