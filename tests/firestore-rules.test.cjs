const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Uses the installed Firebase CLI and its existing login; no account data is written.
const cliRoot = path.join(
	execFileSync('npm', ['root', '--global'], { encoding: 'utf8' }).trim(),
	'firebase-tools',
	'lib',
);
const auth = require(`${cliRoot}/auth.js`);
const { requireAuth } = require(`${cliRoot}/requireAuth.js`);
const { Client } = require(`${cliRoot}/apiv2.js`);
const project = JSON.parse(fs.readFileSync('.firebaserc', 'utf8')).projects
	.default;
const options = { project };
auth.setActiveAccount(options, auth.getProjectDefaultAccount(process.cwd()));
const tests = [];
const add = (
	name,
	expectation,
	method,
	path,
	uid = 'owner',
	verified = true,
	profileExists = true,
	document,
) => {
	tests.push({
		name,
		test: {
			expectation,
			request: {
				path: `/databases/(default)/documents/${path}`,
				method,
				auth: uid ? { uid, token: { email_verified: verified } } : null,
				...(document ? { resource: { data: document } } : {}),
			},
			functionMocks: [
				{
					function: 'exists',
					args: [{ anyValue: {} }],
					result: { value: profileExists },
				},
			],
		},
	});
};
// Profile creation is available before verification; other accounts cannot access it.
const profileTime = '2023-11-14T22:13:20Z';
const profile = {
	schemaVersion: 1,
	revision: 0,
	preferredName: 'Reader',
	createdAt: profileTime,
	updatedAt: profileTime,
};
const addProfile = (
	name,
	expectation,
	method,
	data = profile,
	uid = 'owner',
	verified = false,
) => {
	add(name, expectation, method, 'users/owner', uid, verified, true, data);
	tests.at(-1).test.request.time = profileTime;
};
for (const verified of [false, true]) {
	addProfile(
		`owner profile read verified=${verified}`,
		'ALLOW',
		'get',
		undefined,
		'owner',
		verified,
	);
	addProfile(
		`owner profile create verified=${verified}`,
		'ALLOW',
		'create',
		profile,
		'owner',
		verified,
	);
}
addProfile('optional preferred name', 'ALLOW', 'create', {
	...profile,
	preferredName: null,
});
addProfile('80 character preferred name', 'ALLOW', 'create', {
	...profile,
	preferredName: 'x'.repeat(80),
});
for (const uid of [null, 'other']) {
	for (const method of ['get', 'list', 'create', 'update', 'delete']) {
		addProfile(
			`${uid ?? 'anonymous'} profile ${method}`,
			'DENY',
			method,
			profile,
			uid,
		);
	}
}
for (const method of ['list', 'update', 'delete']) {
	addProfile(`owner profile ${method}`, 'DENY', method);
}
for (const patch of [
	{ preferredName: 'x'.repeat(81) },
	{ preferredName: 123 },
	{ schemaVersion: 2 },
	{ revision: 1 },
	{ revision: -1 },
	{ email: 'private@example.com' },
	{ accountType: 'admin' },
	{ createdAt: '2020-01-01T00:00:00Z' },
	{ updatedAt: '2020-01-01T00:00:00Z' },
]) {
	addProfile(`invalid profile ${JSON.stringify(patch)}`, 'DENY', 'create', {
		...profile,
		...patch,
	});
}
for (const key of Object.keys(profile)) {
	const incomplete = { ...profile };
	delete incomplete[key];
	addProfile(`profile missing ${key}`, 'DENY', 'create', incomplete);
}
for (const path of [
	'users/owner/journeyControl/current',
	'users/owner/journeyStartOperations/operation1',
]) {
	for (const method of ['get', 'create', 'update', 'delete']) {
		add(
			`client cannot ${method} start authority ${path}`,
			'DENY',
			method,
			path,
			'owner',
			true,
			true,
			{ journeyId: 'forged' },
		);
	}
}
const draft = 'users/owner/journeySetupDrafts/current';
const device = 'users/owner/devicePreferences/12345678901234567890';
const journey = 'users/owner/journeys/current';
for (const method of ['get', 'list']) {
	add(`owner journey ${method}`, 'ALLOW', method, journey);
	add(`other account journey ${method}`, 'DENY', method, journey, 'other');
	add(`anonymous journey ${method}`, 'DENY', method, journey, null);
	add(
		`unverified journey ${method}`,
		'DENY',
		method,
		journey,
		'owner',
		false,
	);
}
for (const method of ['create', 'update', 'delete']) {
	add(
		`owner journey ${method}`,
		'DENY',
		method,
		journey,
		'owner',
		true,
		true,
		{
			userId: 'owner',
			state: { status: 'Active' },
		},
	);
}
add(
	'journey subcollections remain private',
	'DENY',
	'get',
	`${journey}/days/1`,
);
for (const path of [
	draft,
	device,
	`${draft}/writingRevisions/12345678901234567890`,
]) {
	add(`owner get missing ${path}`, 'ALLOW', 'get', path);
	add(`other account get ${path}`, 'DENY', 'get', path, 'other');
	add(`anonymous get ${path}`, 'DENY', 'get', path, null);
	add(`unverified get ${path}`, 'DENY', 'get', path, 'owner', false);
	add(`orphan get ${path}`, 'DENY', 'get', path, 'owner', true, false);
	for (const method of ['create', 'update', 'delete'])
		add(
			`other account ${method} ${path}`,
			'DENY',
			method,
			path,
			'other',
			true,
			true,
			{
				userId: 'other',
			},
		);
	add(`owner delete ${path}`, 'DENY', 'delete', path);
	add(
		`missing fields create ${path}`,
		'DENY',
		'create',
		path,
		'owner',
		true,
		true,
		{
			userId: 'owner',
		},
	);
}
add('list setup drafts', 'DENY', 'list', 'users/owner/journeySetupDrafts');
add(
	'alternate draft',
	'DENY',
	'get',
	'users/owner/journeySetupDrafts/alternate',
);
add(
	'invalid device id',
	'DENY',
	'get',
	'users/owner/devicePreferences/invalid',
);
const testTimestamp = '2023-11-14T22:13:20Z';
const newDraft = {
	schemaVersion: 1,
	userId: 'owner',
	revision: 0,
	currentStep: 'Practices',
	choices: {
		readiness: 'Incomplete',
		optionalPracticeIds: [],
		bibleVersionId: null,
	},
	startingMotivation: null,
	createdAt: testTimestamp,
	updatedAt: testTimestamp,
};
add(
	'first setup create',
	'ALLOW',
	'create',
	draft,
	'owner',
	true,
	true,
	newDraft,
);
tests.at(-1).test.request.time = testTimestamp;

