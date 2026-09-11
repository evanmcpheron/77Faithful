const { cpSync, mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const generated = path.join(root, 'functions/generated');
rmSync(generated, { recursive: true, force: true });
mkdirSync(path.join(generated, 'features/journey'), { recursive: true });
mkdirSync(path.join(generated, 'features/settings'), { recursive: true });
cpSync(
	path.join(root, 'src/features/settings/practice-settings.types.ts'),
	path.join(generated, 'features/settings/practice-settings.types.ts'),
);
cpSync(path.join(root, 'src/types'), path.join(generated, 'types'), {
	recursive: true,
	filter: (source) => !source.endsWith('.md') && !source.endsWith('.txt'),
});
cpSync(
	path.join(root, 'src/features/journey/journey-calendar.ts'),
	path.join(generated, 'features/journey/journey-calendar.ts'),
);
cpSync(
	path.join(root, 'src/features/journey/journey-day-session.types.ts'),
	path.join(generated, 'features/journey/journey-day-session.types.ts'),
);
cpSync(
	path.join(root, 'src/features/journey/reflections.types.ts'),
	path.join(generated, 'features/journey/reflections.types.ts'),
);
