import { JOURNEY_DAY_COUNT } from '@/content/scripture/reading-plans';

export { JOURNEY_DAY_COUNT };

export function parseDayNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d?$/.test(value)) {
    return null;
  }

  const dayNumber = Number(value);
  return dayNumber <= JOURNEY_DAY_COUNT ? dayNumber : null;
}
