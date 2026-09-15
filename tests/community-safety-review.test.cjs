const assert = require('node:assert/strict');
const { test } = require('node:test');
const validators = require('../functions/lib/generated/features/communities/community-safety');
const review = require('../functions/lib/src/community/community-safety-review');

test('safety review contracts reject extra authority, unbounded data and invalid decisions', () => {
	assert.deepEqual(
		validators.parseListCommunitySafetyReportsRequest({ pageSize: 50 }),
		{ pageSize: 50 },
	);
	assert.throws(() =>
		validators.parseListCommunitySafetyReportsRequest({ pageSize: 51 }),
	);
	assert.throws(() =>
		validators.parseListCommunitySafetyReportsRequest({ userId: 'other' }),
	);
	assert.deepEqual(
		validators.parseGetCommunitySafetyReportRequest({
			reportId: 'report-1',
		}),
		{ reportId: 'report-1' },
	);
	assert.deepEqual(
		validators.parseClaimCommunitySafetyReportRequest({
			reportId: 'report-1',
			expectedRevision: 0,
			operationId: 'claim-1',
		}),
		{ reportId: 'report-1', expectedRevision: 0, operationId: 'claim-1' },
	);
	assert.throws(() =>
		validators.parseClaimCommunitySafetyReportRequest({
			reportId: 'report-1',
			expectedRevision: 0,
			operationId: 'claim-1',
			reviewerUserId: 'other',
		}),
	);
	assert.throws(() =>
		validators.parseGetCommunitySafetyReportRequest({
			reportId: 'report-1',
			communityId: 'other',
		}),
	);
	const request = {
		reportId: 'report-1',
		expectedRevision: 0,
		expectedTargetRevision: 1,
		requestedAction: 'RemoveContent',
		explanation: 'Reviewed current words.',
		operationId: 'operation-1',
	};
	assert.deepEqual(
		validators.parseReviewCommunityReportRequest(request),
		request,
	);
	for (const invalid of [
		{ ...request, requestedAction: 'BanAccount' },
		{ ...request, expectedRevision: -1 },
		{ ...request, reviewerUserId: 'other' },
		{ ...request, reviewedCurrentTextDigest: 'invalid' },
	])
		assert.throws(() =>
			validators.parseReviewCommunityReportRequest(invalid),
		);
});

test('each callable rejects missing or unverified identity before backend access', async () => {
	for (const callable of [
		review.listCommunitySafetyReports,
		review.claimCommunitySafetyReport,
		review.getCommunitySafetyReport,
		review.reviewCommunityReport,
	]) {
		await assert.rejects(
			callable.run({ auth: undefined, data: {} }),
			(error) => error.details?.reason === 'AuthenticationRequired',
		);
		await assert.rejects(
			callable.run({
				auth: {
					uid: 'reviewer',
					token: { email_verified: false },
				},
				data: {},
			}),
			(error) => error.details?.reason === 'EmailVerificationRequired',
		);
	}
});

test('current Auth claim is rechecked for queue access', async () => {
	const authentication = {
		getUser: async () => ({
			emailVerified: true,
			disabled: false,
			customClaims: { communitySafetyReviewer: false },
		}),
	};
	await assert.rejects(
		review.listCommunitySafetyReportsForReviewer(
			'owner',
			{},
			{},
			authentication,
		),
		(error) => error.details?.reason === 'ReviewerRequired',
	);
});
