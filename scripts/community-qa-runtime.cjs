/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const { initializeApp, deleteApp } = require('firebase/app');
const authSdk = require('firebase/auth');
const firestoreSdk = require('firebase/firestore');
const { getFunctions, httpsCallable } = require('firebase/functions');
const ts = require('typescript');
const data = require('./community-qa-data.cjs');

const root = path.resolve(__dirname, '..');
const functionsRequire = createRequire(
	path.join(root, 'functions/package.json'),
);
const digest = (value) =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');
const operationId = (key) => `community-qa-v1-${digest(key).slice(0, 40)}`;

// The repository owner explicitly identified this hosted project as non-production.
// There is deliberately no arbitrary-project or production override.
const approvedProjectId = 'faithful-4325a';
const readClientConfiguration = () => {
	const file = path.join(root, 'src/services/firebase/firebase.instance.ts');
	const source = ts.createSourceFile(
		file,
		fs.readFileSync(file, 'utf8'),
		ts.ScriptTarget.Latest,
		true,
	);
	const configuration = {};
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			if (
				declaration.name.getText(source) !== 'firebaseConfig' ||
				!declaration.initializer ||
				!ts.isObjectLiteralExpression(declaration.initializer)
			)
				continue;
			for (const property of declaration.initializer.properties) {
				if (
					!ts.isPropertyAssignment(property) ||
					!ts.isStringLiteral(property.initializer)
				)
					throw new Error(
						'Firebase client configuration is no longer a literal; review QA configuration.',
					);
				configuration[property.name.getText(source)] =
					property.initializer.text;
			}
		}
	}
	return configuration;
};

const validateEnvironment = (env, client) => {
	if (
		env.NODE_ENV === 'production' ||
		/^(prod|production)$/i.test(env.COMMUNITY_QA_ENVIRONMENT || '')
	)
		throw new Error('Production seeding is prohibited.');
	if (env.COMMUNITY_QA_ENVIRONMENT !== 'non-production')
		throw new Error(
			'Set COMMUNITY_QA_ENVIRONMENT=non-production for the owner-confirmed test project.',
		);
	if (
		env.GCLOUD_PROJECT !== approvedProjectId ||
		client.projectId !== approvedProjectId
	)
		throw new Error(
			'Only the owner-confirmed faithful-4325a test project is approved.',
		);
	if (
		[
			'FIREBASE_AUTH_EMULATOR_HOST',
			'FIRESTORE_EMULATOR_HOST',
			'FUNCTIONS_EMULATOR_HOST',
			'FIREBASE_EMULATOR_HUB',
			'FIREBASE_DATABASE_EMULATOR_HOST',
		].some((key) => env[key])
	)
		throw new Error(
			'Mixed emulator and hosted configuration is prohibited.',
		);
	if (!client.apiKey || !client.authDomain)
		throw new Error(
			'Existing Firebase client configuration is incomplete.',
		);
	if (!env.COMMUNITY_QA_PASSWORD || env.COMMUNITY_QA_PASSWORD.length < 8)
		throw new Error(
			'Set COMMUNITY_QA_PASSWORD to the shared password supplied by the task owner (at least eight characters).',
		);
	return {
		projectId: approvedProjectId,
		region: 'us-central1',
		classification: 'non-production',
	};
};

const safeCode = (value) =>
	typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_./-]{0,90}$/.test(value)
		? value
		: 'Unspecified';
const safeError = (error) => {
	// Never serialize raw SDK messages, requests, headers, response bodies, or stacks.
	const code = safeCode(error?.code || error?.name);
	const reason = safeCode(error?.details?.reason);
	return { code, reason, message: reason !== 'Unspecified' ? reason : code };
};
const receipt = (result) => {
	const selected = {};
	for (const key of [
		'communityId',
		'postId',
		'replyId',
		'reportId',
		'revision',
		'communityJourneyEnrollmentId',
		'invitationId',
		'status',
		'outcome',
	]) {
		if (
			typeof result?.[key] === 'string' ||
			typeof result?.[key] === 'number'
		)
			selected[key] = result[key];
	}
	if (result?.community?.communityId)
		selected.community = { communityId: result.community.communityId };
	if (result?.communityJourney) {
		selected.communityJourney = {};
		for (const key of [
			'communityJourneyId',
			'communityId',
			'revision',
			'startDate',
			'timeZoneId',
			'status',
		])
			selected.communityJourney[key] = result.communityJourney[key];
	}
	return selected;
};

