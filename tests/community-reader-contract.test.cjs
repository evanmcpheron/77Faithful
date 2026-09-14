const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	parseGetCommunityContextRequest,
	parseGetCommunityContextResult,
	parseListCommunitiesPageRequest,
	parseListCommunitiesPageResult,
	parseListCommunityMembersRequest,
	parseListCommunityMembersResult,
} = require('../functions/lib/generated/features/communities/community-reader');

const community = {
	communityId: 'community-1',
	name: 'Grace Church',
	purpose: 'Encourage one another.',
	organizer: { userId: 'owner', displayName: '' },
	participationExpectations: 'Be gracious.',
	status: 'Active',
};

test('community reader requests reject extra fields, caller identity, and unbounded pages', () => {
	assert.deepEqual(
		parseGetCommunityContextRequest({ communityId: 'group' }),
		{
			communityId: 'group',
		},
	);
	assert.deepEqual(parseListCommunitiesPageRequest(null), { pageSize: 20 });
	assert.deepEqual(
		parseListCommunityMembersRequest({
			communityId: 'group',
			pageSize: 50,
			cursor: 'opaque_cursor',
		}),
		{ communityId: 'group', pageSize: 50, cursor: 'opaque_cursor' },
	);
	for (const value of [
		{},
		{ communityId: '../group' },
		{ communityId: 'group', userId: 'forged' },
	])
		assert.throws(() => parseGetCommunityContextRequest(value));
	for (const value of [
		{ pageSize: 0 },
		{ pageSize: 51 },
		{ pageSize: 2.5 },
		{ userId: 'forged' },
		{ cursor: 'x'.repeat(513) },
	])
		assert.throws(() => parseListCommunitiesPageRequest(value));
});

test('community context parser returns only its canonical safe projection', () => {
	const value = {
		context: {
			community,
			membership: {
				communityId: 'community-1',
				userId: 'owner',
				displayName: '',
				role: 'Organizer',
				status: 'Active',
			},
			capabilities: {
				canReadMembers: true,
				canCreatePost: true,
				canInviteMembers: true,
				canManageMembers: true,
				canEditCommunity: true,
				canCloseCommunity: true,
				canLeaveCommunity: true,
			},
			activeMemberCount: { value: 1, isExact: true },
		},
	};
	assert.deepEqual(parseGetCommunityContextResult(value), value);
	assert.throws(() =>
		parseGetCommunityContextResult({
			...value,
			context: { ...value.context, contactEmail: 'private@example.com' },
		}),
	);
	assert.throws(() =>
		parseGetCommunityContextResult({
			...value,
			context: {
				...value.context,
				activeMemberCount: { value: 501, isExact: false },
			},
		}),
	);
});

test('page result parsers reject private extras and over-limit results', () => {
	assert.deepEqual(
		parseListCommunitiesPageResult({
			communities: [community],
			nextCursor: null,
		}),
		{ communities: [community], nextCursor: null },
	);
	const member = {
		communityId: 'community-1',
		userId: 'member',
		displayName: '',
		role: 'Member',
	};
	assert.deepEqual(
		parseListCommunityMembersResult({
			members: [member],
			nextCursor: 'opaque_cursor',
		}),
		{ members: [member], nextCursor: 'opaque_cursor' },
	);
	assert.throws(() =>
		parseListCommunityMembersResult({
			members: [{ ...member, email: 'private@example.com' }],
			nextCursor: null,
		}),
	);
	assert.throws(() =>
		parseListCommunitiesPageResult({
			communities: Array.from({ length: 51 }, () => community),
			nextCursor: null,
		}),
	);
});
