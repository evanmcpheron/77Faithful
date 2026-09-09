const { createHash } = require('node:crypto');
const manuscript = require('../content/provisional-course/manuscript.json');
const scripture = require('../content/provisional-course/scripture-web.json');
const {
  FormationThemeOrder,
} = require('../functions/lib/generated/types/formation/formation-course.types');

const courseId = 'provisional-77-days';
const revision = createHash('sha256')
  .update(JSON.stringify({ manuscript, scripture }))
  .digest('hex')
  .slice(0, 16);
const courseVersionId = `draft-${revision}`;
const bibleTextEditionId = `web-${scripture.sourceRevision.slice(7, 23)}`;

const buildProvisionalCourse = (timestamp) => {
  if (manuscript.days.length !== 77 || manuscript.weeks.length !== 11) {
    throw new Error('The provisional course needs exactly 77 days and 11 weeks.');
  }
  const documents = new Map();
  const course = { courseId, courseVersionId };
  const versionPath = `formationCourses/${courseId}/versions/${courseVersionId}`;
  const timestamps = { createdAt: timestamp, updatedAt: timestamp };
  documents.set(versionPath, {
    schemaVersion: 1,
    courseId,
    dayCount: 77,
    weekCount: 11,
    publicationState: { status: 'Published', publishedAt: timestamp },
    ...timestamps,
  });
  manuscript.weeks.forEach((week, index) => {
    if (week.weekNumber !== index + 1 || week.themeId !== FormationThemeOrder[index]) {
      throw new Error(`Invalid week ${index + 1}.`);
    }
    documents.set(`${versionPath}/weekOverviews/${week.weekNumber}`, {
      ...course,
      weekNumber: week.weekNumber,
      themeId: week.themeId,
      title: week.title,
      description: week.description,
    });
    documents.set(`${versionPath}/weekIntroductions/${week.weekNumber}`, {
      ...course,
      weekNumber: week.weekNumber,
      themeId: week.themeId,
      introduction: week.introduction,
    });
  });
  manuscript.days.forEach((day, index) => {
    const weekNumber = Math.ceil((index + 1) / 7);
    if (
      day.dayNumber !== index + 1 ||
      day.weekNumber !== weekNumber ||
      day.themeId !== FormationThemeOrder[weekNumber - 1] ||
      day.selectionDecision === "Don't Use"
    ) {
      throw new Error(`Invalid day ${index + 1}.`);
    }
    for (const field of [
      'passage',
      'title',
      'devotional',
      'prayerPrompt',
      'writtenPrayer',
      'reflectionQuestion',
    ]) {
      if (typeof day[field] !== 'string' || !day[field].trim())
        throw new Error(`Day ${day.dayNumber} is missing ${field}.`);
    }
    const verses = scripture.readings[day.passage];
    if (!verses?.length || verses.some((verse) => !verse.verseLabel || !verse.text.trim())) {
      throw new Error(
        `Missing WEB text for ${day.passage}. Reimport Scripture after changing passages.`,
      );
    }
    const scriptureAssignmentId = `${courseVersionId}-day-${day.dayNumber}`;
    const passageId = scriptureAssignmentId;
    const primaryPassage = { passageId, displayReference: day.passage };
    documents.set(`${versionPath}/days/${day.dayNumber}`, {
      ...course,
      dayNumber: day.dayNumber,
      weekNumber,
      themeId: day.themeId,
      title: day.title,
      scriptureAssignmentId,
      devotional: day.devotional,
      prayerPrompt: day.prayerPrompt,
      writtenPrayer: day.writtenPrayer,
      reflectionQuestion: day.reflectionQuestion,
      intentionInvitation: day.intentionInvitation,
    });
    documents.set(`scriptureAssignments/${scriptureAssignmentId}`, {
      displayReference: day.passage,
      primaryPassage,
      supportingPassage: null,
      ...timestamps,
    });
    documents.set(
      `bibleTextEditions/${bibleTextEditionId}/assignmentTexts/${scriptureAssignmentId}`,
      {
        scriptureAssignmentId,
        bibleVersionId: 'Web',
        bibleTextEditionId,
        primaryPassage: {
          ...primaryPassage,
          paragraphs: [{ runs: verses }],
          versificationNote: null,
        },
        supportingPassage: null,
        ...timestamps,
      },
    );
  });
  return documents;
};

const seedProvisionalCourse = async (database, timestamp) => {
  const documents = buildProvisionalCourse(timestamp);
  const courseReference = database.doc(`formationCourses/${courseId}`);
  const versionReference = database.doc(`formationCourses/${courseId}/versions/${courseVersionId}`);
  const editionReference = database.doc(`bibleTextEditions/${bibleTextEditionId}`);
  const configurationReference = database.doc('formationConfiguration/current');
  return database.runTransaction(async (transaction) => {
    const [existingCourse, existingVersion, existingEdition, configuration] = await Promise.all([
      transaction.get(courseReference),
      transaction.get(versionReference),
      transaction.get(editionReference),
      transaction.get(configurationReference),
    ]);
    if (configuration.exists && configuration.data().courseId !== courseId) {
      throw new Error('Another course is configured. The provisional import will not replace it.');
    }
    if (existingVersion.exists) return { courseId, courseVersionId, outcome: 'AlreadyImported' };
    if (!existingCourse.exists)
      transaction.create(courseReference, {
        schemaVersion: 1,
        title: manuscript.title,
        description: manuscript.description,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    if (!existingEdition.exists)
      transaction.create(editionReference, {
        bibleVersionId: 'Web',
        editionName: scripture.editionName,
        sourceRevision: scripture.sourceRevision,
        acknowledgments: scripture.acknowledgments,
        releaseState: { status: 'Released', releasedAt: timestamp },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    for (const [path, document] of documents) transaction.create(database.doc(path), document);
    transaction.set(configurationReference, {
      courseId,
      courseVersionId,
      bibleTextEditionIds: { Web: bibleTextEditionId },
    });
    return { courseId, courseVersionId, outcome: 'Imported', documentCount: documents.size };
  });
};

module.exports = {
  buildProvisionalCourse,
  seedProvisionalCourse,
  courseId,
  courseVersionId,
  bibleTextEditionId,
};
