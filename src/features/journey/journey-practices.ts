import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import type { IJourneyDaySession } from '@td/features/journey/journey-day-session.types';
import { FoundationalPracticeId } from '@td/types/formation/practice.types';

export const getJourneyPractices = ({
	day,
	content,
	scriptureReference,
}: IJourneyDaySession) => [
	{
		id: FoundationalPracticeId.ReadScripture,
		title: 'Read Scripture',
		description: scriptureReference,
		completion: day.practices.readScripture,
	},
	{
		id: FoundationalPracticeId.Pray,
		title: 'Pray',
		description: content.prayerPrompt,
		completion: day.practices.pray,
	},
	{
		id: FoundationalPracticeId.Reflect,
		title: 'Reflect',
		description: content.reflectionQuestion,
		completion: day.practices.reflect,
	},
	...day.practices.optionalPractices.map(({ practiceId, completion }) => {
		const definition = setupPractices.find(
			(practice) => practice.practiceId === practiceId,
		);
		if (!definition) throw new Error('Unknown assigned practice.');
		return {
			id: practiceId,
			title: definition.name,
			description: definition.purpose,
			completion,
		};
	}),
];