const addWrite = (
	name,
	expectation,
	path,
	document,
	previousDocument,
	mocks,
) => {
	add(
		name,
		expectation,
		previousDocument ? 'update' : 'create',
		path,
		'owner',
		true,
		true,
		document,
	);
	const test = tests.at(-1).test;
	test.request.time = testTimestamp;
	if (previousDocument) test.resource = { data: previousDocument };
	if (mocks) test.functionMocks = mocks;
};
const updatedProfile = {
	...profile,
	revision: 1,
	preferredName: 'New name',
	updatedAt: testTimestamp,
};
for (const preferredName of ['New name', null, 'x'.repeat(80)]) {
	addWrite(
		'owner updates preferred name ' + JSON.stringify(preferredName),
		'ALLOW',
		'users/owner',
		{ ...updatedProfile, preferredName },
		profile,
	);
}
for (const patch of [
	{ preferredName: 'x'.repeat(81) },
	{ preferredName: 123 },
	{ revision: 0 },
	{ revision: 2 },
	{ revision: 1.5 },
	{ createdAt: '2020-01-01T00:00:00Z' },
	{ updatedAt: '2020-01-01T00:00:00Z' },
	{ schemaVersion: 2 },
	{ email: 'private@example.com' },
]) {
	addWrite(
		'reject invalid profile update ' + JSON.stringify(patch),
		'DENY',
		'users/owner',
		{ ...updatedProfile, ...patch },
		profile,
	);
}
for (const uid of [null, 'other']) {
	addWrite(
		'reject unauthorized valid profile update ' + uid,
		'DENY',
		'users/owner',
		updatedProfile,
		profile,
	);
	tests.at(-1).test.request.auth = uid
		? { uid, token: { email_verified: true } }
		: null;
}
const readyDraft = {
	...newDraft,
	currentStep: 'WeeklyThemes',
	choices: {
		readiness: 'ReadyForReview',
		optionalPracticeIds: ['Movement', 'Gratitude', 'Worship', 'Generosity'],
		bibleVersionId: 'Web',
	},
};
for (const bibleVersionId of ['Amp', 'Gnt']) {
	addWrite(`${bibleVersionId} translation create`, 'ALLOW', draft, {
		...readyDraft,
		choices: { ...readyDraft.choices, bibleVersionId },
	});
}
addWrite('four practices create', 'ALLOW', draft, readyDraft);
addWrite('three practices create', 'ALLOW', draft, {
	...readyDraft,
	choices: {
		...readyDraft.choices,
		optionalPracticeIds: ['Movement', 'Gratitude', 'Worship'],
	},
});
const previousDraft = {
	...readyDraft,
	createdAt: '2023-11-13T22:13:20Z',
	updatedAt: '2023-11-13T22:13:20Z',
};
const updatedDraft = {
	...readyDraft,
	revision: 1,
	createdAt: previousDraft.createdAt,
};
addWrite('four practices update', 'ALLOW', draft, updatedDraft, previousDraft);
const invalidDrafts = [
	[
		'duplicate practices',
		{
			choices: {
				...readyDraft.choices,
				optionalPracticeIds: ['Movement', 'Movement'],
			},
		},
	],
	[
		'five practices',
		{
			choices: {
				...readyDraft.choices,
				optionalPracticeIds: [
					'Movement',
					'Gratitude',
					'Worship',
					'Generosity',
					'ChristianReading',
				],
			},
		},
	],
	[
		'unknown practice',
		{
			choices: {
				...readyDraft.choices,
				optionalPracticeIds: ['Movement', 'Unknown'],
			},
		},
	],
	[
		'wrong readiness',
		{ choices: { ...readyDraft.choices, readiness: 'Incomplete' } },
	],
	[
		'ready with no translation',
		{ choices: { ...readyDraft.choices, bibleVersionId: null } },
	],
	[
		'unknown translation',
		{ choices: { ...readyDraft.choices, bibleVersionId: 'Unknown' } },
	],
	[
		'removed translation',
		{ choices: { ...readyDraft.choices, bibleVersionId: 'Esv' } },
	],
	['extra choice field', { choices: { ...readyDraft.choices, extra: true } }],
	['spoofed owner', { userId: 'other' }],
	['polluted schema', { extra: true }],
	['negative revision', { revision: -1 }],
	['overflow revision', { revision: 2147483647 }],
	['invalid step', { currentStep: 'Unknown' }],
	['wrong timestamp', { updatedAt: '2023-11-13T22:13:20Z' }],
	[
		'oversized motivation',
		{
			startingMotivation: {
				revisionId: '12345678901234567890',
				text: 'x'.repeat(10001),
				updatedAt: testTimestamp,
			},
		},
	],
];
for (const [name, patch] of invalidDrafts) {
	addWrite(`${name} create`, 'DENY', draft, { ...readyDraft, ...patch });
	addWrite(
		`${name} update`,
		'DENY',
		draft,
		{ ...updatedDraft, ...patch },
		previousDraft,
	);
}
addWrite(
	'revision replay',
	'DENY',
	draft,
	{ ...updatedDraft, revision: 0 },
	previousDraft,
);
addWrite(
	'createdAt changed',
	'DENY',
	draft,
	{ ...updatedDraft, createdAt: testTimestamp },
	previousDraft,
);
const preferences = {
	schemaVersion: 1,
	userId: 'owner',
	revision: 0,
	morningReminder: { isEnabled: true, localTime: '07:00' },
	eveningReflectionReminder: { isEnabled: false, localTime: '20:00' },
	createdAt: testTimestamp,
	updatedAt: testTimestamp,
};
addWrite('first device preferences', 'ALLOW', device, preferences);
addWrite(
	'device preferences update',
	'ALLOW',
	device,
	{
		...preferences,
		revision: 1,
		morningReminder: { isEnabled: false, localTime: '07:00' },
	},
	preferences,
);
for (const reminder of [
	{ isEnabled: true, localTime: null },
	{ isEnabled: true, localTime: '24:00' },
	{ isEnabled: true, localTime: '07:60' },
	{ isEnabled: 'true', localTime: '07:00' },
	{ isEnabled: true, localTime: '07:00', extra: true },
]) {
	addWrite(`invalid reminder ${JSON.stringify(reminder)}`, 'DENY', device, {
		...preferences,
		morningReminder: reminder,
	});
}
const revisionId = '12345678901234567890';
const writingPath = `${draft}/writingRevisions/${revisionId}`;
const writing = {
	userId: 'owner',
	target: { kind: 'SetupMotivation', setupDraftId: 'current' },
	baseRevisionId: null,
	text: 'Spend time with Jesus.',
	origin: {
		operationId: revisionId,
		deviceId: '12345678901234567890',
		recordedOnDeviceAt: testTimestamp,
	},
	savedAt: testTimestamp,
};
const head = { revisionId, text: writing.text, updatedAt: testTimestamp };
const mock = (name, result, exactPath) => ({
	function: name,
	args: [
		exactPath
			? { exactValue: `/databases/%28default%29/documents/${exactPath}` }
			: { anyValue: {} },
	],
	result: { value: result },
});
const profileMock = mock('exists', true, 'users/owner');
const draftMocks = [
	profileMock,
	mock('exists', false, writingPath),
	mock('getAfter', { data: writing }),
];
addWrite(
	'create draft with writing revision',
	'ALLOW',
	draft,
	{ ...readyDraft, startingMotivation: head },
	null,
	draftMocks,
);
const writingMocks = [
	profileMock,
	mock('exists', false, draft),
	mock('getAfter', { data: { ...readyDraft, startingMotivation: head } }),
];
addWrite(
	'create linked writing revision',
	'ALLOW',
	writingPath,
	writing,
	null,
	writingMocks,
);
addWrite(
	'reject unlinked writing text',
	'DENY',
	writingPath,
	{ ...writing, text: 'Different text' },
	null,
	writingMocks,
);
addWrite(
	'reject writing target outside setup',
	'DENY',
	writingPath,
	{ ...writing, target: { kind: 'SetupMotivation', setupDraftId: 'other' } },
	null,
	writingMocks,
);
addWrite(
	'reject replacing head without revision',
	'DENY',
	draft,
	{ ...readyDraft, startingMotivation: head },
	null,
	[profileMock, mock('exists', false, writingPath)],
);
const existingHead = {
	revisionId: '00000000000000000001',
	text: 'Previous motivation',
	updatedAt: '2023-11-13T22:13:20Z',
};
const tombstoneWriting = {
	...writing,
	baseRevisionId: existingHead.revisionId,
	text: null,
};
const tombstoneDraft = {
	...updatedDraft,
	startingMotivation: { ...head, text: null },
};
addWrite(
	'clear motivation with linked tombstone',
	'ALLOW',
	draft,
	tombstoneDraft,
	{ ...previousDraft, startingMotivation: existingHead },
	[
		profileMock,
		mock('exists', false, writingPath),
		mock('getAfter', { data: tombstoneWriting }),
	],
);
addWrite(
	'create tombstone revision',
	'ALLOW',
	writingPath,
	tombstoneWriting,
	null,
	[
		profileMock,
		mock('exists', true, draft),
		mock('get', {
			data: { ...previousDraft, startingMotivation: existingHead },
		}),
		mock('getAfter', { data: tombstoneDraft }),
	],
);
addWrite(
	'reject clearing head without tombstone',
	'DENY',
	draft,
	{ ...updatedDraft, startingMotivation: null },
	{ ...previousDraft, startingMotivation: existingHead },
);
addWrite(
	'reject rewriting immutable motivation revision',
	'DENY',
	writingPath,
	{ ...writing, text: 'Changed' },
	writing,
);
(async () => {
	await requireAuth(options);
	const client = new Client({
		urlPrefix: 'https://firebaserules.googleapis.com',
		apiVersion: 'v1',
	});
	const result = await client.post(
		`/projects/${project}:test`,
		{
			source: {
				files: [
					{
						name: 'firestore.rules',
						content: fs.readFileSync('firestore.rules', 'utf8'),
					},
				],
			},
			testSuite: { testCases: tests.map(({ test }) => test) },
		},
		{ skipLog: { body: true, resBody: true } },
	);
	for (const [index, testResult] of (result.body.testResults || []).entries())
		console.log(
			tests[index].name,
			testResult.state,
			testResult.state === 'SUCCESS' ? '' : JSON.stringify(testResult),
		);
	if (result.body.issues) console.log(JSON.stringify(result.body.issues));
	console.log(
		`${result.body.testResults?.filter((result) => result.state === 'SUCCESS').length ?? 0}/${tests.length} rules tests passed.`,
	);
	if (
		!result.body.testResults?.length ||
		result.body.testResults.some((result) => result.state !== 'SUCCESS')
	)
		process.exitCode = 1;
})().catch((error) => {
	console.error(error.message, JSON.stringify(error.context?.body));
	process.exitCode = 1;
});
