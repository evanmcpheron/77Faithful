export const JOURNEY_DAY_COUNT = 77;

export function parseDayNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d?$/.test(value)) {
    return null;
  }

  const dayNumber = Number(value);
  return dayNumber <= JOURNEY_DAY_COUNT ? dayNumber : null;
}
