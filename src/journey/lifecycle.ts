import type { JourneyCalendar } from './calendar';
import { journeyStateAtInstant } from './progression';

export type JourneyCalendarRecord = { readonly id: string; readonly calendar: JourneyCalendar };
export type OneActiveJourneyResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly reason: 'multipleActiveJourneys';
      readonly journeyIds: readonly string[];
    };

// The caller supplies one participant's records. Cloud concurrency enforcement belongs to Data.
export function validateOneActiveJourney(
  journeys: readonly JourneyCalendarRecord[],
  epochMilliseconds: number,
): OneActiveJourneyResult {
  const activeIds = journeys
    .filter(
      ({ calendar }) => journeyStateAtInstant(calendar, epochMilliseconds).status === 'active',
    )
    .map(({ id }) => id);
  return activeIds.length <= 1
    ? { valid: true }
    : { valid: false, reason: 'multipleActiveJourneys', journeyIds: activeIds };
}
