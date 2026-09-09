import { setupPractices } from '@77/features/journey-setup/journey-setup-content';
import { FoundationalPracticeId } from '@77/types/formation/practice.types';
import type { TPracticeId } from '@77/types/formation/practice.types';
import type { IDailyPractices, IPracticeCompletion } from '@77/types/journey/journey-day.types';

import type { IJourneyDaySession } from './journey-day-session.types';

export interface IDailyPracticeSummary {
  practiceId: TPracticeId;
  name: string;
  description: string;
  action: string;
}

export const getPracticeCompletion = (
  practices: IDailyPractices,
  practiceId: TPracticeId,
): IPracticeCompletion | undefined => {
  if (practiceId === FoundationalPracticeId.ReadScripture) return practices.readScripture;
  if (practiceId === FoundationalPracticeId.Pray) return practices.pray;
  if (practiceId === FoundationalPracticeId.Reflect) return practices.reflect;
  return practices.optionalPractices.find((practice) => practice.practiceId === practiceId)
    ?.completion;
};

export const getDailyPractices = (session: IJourneyDaySession): IDailyPracticeSummary[] => [
  {
    practiceId: 'ReadScripture',
    name: 'Read Scripture',
    description: `${session.scriptureReference} · ${session.translation.abbreviation}`,
    action: 'Read Scripture',
  },
  {
    practiceId: 'Pray',
    name: 'Pray',
    description: 'Respond to today’s Scripture in prayer.',
    action: 'Spend time in prayer',
  },
  {
    practiceId: 'Reflect',
    name: 'Reflect',
    description: session.content.reflectionQuestion,
    action: 'Reflect',
  },
  ...session.day.practices.optionalPractices.flatMap(({ practiceId }) => {
    const practice = setupPractices.find((definition) => definition.practiceId === practiceId);
    return practice
      ? [{ practiceId, name: practice.name, description: practice.purpose, action: practice.name }]
      : [];
  }),
];
