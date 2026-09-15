const assert = require('node:assert/strict');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const { deleteApp, getApps, initializeApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const review = require('../functions/lib/src/community/community-safety-review');
const safety = require('../functions/lib/src/community/community-safety');
const posts = require('../functions/lib/src/community/community-post');
const readers = require('../functions/lib/src/community/read-community-context');
const invitations = require('../functions/lib/src/community/community-invitation');
const redemptions = require('../functions/lib/src/community/community-invitation-redemption');
const {
	parseCommunityInvitationEncryptionConfiguration,
} = require('../functions/lib/src/community/community-invitation-crypto');

const projectId = 'faithful-community-safety-review-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 12));
let database;
const users = new Map();
const authentication = {
	getUser: async (userId) => {
		const user = users.get(userId);
		if (!user) throw new Error('missing auth user');
		return user;
	},
};
const authUser = (userId, claim = false) =>
	users.set(userId, {
		uid: userId,
		disabled: false,
		emailVerified: true,
		customClaims: { communitySafetyReviewer: claim },
	});
const account = async (userId) =>
	database.doc(`users/${userId}`).set({
		schemaVersion: 1,
		revision: 0,
		preferredName: userId,
		createdAt: now,
		updatedAt: now,
	});
const member = async (userId, role = 'Member') => {
	const value = {
		schemaVersion: 1,
		communityId: 'alpha',
		userId,
		role,
		joinedAt: now,
		lifecycle: { status: 'Active' },
		createdAt: now,
		updatedAt: now,
	};
	await Promise.all([
		database.doc(`communities/alpha/members/${userId}`).set(value),
		database.doc(`users/${userId}/communityMemberships/alpha`).set(value),
	]);
};
const seed = async () => {
	for (const userId of [
		'owner',
		'reporter',
		'target',
		'reviewer-a',
		'reviewer-b',
	]) {
		await account(userId);
		authUser(userId, userId.startsWith('reviewer-'));
	}
	await database.doc('communities/alpha').set({
		schemaVersion: 1,
		name: 'Community',
		purpose: 'Purpose',
		organizerUserId: 'owner',
		settings: {},
		lifecycle: { status: 'Active' },
		activeInvitationId: null,
		revision: 0,
		createdAt: now,
		updatedAt: now,
	});
	await Promise.all([
		member('owner', 'Organizer'),
		member('reporter'),
		member('target'),
	]);
};
const createPost = async () =>
	posts.createCommunityPostForAccount(
		'target',
		{
			communityId: 'alpha',
			content: { postType: 'Discussion', text: 'Original words' },
			operationId: `post-${Math.random().toString(36).slice(2)}`,
		},
		{ database, now },
	);
const report = async (target, operationId) =>
	safety.reportCommunityContentForAccount(
		'reporter',
		{
			communityId: 'alpha',
			target,
			reason: 'Harassment',
			explanation: 'Please review.',
			operationId,
		},
		database,
		now,
	);
const decision = (reportId, requestedAction, operationId, extras = {}) => ({
	reportId,
	expectedRevision: 0,
	expectedTargetRevision: 0,
	requestedAction,
	explanation: 'Reviewed the submitted evidence.',
	operationId,
	...extras,
});
const denied = (promise, reason) =>
	assert.rejects(promise, (error) => error.details?.reason === reason);

before(() => {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'Run with the Firestore emulator.',
	);
	initializeApp({ projectId });
	database = getFirestore();
});
beforeEach(async () => {
	users.clear();
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true);
	await seed();
});
after(async () => Promise.all(getApps().map(deleteApp)));

test('submitted report reaches a bounded queue and detail; organizer and members cannot review', async () => {
	const post = await createPost();
	const submitted = await report(
		{ targetType: 'Post', postId: post.postId },
		'report-post',
	);
	await report({ targetType: 'Member', userId: 'target' }, 'report-member');
	const queue = await review.listCommunitySafetyReportsForReviewer(
		'reviewer-a',
		{ pageSize: 1 },
		database,
		authentication,
	);
	assert.equal(queue.reports.length, 1);
	assert.ok(queue.nextCursor);
	const secondPage = await review.listCommunitySafetyReportsForReviewer(
		'reviewer-a',
		{ pageSize: 1, cursor: queue.nextCursor },
		database,
		authentication,
	);
	assert.equal(secondPage.reports.length, 1);
	assert.notEqual(queue.reports[0].reportId, secondPage.reports[0].reportId);
	assert.ok(
		[queue.reports[0].reportId, secondPage.reports[0].reportId].includes(
			submitted.reportId,
		),
	);
	const detail = await review.getCommunitySafetyReportForReviewer(
		'reviewer-a',
		{ reportId: submitted.reportId },
		database,
		authentication,
	);
	assert.equal(detail.report.evidence.text, 'Original words');
	assert.equal(detail.currentTarget.text, 'Original words');
	const context = await readers.getCommunityContextForAccount(
		'owner',
		{ communityId: 'alpha' },
		database,
	);
	const members = await readers.listCommunityMembersForAccount(
		'owner',
		{ communityId: 'alpha' },
		database,
	);
	assert.equal(
		JSON.stringify({ context, members }).includes('Please review.'),
		false,
	);
	assert.equal(
		JSON.stringify({ context, members }).includes('Original words'),
		false,
	);
	await denied(
		review.listCommunitySafetyReportsForReviewer(
			'owner',
			{},
			database,
			authentication,
		),
		'ReviewerRequired',
	);
	await denied(
		review.getCommunitySafetyReportForReviewer(
			'reporter',
			{ reportId: submitted.reportId },
			database,
			authentication,
		),
		'ReviewerRequired',
	);
	assert.equal(
		JSON.stringify(
			await database.doc(`communities/alpha/posts/${post.postId}`).get(),
		).includes('Please review.'),
		false,
	);
});

