const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const configPath = path.join(root, '.firebase.ticket40.json');
const secretPath = path.join(root, 'functions', '.secret.local');
const debugLogPath = path.join(root, 'firestore-debug.log');
const hadDebugLog = fs.existsSync(debugLogPath);
const projectId = 'demo-faithful-ticket40';
if (fs.existsSync(configPath) || fs.existsSync(secretPath)) {
	throw new Error(
		'Refusing to overwrite an existing emulator configuration or secret override.',
	);
}

const config = {
	firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
	functions: { source: 'functions' },
	emulators: {
		auth: { host: '127.0.0.1', port: 9099 },
		firestore: { host: '127.0.0.1', port: 8080 },
		functions: { host: '127.0.0.1', port: 5001 },
		hub: { host: '127.0.0.1', port: 4400 },
		logging: { host: '127.0.0.1', port: 4500 },
		ui: { enabled: false },
	},
};
const syntheticKey = Buffer.alloc(32, 40).toString('base64');
const syntheticSecret = JSON.stringify({
	activeVersion: 'ticket40',
	keys: { ticket40: syntheticKey },
});
const existingSuite = process.argv[2] === 'existing';
if (process.argv.length > 3 || (process.argv[2] && !existingSuite)) {
	throw new Error(
		'Only the optional "existing" emulator suite is supported.',
	);
}
const testCommand = existingSuite
	? `node --test --test-concurrency=1 ${fs
			.readdirSync(__dirname)
			.filter(
				(name) =>
					/^community-.*\.emulator\.test\.cjs$/.test(name) &&
					name !== 'community-workflow.ticket40.emulator.test.cjs',
			)
			.map((name) => `tests/${name}`)
			.join(' ')}`
	: 'node --test tests/community-workflow.ticket40.emulator.test.cjs';
let exitCode = 1;
let createdConfig = false;
let createdSecret = false;
try {
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, {
		flag: 'wx',
	});
	createdConfig = true;
	fs.writeFileSync(
		secretPath,
		`COMMUNITY_INVITATION_ENCRYPTION_KEYS=${syntheticSecret}\n`,
		{ flag: 'wx' },
	);
	createdSecret = true;
	const result = spawnSync(
		'firebase',
		[
			'emulators:exec',
			'--config',
			configPath,
			'--project',
			projectId,
			'--only',
			'auth,firestore,functions',
			testCommand,
		],
		{
			cwd: root,
			env: {
				...process.env,
				GCLOUD_PROJECT: projectId,
				FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5001',
				FIREBASE_EMULATOR_HUB_DISCOVERY_TIMEOUT: '60000',
			},
			stdio: 'inherit',
		},
	);
	if (result.error) throw result.error;
	exitCode = result.status ?? 1;
} finally {
	if (createdSecret) fs.rmSync(secretPath, { force: true });
	if (createdConfig) fs.rmSync(configPath, { force: true });
	if (!hadDebugLog) fs.rmSync(debugLogPath, { force: true });
}
process.exitCode = exitCode;
