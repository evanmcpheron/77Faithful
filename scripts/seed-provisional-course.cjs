const { createRequire } = require('node:module');
const {
  buildProvisionalCourse,
  seedProvisionalCourse,
  courseId,
  courseVersionId,
} = require('./provisional-course.cjs');
const functionsRequire = createRequire(require.resolve('../functions/package.json'));
const { initializeApp, applicationDefault } = functionsRequire('firebase-admin/app');
const { getFirestore, Timestamp } = functionsRequire('firebase-admin/firestore');

const run = async () => {
  const projectId = process.argv[2];
  const shouldWrite = process.argv.includes('--write');
  if (!projectId || projectId.startsWith('-'))
    throw new Error('Usage: node scripts/seed-provisional-course.cjs PROJECT_ID [--write]');
  const timestamp = Timestamp.now();
  const documents = buildProvisionalCourse(timestamp);
  console.log({ courseId, courseVersionId, documents: documents.size, projectId, shouldWrite });
  if (!shouldWrite) return;
  initializeApp({ projectId, credential: applicationDefault() });
  console.log(await seedProvisionalCourse(getFirestore(), timestamp));
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