test('reviewer conflict, revocation, concurrent decisions, retries and payload mismatch', async () => {
	const submitted = await report(
		{ targetType: 'Member', userId: 'target' },
		'member-report',
	);
	const first = decision(submitted.reportId, 'NoAction', 'first');
	users.get('target').customClaims.communitySafetyReviewer = true;
	await denied(
		review.getCommunitySafetyReportForReviewer(
			'target',
			{ reportId: submitted.reportId },
			database,
			authentication,
		),
		'ReviewerConflict',
	);
	users.get('reporter').customClaims.communitySafetyReviewer = true;
	await denied(
		review.claimCommunitySafetyReportForReviewer(
			'reporter',
			{
				reportId: submitted.reportId,
				expectedRevision: 0,
				operationId: 'self-report-claim',
			},
			database,
			authentication,
			now,
		),
		'ReviewerConflict',
	);
	users.get('reviewer-b').customClaims.communitySafetyReviewer = false;
	await denied(
		review.reviewCommunityReportForReviewer(
			'reviewer-b',
			first,
			database,
			authentication,
			now,
		),
		'ReviewerRequired',
	);
	users.get('reviewer-b').customClaims.communitySafetyReviewer = true;
	const settled = await Promise.allSettled([
		review.reviewCommunityReportForReviewer(
			'reviewer-a',
			first,
			database,
			authentication,
			now,
		),
		review.reviewCommunityReportForReviewer(
			'reviewer-b',
			decision(submitted.reportId, 'RemoveMember', 'second'),
			database,
			authentication,
			now,
		),
	]);
	assert.equal(
		settled.filter((item) => item.status === 'fulfilled').length,
		1,
	);
	const winner = settled.find((item) => item.status === 'fulfilled').value;
	const actor =
		winner.moderationActionId ===
		(
			await database
				.doc(`users/reviewer-a/communitySafetyReviewOperations/first`)
				.get()
		).data()?.moderationActionId
			? 'reviewer-a'
			: 'reviewer-b';
	const request =
		actor === 'reviewer-a'
			? first
			: decision(submitted.reportId, 'RemoveMember', 'second');
	assert.deepEqual(
		await review.reviewCommunityReportForReviewer(
			actor,
			request,
			database,
			authentication,
			now,
		),
		winner,
	);
	await denied(
		review.reviewCommunityReportForReviewer(
			actor,
			{ ...request, explanation: 'Different reason.' },
			database,
			authentication,
			now,
		),
		'OperationPayloadMismatch',
	);
	users.get(actor).customClaims.communitySafetyReviewer = false;
	await denied(
		review.reviewCommunityReportForReviewer(
			actor,
			request,
			database,
			authentication,
			now,
		),
		'ReviewerRequired',
	);
});

test('concurrent claims reserve one reviewer and block the other reviewer decision', async () => {
	const submitted = await report(
		{ targetType: 'Member', userId: 'target' },
		'claim-report',
	);
	const claim = {
		reportId: submitted.reportId,
		expectedRevision: 0,
		operationId: 'claim',
	};
	const claims = await Promise.allSettled([
		review.claimCommunitySafetyReportForReviewer(
			'reviewer-a',
			claim,
			database,
			authentication,
			now,
		),
		review.claimCommunitySafetyReportForReviewer(
			'reviewer-b',
			claim,
			database,
			authentication,
			now,
		),
	]);
	assert.equal(
		claims.filter((item) => item.status === 'fulfilled').length,
		1,
	);
	const owner = (
		await database
			.doc(`users/reviewer-a/communitySafetyClaimOperations/claim`)
			.get()
	).exists
		? 'reviewer-a'
		: 'reviewer-b';
	const other = owner === 'reviewer-a' ? 'reviewer-b' : 'reviewer-a';
	assert.deepEqual(
		await review.claimCommunitySafetyReportForReviewer(
			owner,
			claim,
			database,
			authentication,
			now,
		),
		{ reportId: submitted.reportId, status: 'UnderReview', revision: 1 },
	);
	await denied(
		review.reviewCommunityReportForReviewer(
			other,
			decision(submitted.reportId, 'NoAction', 'other', {
				expectedRevision: 1,
			}),
			database,
			authentication,
			now,
		),
		'RevisionConflict',
	);
	await review.reviewCommunityReportForReviewer(
		owner,
		decision(submitted.reportId, 'NoAction', 'owner', {
			expectedRevision: 1,
		}),
		database,
		authentication,
		now,
	);
});