const newExecution = () => ({
	startedAt: new Date().toISOString(),
	accounts: {},
	communities: {},
	issues: [],
	checks: [],
	mutations: 0,
	reusedOperations: 0,
	requests: 0,
	deployedFunctions: [],
	status: 'Running',
});
const recordFailure = (
	execution,
	severity,
	account,
	operation,
	endpoint,
	error,
	impact,
) => {
	const issue = {
		severity,
		account,
		operation,
		endpoint,
		...safeError(error),
		impact,
		continued: severity !== 'blocking',
	};
	execution.issues.push(issue);
	console.log(
		`[${severity}] ${account || 'environment'}: ${operation} (${issue.code}; ${issue.reason})`,
	);
	return issue;
};

const loadState = (directory, projectId) => {
	fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
	const file = path.join(directory, 'checkpoint.json');
	const planDigest = digest({
		accounts: data.accounts,
		communities: data.communities,
		posts: data.posts,
		replies: data.replies,
	});
	const state = fs.existsSync(file)
		? JSON.parse(fs.readFileSync(file, 'utf8'))
		: {
				schemaVersion: 1,
				projectId,
				planDigest,
				accounts: {},
				operations: {},
				scheduleStartDate: new Date(Date.now() + 14 * 86400000)
					.toISOString()
					.slice(0, 10),
				history: [],
			};
	if (
		state.schemaVersion !== 1 ||
		state.projectId !== projectId ||
		state.planDigest !== planDigest
	)
		throw new Error(
			'Checkpoint project or dataset differs. Review it; do not discard a checkpoint for existing QA data.',
		);
	const save = () => {
		fs.writeFileSync(`${file}.tmp`, JSON.stringify(state, null, 2) + '\n', {
			mode: 0o600,
		});
		fs.renameSync(`${file}.tmp`, file);
	};
	return { state, save };
};

const executeOnce = async (
	{ state, execution, save, run, call },
	key,
	number,
	endpoint,
	request,
) => {
	if (state.operations[key]) {
		execution.reusedOperations++;
		return state.operations[key];
	}
	const result = await run(number, key, endpoint, () =>
		call(number, endpoint, { ...request, operationId: operationId(key) }),
	);
	if (result) {
		state.operations[key] = receipt(result);
		execution.mutations++;
		save();
	}
	return result;
};

const getCredential = () => {
	const { applicationDefault } = functionsRequire('firebase-admin/app');
	const adcPath = path.join(
		require('node:os').homedir(),
		'.config/gcloud/application_default_credentials.json',
	);
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS || fs.existsSync(adcPath))
		return { credential: applicationDefault(), firestoreOptions: {} };
	const binary = fs.realpathSync(
		execFileSync('which', ['firebase'], { encoding: 'utf8' }).trim(),
	);
	const cliAuth = require(path.join(path.dirname(binary), '../auth.js'));
	const account = cliAuth.getProjectDefaultAccount(root);
	if (!account)
		throw new Error(
			'Use existing Application Default Credentials or sign in with the installed Firebase CLI.',
		);
	const cliApi = require(path.join(path.dirname(binary), '../api.js'));
	const credential = {
		getAccessToken: async () => {
			const token = await cliAuth.getAccessToken(
				account.tokens.refresh_token,
				[],
			);
			return {
				access_token: token.access_token,
				expires_in:
					Math.max(
						60,
						Math.floor((token.expires_at - Date.now()) / 1000),
					) || 3600,
			};
		},
	};
	// The installed Google Firestore client accepts the existing CLI OAuth identity.
	// Keep the authorized-user configuration in memory; never write a credential file.
	return {
		credential,
		firestoreOptions: {
			credentials: {
				type: 'authorized_user',
				client_id: cliApi.clientId(),
				client_secret: cliApi.clientSecret(),
				refresh_token: account.tokens.refresh_token,
			},
		},
	};
};

