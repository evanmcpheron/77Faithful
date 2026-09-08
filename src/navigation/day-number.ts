import { isJourneyDayNumber, type JourneyDayNumber } from '@/journey/invariants';

export { JOURNEY_DAY_COUNT } from '@/journey/invariants';

export function parseDayNumber(value: string | string[] | undefined): JourneyDayNumber | null {
  if (typeof value !== 'string' || !/^[1-9]\d?$/.test(value)) {
    return null;
  }

  const dayNumber = Number(value);
  return isJourneyDayNumber(dayNumber) ? dayNumber : null;
}
