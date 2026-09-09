const { cpSync, mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const generated = path.join(root, 'functions/generated');
rmSync(generated, { recursive: true, force: true });
mkdirSync(path.join(generated, 'features/journey'), { recursive: true });
cpSync(path.join(root, 'src/types'), path.join(generated, 'types'), { recursive: true });
cpSync(
  path.join(root, 'src/features/journey/journey-calendar.ts'),
  path.join(generated, 'features/journey/journey-calendar.ts'),
);
cpSync(
  path.join(root, 'src/features/journey/journey-day-session.types.ts'),
  path.join(generated, 'features/journey/journey-day-session.types.ts'),
);
