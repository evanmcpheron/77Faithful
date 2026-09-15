const prefix = '[COMMUNITY-QA]';
const accounts = [
	[null, 'New verified account; no memberships or contributions'],
	['Anna', 'Light activity; prayer support and unread activity'],
	['Caleb', 'Active conversation participant; edited writing'],
	['Miriam Brooks', 'Organizer of the main circle and closed archive'],
	['Jordan', 'Platform safety reviewer; no community memberships'],
	[
		'Grace Park',
		'Several communities; empty circle and transferred ownership',
	],
	['Sam', 'Left the main circle; retains access to own contributions'],
	[
		'Alexandria Catherine Montgomery',
		'Dense feed, long writing, and busy thread',
	],
	['Noah', 'Removed from the main circle; member of a closed archive'],
	['Elias', 'Reference member; prayer-circle Organizer and former Organizer'],
].map(([preferredName, purpose], index) => ({
	number: index + 1,
	email: `77faithful_${index + 1}@yopmail.com`,
	preferredName,
	purpose,
}));

const communities = [
	{
		key: 'circle',
		name: 'Scripture and Everyday Faith',
		owner: 4,
		members: [2, 3, 6, 7, 8, 9, 10],
		purpose:
			'A QA circle for reading Scripture, asking thoughtful questions, and encouraging one another in following Jesus.',
		finalOwner: 4,
		status: 'Active',
	},
	{
		key: 'quiet',
		name: 'A Quiet Beginning',
		owner: 6,
		members: [],
		purpose:
			'An empty QA community for reviewing the first invitation and conversation.',
		finalOwner: 6,
		status: 'Active',
	},
	{
		key: 'prayer',
		name: 'Neighbors in Prayer',
		owner: 10,
		members: [2, 6, 8],
		purpose:
			'A small QA prayer circle with a single request and space to respond.',
		finalOwner: 10,
		status: 'Active',
	},
	{
		key: 'archive',
		name: 'Summer Reading Archive',
		owner: 4,
		members: [6, 9, 10],
		purpose:
			'A closed QA archive whose members can still read their shared conversation.',
		finalOwner: 4,
		status: 'Closed',
	},
	{
		key: 'handoff',
		name: 'Serving Our Neighbors Together',
		owner: 10,
		members: [3, 6],
		purpose:
			'A QA circle for reviewing a handoff to another Organizer and a shared journey schedule.',
		finalOwner: 6,
		status: 'Active',
	},
];

const discussionTopics = [
	[
		'Making room to listen',
		'Reading the Gospels slowly has helped me notice the people Jesus stops to hear. What helps you listen patiently when your day feels crowded?',
	],
	[
		'A small act of service',
		'I am setting aside time to help a neighbor carry groceries this week. I would welcome ideas for ordinary ways to serve without drawing attention to ourselves.',
	],
	[
		'Returning after an interrupted week',
		'My reading was interrupted this week, and today I returned to the passage where I stopped. I am thankful that our practices do not earn God’s love.',
	],
	[
		'Reading a passage twice',
		'I tried reading the same passage in the morning and evening. A question I had hurried past became clearer when I slowed down.',
	],
	[
		'Hospitality with a simple meal',
		'Our table was small and the meal was simple, but there was room to listen. I am considering how hospitality can become part of an ordinary week.',
	],
	[
		'Praying for our neighborhood',
		'During a walk I prayed for the households on our street without trying to guess what anyone needed. It helped me pay attention to the people nearby.',
	],
	[
		'Questions while reading Mark',
		'I am noticing how often Jesus asks a question before responding. I would like to talk about what those conversations show us about his care.',
	],
	[
		'When quiet is difficult',
		'Some days silence feels unfamiliar. A short time with Scripture and a simple prayer has been a helpful place to begin again.',
	],
	[
		'Encouragement without pressure',
		'A friend sent a brief note saying they were glad to read with me. There was no demand to catch up. That kindness stayed with me.',
	],
	[
		'Serving behind the scenes',
		'Preparing chairs before a gathering gave me time to pray for those who would sit there. Small tasks can become occasions for love.',
	],
	[
		'Giving thanks for daily provision',
		'Today I gave thanks for a meal, a safe journey home, and a patient conversation. Naming ordinary gifts helped me attend to God’s kindness.',
	],
	[
		'Taking a question into prayer',
		'I do not yet understand every part of today’s reading. I wrote down one question and brought it to prayer instead of rushing to an answer.',
	],
	[
		'Rest and attention',
		'An evening without extra plans gave me room to read and rest. I am learning to recognize the limits of my attention and receive rest with gratitude.',
	],
	[
		'Remembering someone who is alone',
		'I plan to call a friend who lives alone this weekend. I hope to leave enough time to listen and ask how I can pray.',
	],
	[
		'An invitation to read together',
		'If you are returning to the community after time away, there is room for you in the conversation. Read at a pace that lets you attend to Scripture.',
	],
];

