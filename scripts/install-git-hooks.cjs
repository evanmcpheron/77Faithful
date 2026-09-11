/* eslint-env node */

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const repositoryRoot = resolve(__dirname, '..');

if (!process.env.CI && existsSync(join(repositoryRoot, '.git'))) {
	const result = spawnSync(
		'git',
		['config', '--local', 'core.hooksPath', '.githooks'],
		{ cwd: repositoryRoot, stdio: 'inherit' },
	);

	if (result.error) {
		throw result.error;
	}

	process.exitCode = result.status ?? 1;
}
