const assert = require('node:assert/strict');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { deleteApp, getApps, initializeApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getAuth } = require(
	require.resolve('firebase-admin/auth', {
		paths: [path.join(__dirname, '../functions')],
	}),
);

const projectId = 'demo-faithful-safety-review';
let database;
const tokens = [];
const restrictedPaths = [
	'communitySafetyReports/report-1',
	'communityModerationActions/action-1',
	'users/owner/communitySafetyClaimOperations/claim-1',
	'users/owner/communitySafetyReviewOperations/review-1',
];
const firestoreUrl = (documentPath) =>
	`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`;
const clientRequest = (documentPath, method, token) =>
	fetch(firestoreUrl(documentPath), {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		...(method === 'PATCH'
			? {
					body: JSON.stringify({
						fields: {
							sample: { stringValue: 'Changed' },
						},
					}),
				}
			: {}),
	});

before(async () => {
	assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
	assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
	initializeApp({ projectId });
	database = getFirestore();
	const signup = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'member@example.test',
				password: 'local-test-password',
				returnSecureToken: true,
			}),
		},
	);
	if (!signup.ok)
		throw new Error(`Auth emulator signup failed: ${await signup.text()}`);
	const memberSignup = await signup.json();
	tokens.push(memberSignup.idToken);
	const reviewerSignup = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'reviewer@example.test',
				password: 'local-test-password',
				returnSecureToken: true,
			}),
		},
	);
	if (!reviewerSignup.ok)
		throw new Error(
			`Reviewer signup failed: ${await reviewerSignup.text()}`,
		);
	const reviewer = await reviewerSignup.json();
	await getAuth().setCustomUserClaims(reviewer.localId, {
		communitySafetyReviewer: true,
	});
	const reviewerLogin = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'reviewer@example.test',
				password: 'local-test-password',
				returnSecureToken: true,
			}),
		},
	);
	if (!reviewerLogin.ok)
		throw new Error(`Reviewer login failed: ${await reviewerLogin.text()}`);
	tokens.push((await reviewerLogin.json()).idToken);
	for (const documentPath of restrictedPaths)
		await database.doc(documentPath).set({ sample: 'Original' });
});
after(async () => Promise.all(getApps().map(deleteApp)));

test('client Auth token cannot read or write restricted review records', async () => {
	for (const token of tokens)
		for (const documentPath of restrictedPaths) {
			const read = await clientRequest(documentPath, 'GET', token);
			assert.equal(
				read.status,
				403,
				`${documentPath} GET: ${await read.text()}`,
			);
			const update = await clientRequest(documentPath, 'PATCH', token);
			assert.equal(
				update.status,
				403,
				`${documentPath} PATCH: ${await update.text()}`,
			);
			assert.equal(
				(await database.doc(documentPath).get()).get('sample'),
				'Original',
			);
		}
});
