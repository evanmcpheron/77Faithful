import {
	FormationThemeId,
	type TFormationThemeId,
} from '@td/types/formation/formation-course.types';

// Public overview copy, separate from course-specific weekly introductions.
export const WEEKLY_THEME_OVERVIEWS = {
	[FormationThemeId.AbidingInChrist]: {
		focus: 'Learning to rest in Christ and remain connected to Him in everyday life.',
		about: 'Jesus invites us to abide in Him. This week centers on receiving His love, trusting His care, and making room to be with Him. Spiritual practices help us attend to Christ; they do not earn His favor.',
	},
	[FormationThemeId.Scripture]: {
		focus: 'Listening to God through His living Word and letting Scripture shape your life.',
		about: 'Scripture helps us know God and see His faithfulness in Jesus Christ. This week invites you to read attentively, reflect honestly, and respond to what you learn. You do not need to understand everything at once to begin listening.',
	},
	[FormationThemeId.Prayer]: {
		focus: 'Drawing near to God in honest conversation, with trust in His care.',
		about: 'Prayer is an invitation to bring your whole life before God. Through Jesus, we can approach Him with praise, gratitude, questions, and need. This week makes room for honest prayer without the pressure to find perfect words.',
	},
	[FormationThemeId.Renewal]: {
		focus: 'Becoming renewed in Christ through the ongoing work of God in your heart and mind.',
		about: 'Renewal is not about trying harder to become a better person. Scripture calls us to be transformed as God renews our minds and forms us into the likeness of Christ.',
	},
	[FormationThemeId.Identity]: {
		focus: 'Receiving your identity in Christ and learning to live from His grace.',
		about: 'In Christ, our identity rests in God’s grace rather than our accomplishments or failures. This week invites you to consider what it means to belong to Him. His love gives us a foundation for living with humility, confidence, and care for others.',
	},
	[FormationThemeId.Love]: {
		focus: 'Receiving the love of God and sharing it through patient, faithful care.',
		about: 'Jesus shows us the depth of God’s love and calls us to love one another. This week explores love expressed through patience, kindness, truth, and forgiveness. We learn to love as a response to His grace, with wisdom and respect for healthy boundaries.',
	},
	[FormationThemeId.Service]: {
		focus: 'Following Jesus through practical acts of care for the people around you.',
		about: 'Jesus came to serve, and He invites us to follow His example. This week draws attention to ordinary opportunities to help, encourage, and care. Service can be quiet and simple, offered freely within your abilities and circumstances.',
	},
	[FormationThemeId.Stewardship]: {
		focus: 'Caring faithfully for the time, abilities, and resources God has entrusted to you.',
		about: 'All of life belongs to God. This week invites you to consider how you use what you have received, including your time, attention, abilities, and possessions. Stewardship grows through gratitude and wise care, with room for rest and generosity suited to your circumstances.',
	},
	[FormationThemeId.ChristianCommunity]: {
		focus: 'Growing together in Christ through encouragement, prayer, and shared care.',
		about: 'Following Jesus includes life with others. Scripture calls Christians to encourage one another, bear burdens, and grow together in love. This week invites you to consider faithful relationships in your church and daily life, while respecting privacy and appropriate boundaries.',
	},
	[FormationThemeId.Mission]: {
		focus: 'Living with the purpose of making Christ known through your words and actions.',
		about: 'Jesus sends His followers to bear witness to Him. This week invites you to notice opportunities to share His love, serve your neighbors, and speak about your hope with gentleness and respect. Faithful witness leaves room for others to respond freely.',
	},
	[FormationThemeId.Perseverance]: {
		focus: 'Continuing with Christ in hope, one faithful step at a time.',
		about: 'Perseverance means continuing to turn toward Jesus through both ease and difficulty. This week invites you to remember His faithfulness and consider how these practices can continue beyond the journey. Missing a day does not erase your progress or close the way back.',
	},
} as const satisfies Record<
	TFormationThemeId,
	{ readonly focus: string; readonly about: string }
>;