test('expired claim can be reassigned with the latest revision after role loss', async () => {
	const submitted = await report(
		{ targetType: 'Member', userId: 'target' },
		'timeout-report',
	);
	await review.claimCommunitySafetyReportForReviewer(
		'reviewer-a',
		{
			reportId: submitted.reportId,
			expectedRevision: 0,
			operationId: 'first-claim',
		},
		database,
		authentication,
		now,
	);
	users.get('reviewer-a').customClaims.communitySafetyReviewer = false;
	await denied(
		review.claimCommunitySafetyReportForReviewer(
			'reviewer-b',
			{
				reportId: submitted.reportId,
				expectedRevision: 1,
				operationId: 'early-claim',
			},
			database,
			authentication,
			now,
		),
		'RevisionConflict',
	);
	const later = Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000);
	const reassigned = await review.claimCommunitySafetyReportForReviewer(
		'reviewer-b',
		{
			reportId: submitted.reportId,
			expectedRevision: 1,
			operationId: 'new-claim',
		},
		database,
		authentication,
		later,
	);
	assert.equal(reassigned.revision, 2);
	await review.reviewCommunityReportForReviewer(
		'reviewer-b',
		decision(submitted.reportId, 'NoAction', 'after-claim', {
			expectedRevision: 2,
		}),
		database,
		authentication,
		later,
	);
});

test('edited reported content requires explicit current text review and revision match', async () => {
	const post = await createPost();
	const submitted = await report(
		{ targetType: 'Post', postId: post.postId },
		'stale-report',
	);
	const ref = database.doc(`communities/alpha/posts/${post.postId}`);
	await ref.update({ 'publication.content.text': 'New words', revision: 1 });
	const current = await review.getCommunitySafetyReportForReviewer(
		'reviewer-a',
		{ reportId: submitted.reportId },
		database,
		authentication,
	);
	await denied(
		review.reviewCommunityReportForReviewer(
			'reviewer-a',
			decision(submitted.reportId, 'RemoveContent', 'stale', {
				expectedTargetRevision: 0,
			}),
			database,
			authentication,
			now,
		),
		'RevisionConflict',
	);
	await denied(
		review.reviewCommunityReportForReviewer(
			'reviewer-a',
			decision(submitted.reportId, 'RemoveContent', 'stale', {
				expectedTargetRevision: 1,
			}),
			database,
			authentication,
			now,
		),
		'CurrentContentReviewRequired',
	);
	await review.reviewCommunityReportForReviewer(
		'reviewer-a',
		decision(submitted.reportId, 'RemoveContent', 'stale', {
			expectedTargetRevision: 1,
			reviewedCurrentTextDigest: current.currentTarget.textDigest,
		}),
		database,
		authentication,
		now,
	);
	const removed = (await ref.get()).data();
	assert.equal(removed.publication.status, 'ModeratorRemoved');
	assert.equal(JSON.stringify(removed).includes('New words'), false);
});

test('member removal bars rejoin and closure revokes invitation without touching journeys', async () => {
	const encryptionConfiguration =
		parseCommunityInvitationEncryptionConfiguration(
			JSON.stringify({
				activeVersion: 'v1',
				keys: { v1: Buffer.alloc(32, 17).toString('base64') },
			}),
		);
	const issued = await invitations.issueCommunityInvitationForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'invite-for-rejoin' },
		{ database, now, encryptionConfiguration },
	);
	const memberReport = await report(
		{ targetType: 'Member', userId: 'target' },
		'remove-report',
	);
	await database
		.doc('users/target/journeys/personal')
		.set({ privateWriting: 'Private' });
	await review.reviewCommunityReportForReviewer(
		'reviewer-a',
		decision(memberReport.reportId, 'RemoveMember', 'remove'),
		database,
		authentication,
		now,
	);
	assert.equal(
		(await database.doc('communities/alpha/members/target').get()).get(
			'lifecycle.status',
		),
		'Removed',
	);
	assert.equal(
		(await database.doc('communities/alpha/memberRemovals/target').get())
			.exists,
		true,
	);
	assert.equal(
		(await database.doc('users/target/journeys/personal').get()).get(
			'privateWriting',
		),
		'Private',
	);
	await denied(
		redemptions.acceptCommunityInvitationForAccount(
			'target',
			{
				invitationCode: issued.invitation.code,
				operationId: 'rejoin-removed',
				displayName: 'Target',
			},
			{ database, now, requestScopeDigest: 'a'.repeat(64) },
		),
		'MembershipRemoved',
	);
	const closeReport = await report(
		{ targetType: 'Community' },
		'close-report',
	);
	await review.reviewCommunityReportForReviewer(
		'reviewer-b',
		decision(closeReport.reportId, 'CloseCommunity', 'close', {
			expectedTargetRevision: 1,
		}),
		database,
		authentication,
		now,
	);
	assert.equal(
		(await database.doc('communities/alpha').get()).get('lifecycle.status'),
		'Closed',
	);
});
