const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const {
	parseCloseCommunityRequest,
	parseLeaveCommunityRequest,
	parseRemoveCommunityMemberRequest,
	parseTransferCommunityOrganizerRequest,
	parseUpdateCommunityRequest,
} = require('../functions/lib/generated/features/communities/community-administration');
const administration = require('../functions/lib/src/community/community-administration');

test('parses bounded administration requests and rejects caller-owned authority', () => {
	assert.deepEqual(
		parseUpdateCommunityRequest({
			communityId: 'alpha',
			name: '  Grace Fellowship  ',
			purpose: '  Encourage one another.  ',
			settings: { participationExpectations: '  Be gracious.  ' },
			expectedRevision: 2,
			operationId: 'update-1',
		}),
		{
			communityId: 'alpha',
			name: 'Grace Fellowship',
			purpose: 'Encourage one another.',
			settings: { participationExpectations: 'Be gracious.' },
			expectedRevision: 2,
			operationId: 'update-1',
		},
	);
	assert.deepEqual(
		parseLeaveCommunityRequest({
			communityId: 'alpha',
			operationId: 'leave-1',
		}),
		{ communityId: 'alpha', operationId: 'leave-1' },
	);
	assert.deepEqual(
		parseRemoveCommunityMemberRequest({
			communityId: 'alpha',
			memberUserId: 'member',
			privateReason: '  Repeated harmful conduct.  ',
			operationId: 'remove-1',
		}),
		{
			communityId: 'alpha',
			memberUserId: 'member',
			privateReason: 'Repeated harmful conduct.',
			operationId: 'remove-1',
		},
	);
	assert.deepEqual(
		parseTransferCommunityOrganizerRequest({
			communityId: 'alpha',
			nextOrganizerUserId: 'member',
			expectedRevision: 3,
			operationId: 'transfer-1',
		}),
		{
			communityId: 'alpha',
			nextOrganizerUserId: 'member',
			expectedRevision: 3,
			operationId: 'transfer-1',
		},
	);
	assert.deepEqual(
		parseCloseCommunityRequest({
			communityId: 'alpha',
			expectedRevision: 4,
			operationId: 'close-1',
		}),
		{
			communityId: 'alpha',
			expectedRevision: 4,
			operationId: 'close-1',
		},
	);

	for (const invalid of [
		{
			communityId: 'alpha',
			operationId: 'leave-1',
			role: 'Organizer',
		},
		{
			communityId: 'alpha',
			memberUserId: 'member',
			privateReason: '',
			operationId: 'remove-1',
		},
		{
			communityId: 'alpha',
			nextOrganizerUserId: 'member',
			expectedRevision: 0,
			operationId: 'transfer-1',
			organizerUserId: 'forged',
		},
	]) {
		const parser =
			'memberUserId' in invalid
				? parseRemoveCommunityMemberRequest
				: 'nextOrganizerUserId' in invalid
					? parseTransferCommunityOrganizerRequest
					: parseLeaveCommunityRequest;
		assert.throws(() => parser(invalid));
	}
});

test('administration callables reject missing and unverified authentication', async () => {
	for (const callable of [
		administration.updateCommunity,
		administration.leaveCommunity,
		administration.removeCommunityMember,
		administration.transferCommunityOrganizer,
		administration.closeCommunity,
	]) {
		await assert.rejects(callable.run({ data: {} }), {
			code: 'unauthenticated',
		});
		await assert.rejects(
			callable.run({
				data: {},
				auth: { uid: 'member', token: { email_verified: false } },
			}),
			{ code: 'permission-denied' },
		);
	}
});

test('administration implementation has no logging path for private removal reasons', () => {
	const source = readFileSync(
		'functions/src/community/community-administration.ts',
		'utf8',
	);
	assert.doesNotMatch(source, /console\.|logger\.|functions\.logger/);
});
