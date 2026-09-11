import {
	OptionalPracticeId,
	type IPracticeDefinition,
	type TOptionalPracticeId,
} from '@td/types/formation/practice.types';

export const chosenPracticeContent = {
	[OptionalPracticeId.Movement]: {
		purpose:
			'Care for the body God has given you through movement that fits your abilities and circumstances.',
		invitation:
			'Choose a way to move that fits your abilities and circumstances today. No distance, duration, pace, or intensity is required.',
		examples: [
			'Take a walk indoors or outside.',
			'Try gentle stretching or seated movement.',
			'Choose another activity suited to your abilities and circumstances.',
		],
	},
	[OptionalPracticeId.ServeOrEncourage]: {
		purpose:
			'Practice the love of Jesus through practical help or sincere encouragement.',
		invitation:
			'Notice one person you can serve or encourage today. Choose a simple response that is helpful, sincere, and appropriate for your relationship and circumstances.',
		examples: [
			'Help with a task or practical need.',
			'Send a thoughtful message or speak an encouraging word.',
			'Listen carefully and offer support when it is welcome.',
		],
	},
	[OptionalPracticeId.ScriptureMemorization]: {
		purpose:
			'Spend time memorizing and reviewing Scripture so its words and meaning become more familiar as you follow Jesus.',
		invitation:
			'Choose a verse or short passage from Scripture. Read it carefully, repeat it, and practice recalling what you can. If you are already learning a passage, continue with it.',
		examples: [
			'Learn a few words, one verse, or part of a longer passage.',
			'Review a passage you have already been memorizing.',
			'Practice recalling a passage with your Bible nearby for help.',
		],
	},
	[OptionalPracticeId.Gratitude]: {
		purpose: 'Notice God’s gifts and respond with thanks.',
		invitation:
			'Choose one specific gift to notice and thank God for it in your own words. It might be a person, something He has provided, a truth from Scripture, or His grace in Jesus Christ. You do not need to ignore grief or difficulty to practice gratitude.',
		examples: [
			'Thank God for a person who showed you care or kindness.',
			'Thank God for something He has provided or an ordinary gift in your day.',
			'Return to a truth from Scripture and thank God for what it shows you about Him or about Jesus.',
		],
	},
	[OptionalPracticeId.ChristianReading]: {
		purpose:
			'Spend time with thoughtful Christian writing that helps you understand Jesus Christ, the Christian faith, and faithful living. This practice complements, rather than replaces, your time in Scripture.',
		invitation:
			'Choose a Christian book or other substantive Christian writing from a source you trust, and read a manageable portion. There is no required page count or reading time.',
		examples: [
			'A few pages or a chapter from a Christian book, a substantive Christian article or essay, or a section from a Christian biography can all fit.',
		],
	},
	[OptionalPracticeId.Worship]: {
		purpose:
			'Turn your attention to God with praise and adoration for who He is and what He has done.',
		invitation:
			'Choose a simple way to praise God for who He is or what He has done in Jesus Christ. You can sing, pray, or use Scripture; music is not required.',
		examples: [
			'Sing or listen attentively to a hymn or song of praise.',
			'Read a psalm from your Bible and use its words to praise God.',
			'Praise God in your own words in prayer.',
		],
	},
	[OptionalPracticeId.Generosity]: {
		purpose:
			'Share what you can for another person’s good as part of following Jesus.',
		invitation:
			'Notice a real need you can help meet today, then choose what you can freely and wisely share.',
		examples: [
			'Give someone your time or focused attention.',
			'Share a meal, offer hospitality, or meet a practical need.',
			'Give money when it is appropriate for your circumstances.',
		],
	},
	[OptionalPracticeId.FamilyOrHouseholdDevotion]: {
		purpose:
			'Set aside time with your family or household to read Scripture, pray, and seek Jesus together.',
		invitation:
			'Begin with a short passage of Scripture. Read it together, talk about what it shows you about God and following Jesus, and pray together.',
		examples: [
			'Begin with a short passage of Scripture. Read it together, talk about what it shows you about God and following Jesus, and pray together.',
			'On a shorter day, read a brief passage and pray for one another.',
		],
	},
	[OptionalPracticeId.IntentionalDiscipline]: {
		purpose:
			'Set aside a distraction or choose a suitable restraint so you can give more deliberate attention to God as you follow Jesus.',
		invitation:
			'Choose one nonessential thing to limit or set aside for a period that fits your circumstances. The point is to make room for attention to God, not simply to go without something.',
		examples: [
			'Pause nonessential scrolling or social media for a chosen period.',
			'Set aside entertainment for part of the day.',
		],
	},
	[OptionalPracticeId.IntentionalWitness]: {
		purpose:
			'Share your faith in Jesus through respectful words and conduct.',
		invitation:
			'When a natural opportunity arises, speak honestly about Jesus, listen well, and respect the other person’s choice to engage or not. Their response does not determine completion.',
		examples: [
			'You might answer a sincere question, share why you follow Jesus, or mention a Scripture passage that has shaped your faith.',
			'Look for everyday opportunities — with a friend, coworker, neighbor, or family member — to reflect the hope you have in Christ through your words and actions.',
		],
	},
} satisfies Record<
	TOptionalPracticeId,
	Pick<IPracticeDefinition, 'purpose' | 'examples'> & {
		readonly invitation: string;
	}
>;

export const serveOrEncourageNotes = {
	boundaries:
		'Serve in a way that respects consent, privacy, personal safety, and needed relational boundaries. Do not contact someone when doing so would be unsafe or inappropriate.',
};
