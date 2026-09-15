const assert = require('node:assert/strict');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const { initializeApp, getApps, deleteApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const progress = require('../functions/lib/src/community/community-progress');
const projectId = 'faithful-community-progress-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 15));
let database;
const deps = {
	get database() {
		return database;
	},
	now,
};
const scope = (communityId = 'alpha', communityJourneyId = 'j1') => ({
	communityId,
	communityJourneyId,
});
const set = (userId, individual, aggregate, operationId, ids = scope()) =>
	progress.setCommunityProgressSharingForAccount(
		userId,
		{
			...ids,
			shouldShareIndividualProgress: individual,
			shouldContributeToAggregateProgress: aggregate,
			operationId,
		},
		deps,
	);
const read = (userId = 'u0', ids = scope()) =>
	progress.getCommunityProgressSharingForAccount(userId, ids, deps);
const list = (ids = scope(), extra = {}) =>
	progress.listSharedCommunityProgressForAccount(
		'u0',
		{ ...ids, ...extra },
		deps,
	);
const aggregate = (ids = scope()) =>
	progress.getCommunityAggregateProgressForAccount('u0', ids, deps);
const fails = (reason) => (caught) => caught.details?.reason === reason;
const clear = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};
const seed = async () => {
	const batch = database.batch();
	for (const communityId of ['alpha', 'beta']) {
		const communityJourneyId = communityId === 'alpha' ? 'j1' : 'j2';
		batch.set(database.doc(`communities/${communityId}`), {
			organizerUserId: 'u0',
			lifecycle: { status: 'Active' },
			createdAt: now,
			updatedAt: now,
		});
		batch.set(
			database.doc(
				`communities/${communityId}/communityJourneys/${communityJourneyId}`,
			),
			{
				communityId,
				lifecycle: { status: 'Active', startedAt: now },
				createdAt: now,
				updatedAt: now,
			},
		);
		for (let index = 0; index < 6; index++) {
			const userId = `u${index}`;
			batch.set(database.doc(`users/${userId}`), {
				preferredName: `Participant ${index}`,
			});
			batch.set(
				database.doc(`communities/${communityId}/members/${userId}`),
				{
					communityId,
					userId,
					joinedAt: Timestamp.fromMillis(now.toMillis() + index),
					lifecycle: { status: 'Active' },
					role: index === 0 ? 'Organizer' : 'Member',
				},
			);
			batch.set(
				database.doc(
					`users/${userId}/communityJourneyEnrollments/${communityJourneyId}`,
				),
				{
					communityId,
					communityJourneyId,
					userId,
					lifecycle: {
						status: 'Started',
						journeyId: `${communityId}${userId}`,
						startedAt: now,
					},
				},
			);
			batch.set(
				database.doc(
					`users/${userId}/journeys/${communityId}${userId}`,
				),
				{
					userId,
					state: { status: 'Active' },
					startingMotivation: { text: 'PRIVATE WRITING' },
					initialOptionalPracticeIds: ['Movement'],
					startDate: '2026-09-15',
				},
			);
		}
	}
	await batch.commit();
};

before(async () => {
	if (!process.env.FIRESTORE_EMULATOR_HOST) return;
	const app = initializeApp({ projectId });
	database = getFirestore(app);
});
beforeEach(async () => {
	if (database) {
		await clear();
		await seed();
	}
});
after(async () => {
	for (const app of getApps()) await deleteApp(app);
});

test(
	'preferences default Private, toggle independently, scope to one community and reject changed retries',
	{ skip: !process.env.FIRESTORE_EMULATOR_HOST },
	async () => {
		assert.deepEqual(await read(), {
			...scope(),
			individualProgress: { status: 'Private' },
			aggregateProgress: { status: 'Private' },
		});
		const first = await set('u0', true, false, 'choice1');
		assert.equal(first.individualProgress.status, 'Shared');
		assert.equal(first.aggregateProgress.status, 'Private');
		assert.equal(
			first.individualProgress.consentedAt.toMillis(),
			now.toMillis(),
		);
		assert.equal(
			(await read('u0', scope('beta', 'j2'))).individualProgress.status,
			'Private',
		);
		await set('u0', false, true, 'choice2');
		assert.equal((await read()).individualProgress.status, 'Private');
		assert.equal((await read()).aggregateProgress.status, 'Shared');
		assert.equal(
			(await set('u0', true, false, 'choice1')).individualProgress.status,
			'Private',
		);
		await assert.rejects(
			set('u0', false, false, 'choice1'),
			fails('OperationPayloadMismatch'),
		);
	},
);

