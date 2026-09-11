import {
	OptionalPracticeId,
	type IPracticeDefinition,
	type TOptionalPracticeId,
} from '@td/types/formation/practice.types';

export const chosenPracticeContent = {
	[OptionalPracticeId.Movement]: {
		purpose:
			'Care for the body God has given you, with attention to your abilities and circumstances.',
		invitation:
			'Choose a way to move that is accessible and comfortable for you today.',
		examples: [
			'Take a walk indoors or outside.',
			'Try gentle stretching or seated movement.',
			'Return to another activity suited to your abilities.',
		],
	},
	[OptionalPracticeId.ServeOrEncourage]: {
		purpose:
			'Put the love of Jesus into practice through care for another person.',
		invitation:
			'Notice someone you could help or encourage, and choose a concrete act of care that fits your circumstances.',
		examples: [
			'Offer practical help with a task.',
			'Send a sincere word of encouragement.',
			'Listen with attention to someone who wants to talk.',
		],
	},
	[OptionalPracticeId.ScriptureMemorization]: {
		purpose:
			'Keep returning to God’s Word so its words and meaning become familiar in ordinary life.',
		invitation:
			'Choose a short passage in your Bible. Read it, repeat it, try recalling it, and revisit it over several days.',
		examples: [
			'Begin with a short part of the passage.',
			'Say the words aloud or repeat them silently.',
			'Review the same passage, looking back whenever you need help.',
		],
	},
	[OptionalPracticeId.Gratitude]: {
		purpose:
			'Notice God’s gifts and respond with thanks, even when life is difficult.',
		invitation:
			'Notice a specific gift and thank God for it. Gratitude can sit alongside grief or struggle.',
		examples: [
			'Silently name something you are thankful for.',
			'Thank God in prayer for someone’s kindness.',
			'If it helps, write a few words in your own notebook.',
		],
	},
	[OptionalPracticeId.ChristianReading]: {
		purpose:
			'Let thoughtful Christian writing help you consider what it means to follow Jesus.',
		invitation:
			'Read a manageable portion of a Christian book you have chosen. Consider its message in light of Scripture.',
		examples: [
			'Continue from where you left off.',
			'Pause over an idea and compare it with Scripture.',
			'Consider how what you read relates to an ordinary situation.',
		],
	},
	[OptionalPracticeId.Worship]: {
		purpose:
			'Turn your attention to God and honor Him for who He is and what He has done.',
		invitation: 'Choose a simple way to offer God your praise.',
		examples: [
			'Sing a hymn or a song of praise.',
			'Read a psalm from your Bible as worship.',
			'Praise God in your own words in prayer.',
		],
	},
	[OptionalPracticeId.Generosity]: {
		purpose:
			'Respond to God’s generosity by freely offering what you can for another person’s good.',
		invitation:
			'Choose a thoughtful way to share that fits your circumstances. A financial gift is not required.',
		examples: [
			'Give your time or attentive company.',
			'Share useful resources or offer hospitality.',
			'Give money when you can do so without neglecting your needs or responsibilities.',
		],
	},
	[OptionalPracticeId.FamilyOrHouseholdDevotion]: {
		purpose:
			'Make room to attend to Jesus together with willing family or household members.',
		invitation:
			'Read a short Scripture passage together, discuss “What does this help us notice about God?”, and pray. Adapt the rhythm to those taking part.',
		examples: [
			'Read with a spouse, relative, roommate, or child who wants to join.',
			'Keep the words and question accessible to those present.',
			'If you live apart, share this time with a willing family member by phone.',
		],
	},
	[OptionalPracticeId.IntentionalDiscipline]: {
		purpose:
			'Make room for attention to Christ through a freely chosen practice or boundary. This does not earn God’s favor.',
		invitation:
			'Choose a specific, manageable practice or boundary, and return to that same choice consistently.',
		examples: [
			'Put your phone aside while you pray.',
			'Set aside nonessential scrolling to make room for Scripture.',
			'Keep a quiet pause before beginning your usual activities.',
		],
	},
	[OptionalPracticeId.IntentionalWitness]: {
		purpose:
			'Reflect Jesus through attentive care and honest, respectful words about your faith.',
		invitation:
			'Listen and care for the people you meet. When welcomed, speak honestly about your hope in Jesus, respecting their willingness and boundaries.',
		examples: [
			'Listen to someone’s experience without steering the conversation.',
			'Answer a sincere question about your faith.',
			'Share what following Jesus means to you when invited.',
		],
	},
} satisfies Record<
	TOptionalPracticeId,
	Pick<IPracticeDefinition, 'purpose' | 'examples'> & {
		readonly invitation: string;
	}
>;