const createRuntime = async (configuration, execution, checkpoint) => {
	const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } =
		functionsRequire('firebase-admin/app');
	const { getAuth } = functionsRequire('firebase-admin/auth');
	const { Firestore } = functionsRequire('@google-cloud/firestore');
	const { credential, firestoreOptions } = getCredential();
	const admin = initializeAdmin(
		{ projectId: configuration.projectId, credential },
		'community-qa-admin',
	);
	const adminAuth = getAuth(admin);
	const database = new Firestore({
		projectId: configuration.projectId,
		...firestoreOptions,
	});
	const clients = new Map();
	const clientConfiguration = readClientConfiguration();
	const { state, save } = checkpoint;
	const run = async (
		number,
		operation,
		endpoint,
		action,
		severity = 'recoverable',
	) => {
		try {
			return await action();
		} catch (error) {
			recordFailure(
				execution,
				severity,
				number ? data.accounts[number - 1].email : null,
				operation,
				endpoint,
				error,
				'Dependent state may be missing; independent operations continue.',
			);
			return null;
		}
	};
	const call = async (number, endpoint, request = {}) => {
		const client = clients.get(number);
		if (
			!client ||
			!execution.accounts[number]?.provisioned ||
			client.auth.currentUser?.uid !== state.accounts[number]
		)
			throw Object.assign(new Error(), { code: 'QA/AccountUnavailable' });
		execution.requests++;
		return (
			await httpsCallable(client.functions, endpoint, { timeout: 45000 })(
				request,
			)
		).data;
	};
	const once = (...args) =>
		executeOnce({ state, execution, save, run, call }, ...args);
	return {
		configuration,
		execution,
		state,
		save,
		clients,
		database,
		adminAuth,
		call,
		once,
		run,
		preflight: async () => {
			const token = await credential.getAccessToken();
			const response = await fetch(
				`https://cloudfunctions.googleapis.com/v2/projects/${configuration.projectId}/locations/${configuration.region}/functions?pageSize=100`,
				{
					headers: { Authorization: `Bearer ${token.access_token}` },
					signal: AbortSignal.timeout(30000),
					redirect: 'error',
				},
			);
			if (!response.ok)
				throw Object.assign(new Error(), {
					code: `QA/FunctionInventoryHTTP${response.status}`,
				});
			const body = await response.json();
			execution.deployedFunctions = (body.functions || [])
				.filter((item) => item.state === 'ACTIVE')
				.map((item) => item.name.split('/').pop())
				.sort();
			if (body.nextPageToken)
				throw Object.assign(new Error(), {
					code: 'QA/FunctionInventoryTruncated',
				});
			for (const endpoint of [
				'createCommunity',
				'issueCommunityInvitation',
				'acceptCommunityInvitation',
				'getCommunityContext',
				'createCommunityPost',
				'listCommunityPosts',
			])
				if (!execution.deployedFunctions.includes(endpoint))
					throw Object.assign(new Error(), {
						code: 'QA/RequiredCallableMissing',
						details: { reason: endpoint },
					});
			await adminAuth
				.getUserByEmail(data.accounts[0].email)
				.catch((error) => {
					if (error.code !== 'auth/user-not-found') throw error;
				});
		},
		provision: async (account, verifyOnly) => {
			const app = initializeApp(
				clientConfiguration,
				`community-qa-${account.number}`,
			);
			const auth = authSdk.getAuth(app);
			const client = {
				app,
				auth,
				db: firestoreSdk.getFirestore(app),
				functions: getFunctions(app, configuration.region),
			};
			clients.set(account.number, client);
			let created = false;
			try {
				await authSdk.signInWithEmailAndPassword(
					auth,
					account.email,
					process.env.COMMUNITY_QA_PASSWORD,
				);
			} catch (error) {
				if (
					verifyOnly ||
					![
						'auth/user-not-found',
						'auth/invalid-credential',
					].includes(error.code)
				)
					throw error;
				await authSdk.createUserWithEmailAndPassword(
					auth,
					account.email,
					process.env.COMMUNITY_QA_PASSWORD,
				);
				created = true;
			}
			const user = await adminAuth.getUser(auth.currentUser.uid);
			if (
				user.email !== account.email ||
				user.disabled ||
				(state.accounts[account.number] &&
					state.accounts[account.number] !== user.uid)
			)
				throw Object.assign(new Error(), {
					code: 'QA/AccountIdentityMismatch',
				});
			state.accounts[account.number] = user.uid;
			save();
			if (!verifyOnly) {
				// Existing integration tests use Admin Auth for verified test identities.
				if (!user.emailVerified)
					await adminAuth.updateUser(user.uid, {
						emailVerified: true,
					});
				if (
					account.number === 5 &&
					user.customClaims?.communitySafetyReviewer !== true
				)
					await adminAuth.setCustomUserClaims(user.uid, {
						...user.customClaims,
						communitySafetyReviewer: true,
					});
				await authSdk.reload(auth.currentUser);
				await authSdk.getIdToken(auth.currentUser, true);
				const reference = firestoreSdk.doc(
					client.db,
					'users',
					user.uid,
				);
				await firestoreSdk.runTransaction(
					client.db,
					async (transaction) => {
						if ((await transaction.get(reference)).exists()) return;
						/** @type {import('firebase/firestore').WithFieldValue<import('../src/types/account/user.types').IUserProfileDocument>} */
						const profile = {
							schemaVersion: 1,
							revision: 0,
							preferredName: account.preferredName,
							createdAt: firestoreSdk.serverTimestamp(),
							updatedAt: firestoreSdk.serverTimestamp(),
						};
						transaction.set(reference, profile);
					},
				);
			}
			execution.accounts[account.number] = {
				provisioned: true,
				created,
				authenticated: true,
				userId: user.uid,
				verified: false,
			};
			return client;
		},
		pages: async (number, endpoint, request, field, idField) => {
			const items = [];
			const seenCursors = new Set();
			let cursor;
			let pages = 0;
			do {
				const result = await call(number, endpoint, {
					...request,
					pageSize: 20,
					...(cursor ? { cursor } : {}),
				});
				if (
					!Array.isArray(result[field]) ||
					(result.nextCursor !== null &&
						typeof result.nextCursor !== 'string')
				)
					throw Object.assign(new Error(), {
						code: 'QA/InvalidPage',
					});
				items.push(...result[field]);
				pages++;
				cursor = result.nextCursor;
				if (cursor && (seenCursors.has(cursor) || pages >= 20))
					throw Object.assign(new Error(), {
						code: 'QA/PaginationDidNotTerminate',
					});
				seenCursors.add(cursor);
			} while (cursor);
			if (
				idField &&
				new Set(items.map((item) => item[idField])).size !==
					items.length
			)
				throw Object.assign(new Error(), {
					code: 'QA/DuplicatePageItems',
				});
			return { items, pages };
		},
		close: async () => {
			for (const client of clients.values()) {
				await firestoreSdk.terminate(client.db);
				await deleteApp(client.app);
			}
			await database.terminate();
			await deleteAdmin(admin);
		},
	};
};

module.exports = {
	root,
	functionsRequire,
	digest,
	operationId,
	readClientConfiguration,
	validateEnvironment,
	safeError,
	receipt,
	newExecution,
	recordFailure,
	loadState,
	executeOnce,
	createRuntime,
};