test(
	'individual reader excludes opted-out roster and private fields, follows every stored lifecycle and revocation',
	{ skip: !process.env.FIRESTORE_EMULATOR_HOST },
	async () => {
		for (let index = 0; index < 6; index++)
			await set(`u${index}`, true, false, `share${index}`);
		let page = await list(scope(), { pageSize: 3 });
		assert.equal(page.progress.length, 3);
		assert.ok(page.nextCursor);
		const next = await list(scope(), {
			pageSize: 3,
			cursor: page.nextCursor,
		});
		assert.equal(next.progress.length, 3);
		await assert.rejects(
			list(scope('beta', 'j2'), { cursor: page.nextCursor }),
			fails('InvalidCursor'),
		);
		await database
			.doc('users/u1/journeys/alphau1')
			.update({ state: { status: 'Completed', completedAt: now } });
		await database.doc('users/u2/journeys/alphau2').update({
			state: {
				status: 'EndedEarly',
				endedAt: now,
				endedOn: '2026-09-15',
				lastReachedDayNumber: 1,
			},
		});
		page = await list(scope(), { pageSize: 6 });
		assert.deepEqual(
			page.progress.map((item) => item.journeyStage).slice(0, 3),
			['Active', 'Completed', 'EndedEarly'],
		);
		assert.equal(JSON.stringify(page).includes('PRIVATE WRITING'), false);
		for (const forbidden of [
			'journeyId',
			'startDate',
			'initialOptionalPracticeIds',
			'lastReachedDayNumber',
		])
			assert.equal(JSON.stringify(page).includes(forbidden), false);
		await set('u1', false, false, 'revoke1');
		assert.equal(
			(await list(scope(), { pageSize: 6 })).progress.some(
				(item) => item.participant.userId === 'u1',
			),
			false,
		);
		await database
			.doc('communities/alpha/members/u2')
			.update({ lifecycle: { status: 'Removed', removedAt: now } });
		assert.equal(
			(await list(scope(), { pageSize: 6 })).progress.some(
				(item) => item.participant.userId === 'u2',
			),
			false,
		);
		await database.doc('users/u3/communityJourneyEnrollments/j1').delete();
		assert.equal(
			(await list(scope(), { pageSize: 6 })).progress.some(
				(item) => item.participant.userId === 'u3',
			),
			false,
		);
		await database
			.doc('communities/alpha')
			.update({ lifecycle: { status: 'Closed', closedAt: now } });
		await assert.rejects(list(), fails('CommunityClosed'));
	},
);

test(
	'aggregate suppresses nonconsent, missing links and small cells; zero is distinct from suppressed',
	{ skip: !process.env.FIRESTORE_EMULATOR_HOST },
	async () => {
		for (let index = 0; index < 5; index++)
			await set(`u${index}`, false, true, `aggregate${index}`);
		assert.deepEqual((await aggregate()).status, 'Suppressed');
		assert.equal((await aggregate()).progress, null);
		await set('u5', false, true, 'aggregate5');
		let result = await aggregate();
		assert.equal(result.status, 'Available');
		assert.equal(result.progress.activeJourneyCount, 6);
		assert.equal(result.progress.completedJourneyCount, 0);
		await database
			.doc('users/u5/journeys/alphau5')
			.update({ state: { status: 'Completed', completedAt: now } });
		assert.equal((await aggregate()).status, 'Suppressed');
		for (let index = 0; index < 5; index++)
			await database
				.doc(`users/u${index}/journeys/alphau${index}`)
				.update({ state: { status: 'Completed', completedAt: now } });
		result = await aggregate();
		assert.equal(result.status, 'Available');
		assert.equal(result.progress.completedJourneyCount, 6);
		await database.doc('users/u5/communityJourneyEnrollments/j1').delete();
		assert.equal((await aggregate()).status, 'Suppressed');
	},
);

test(
	'revocation and removal win over recomputation; forged stale projection is ignored',
	{ skip: !process.env.FIRESTORE_EMULATOR_HOST },
	async () => {
		for (let index = 0; index < 6; index++)
			await set(`u${index}`, true, true, `all${index}`);
		await Promise.allSettled([list(), set('u1', false, false, 'revoke')]);
		await database
			.doc('communities/alpha/communityJourneys/j1/progress/u1')
			.set({
				journeyStage: 'Active',
				participant: { userId: 'u1' },
				calculatedAt: now,
			});
		assert.equal(
			(await list(scope(), { pageSize: 6 })).progress.some(
				(item) => item.participant.userId === 'u1',
			),
			false,
		);
		assert.equal((await aggregate()).status, 'Suppressed');
		await database
			.doc('communities/alpha/members/u0')
			.update({ lifecycle: { status: 'Left', leftAt: now } });
		await assert.rejects(list(), fails('CommunityUnavailable'));
	},
);
