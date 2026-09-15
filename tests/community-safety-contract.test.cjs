const assert = require('node:assert/strict');
const { test } = require('node:test');
const contracts = require('../functions/lib/generated/features/communities/community-safety');
const safety = require('../functions/lib/src/community/community-safety');

test('report parser permits all supported targets and rejects Message and unexpected fields', () => {
	for (const target of [
		{ targetType: 'Post', postId: 'post1' },
		{ targetType: 'Reply', postId: 'post1', replyId: 'reply1' },
		{ targetType: 'Member', userId: 'member1' },
		{ targetType: 'Community' },
	])
		assert.deepEqual(
			contracts.parseReportCommunityContentRequest({
				communityId: 'community1',
				target,
				reason: 'Other',
				operationId: 'operation1',
			}).target,
			target,
		);
	assert.throws(() =>
		contracts.parseReportCommunityContentRequest({
			communityId: 'community1',
			target: {
				targetType: 'Message',
				conversationId: 'c',
				messageId: 'm',
			},
			reason: 'Other',
			operationId: 'operation1',
		}),
	);
	assert.throws(() =>
		contracts.parseReportCommunityContentRequest({
			communityId: 'community1',
			target: { targetType: 'Community' },
			reason: 'Other',
			operationId: 'operation1',
			reporterUserId: 'forged',
		}),
	);
});

test('block parsers reject caller identity and oversized cursors', () => {
	assert.deepEqual(
		contracts.parseBlockCommunityMemberRequest({
			communityId: 'group1',
			memberUserId: 'member1',
			operationId: 'op1',
		}),
		{ communityId: 'group1', memberUserId: 'member1', operationId: 'op1' },
	);
	assert.throws(() =>
		contracts.parseUnblockCommunityMemberRequest({
			memberUserId: 'member1',
			operationId: 'op1',
			ownerUserId: 'forged',
		}),
	);
	assert.throws(() =>
		contracts.parseListBlockedCommunityMembersRequest({
			cursor: 'a'.repeat(513),
		}),
	);
});

test('deterministic submission policy permits Christian text and rejects obvious solicitation', () => {
	assert.doesNotThrow(() =>
		safety.requireSafeSubmission(
			'Jesus Christ offers grace. Let us read Scripture and pray.',
		),
	);
	assert.throws(
		() => safety.requireSafeSubmission('Send me your bank login now.'),
		(error) => error.details.reason === 'SubmissionRejected',
	);
	assert.throws(
		() => safety.requireSafeSubmission('a'.repeat(10001)),
		(error) => error.details.reason === 'SubmissionRejected',
	);
});
