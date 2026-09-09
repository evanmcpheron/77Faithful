import manuscript from '../../../content/provisional-course/manuscript.json';
import type { IFormationDayContentDocument } from '@77/types/formation/formation-course.types';

export type TProvisionalDayContent = Pick<
  IFormationDayContentDocument,
  'dayNumber' | 'title' | 'prayerPrompt' | 'writtenPrayer' | 'reflectionQuestion'
> & { passage: string };

export const getProvisionalDayContent = (
  dayNumber: number | null,
): TProvisionalDayContent | null => {
  if (dayNumber === null || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 77) {
    return null;
  }
  return manuscript.days.find((day) => day.dayNumber === dayNumber) ?? null;
};