const posts = [
	{
		key: 'welcome',
		community: 'circle',
		author: 4,
		type: 'OrganizerAnnouncement',
		text: 'Welcome to this QA circle. We will read Scripture, pray, and encourage one another as we follow Jesus. Share only what you intend other members to read; private writing remains private.',
	},
	{
		key: 'prayer-current',
		community: 'circle',
		author: 3,
		type: 'PrayerRequest',
		text: 'Please pray for patience and wisdom as I support a relative through a difficult week. I am keeping their personal details private.',
		prayerStatus: 'Current',
	},
	{
		key: 'prayer-answered',
		community: 'circle',
		author: 2,
		type: 'PrayerRequest',
		text: 'Thank you for praying about a difficult conversation. We were able to listen calmly and agree on a helpful next step.',
		prayerStatus: 'Answered',
	},
	{
		key: 'prayer-past',
		community: 'circle',
		author: 6,
		type: 'PrayerRequest',
		text: 'This request concerned travel for a family visit. The visit has ended; thank you for remembering us in prayer.',
		prayerStatus: 'NoLongerCurrent',
	},
	{
		key: 'shared-copy',
		community: 'circle',
		author: 3,
		type: 'SharedReflectionCopy',
		text: 'A deliberately shared QA reflection: I noticed how quickly I look for a task to complete. Today I want to begin by listening to Jesus in Scripture and responding with trust.',
		edit: 'A deliberately shared QA reflection, edited by its author: I noticed how quickly I look for a task to complete. Today I want to begin by listening to Jesus in Scripture and responding with trust. This copy is separate from any private writing.',
	},
	{
		key: 'long-reading',
		community: 'circle',
		author: 8,
		type: 'Discussion',
		text:
			'A longer QA conversation about listening, prayer, and ordinary faithfulness. ' +
			discussionTopics
				.map(([title, text]) => `${title}. ${text}`)
				.join(' ')
				.repeat(5)
				.slice(0, 9700)
				.replace(/[^.]*$/, ''),
	},
	{
		key: 'author-deleted',
		community: 'circle',
		author: 8,
		type: 'Discussion',
		text: 'A QA note prepared for author deletion. The final thread should retain its place while omitting this body.',
		finalStatus: 'AuthorDeleted',
	},
	{
		key: 'safety-removed',
		community: 'circle',
		author: 8,
		type: 'Discussion',
		text: 'A clearly labeled QA safety-review example. This harmless body exists only to review the content-removal workflow.',
		finalStatus: 'ModeratorRemoved',
	},
	{
		key: 'left-contribution',
		community: 'circle',
		author: 7,
		type: 'Discussion',
		text: 'Before leaving this QA circle, I wanted to thank everyone for reading with me. I can manage my own shared contributions after I leave.',
	},
	{
		key: 'removed-contribution',
		community: 'circle',
		author: 9,
		type: 'Discussion',
		text: 'A QA contribution retained after membership removal. This account should later manage its own writing without reopening the community feed.',
	},
	...discussionTopics.map(([title, text], index) => ({
		key: `conversation-${index + 1}`,
		community: 'circle',
		author: [8, 3, 10, 6, 8][index % 5],
		type: 'Discussion',
		text: `${title}. ${text}`,
	})),
	{
		key: 'single-prayer',
		community: 'prayer',
		author: 10,
		type: 'PrayerRequest',
		text: 'Please pray for our neighbors and for opportunities to serve them with kindness.',
		prayerStatus: 'Current',
	},
	{
		key: 'archive-welcome',
		community: 'archive',
		author: 4,
		type: 'OrganizerAnnouncement',
		text: 'Our QA summer reading circle has reached its closing gathering. This conversation will remain available as a read-only archive for members.',
	},
	{
		key: 'archive-thanks',
		community: 'archive',
		author: 9,
		type: 'SharedReflectionCopy',
		text: 'Thank you for the patient conversation this summer. I am taking away a desire to read Scripture slowly and listen more carefully.',
	},
	{
		key: 'handoff-note',
		community: 'handoff',
		author: 10,
		type: 'OrganizerAnnouncement',
		text: 'Grace will care for invitations and the shared schedule in this QA circle. I look forward to continuing here as a member.',
	},
].map((post) => ({ ...post, text: `${prefix} ${post.text}` }));

const replyTexts = [
	'Thank you for opening this conversation. I would like to make time to read the passage again.',
	'Listening before offering advice is something I am practicing this week.',
	'A short prayer before a conversation has helped me slow down and pay attention.',
	'I appreciate the reminder that returning to Scripture is an invitation, without pressure to perform.',
	'This gives me a concrete way to serve someone nearby. I will start with a simple call.',
];
const replies = Array.from({ length: 25 }, (_, index) => ({
	key: `busy-thread-${index + 1}`,
	post: 'long-reading',
	author: [2, 3, 4, 6, 7, 9, 10][index % 7],
	text: `${prefix} ${replyTexts[index % replyTexts.length]} I am considering this alongside the ${discussionTopics[index % discussionTopics.length][0].toLowerCase()} conversation.`,
	...(index === 0
		? {
				edit: `${prefix} Thank you for opening this conversation. After reading again, I want to begin with listening and prayer.`,
			}
		: {}),
	...(index === 1 ? { deleted: true } : {}),
}));

const expectedMemberships = (number) =>
	communities.flatMap((community) => {
		if (![community.owner, ...community.members].includes(number))
			return [];
		const status =
			community.key === 'circle' && number === 7
				? 'Left'
				: community.key === 'circle' && number === 9
					? 'Removed'
					: 'Active';
		return [
			{
				key: community.key,
				status,
				role: community.finalOwner === number ? 'Organizer' : 'Member',
			},
		];
	});

module.exports = {
	prefix,
	accounts,
	communities,
	posts,
	replies,
	expectedMemberships,
};
