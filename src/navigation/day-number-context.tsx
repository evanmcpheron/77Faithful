import { createContext, use } from 'react';

export const DayNumberContext = createContext<number | null>(null);

export function useDayNumber(): number {
  const dayNumber = use(DayNumberContext);
  if (dayNumber === null) {
    throw new Error('Day screens must be rendered inside the validated day layout.');
  }
  return dayNumber;
}
