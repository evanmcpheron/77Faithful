import type { JourneyDayNumber, JourneyState } from './invariants';

export type JourneyDayAccess =
  | { readonly relationship: 'historical' | 'current'; readonly access: 'content' }
  | { readonly relationship: 'futureLocked'; readonly access: 'metadataOnly' }
  | { readonly relationship: 'unavailable'; readonly access: 'none' };

export function journeyDayAccess(state: JourneyState, day: JourneyDayNumber): JourneyDayAccess {
  if (state.status === 'notStarted') return { relationship: 'unavailable', access: 'none' };
  if (state.status === 'ended' || day < state.currentDay)
    return { relationship: 'historical', access: 'content' };
  if (day === state.currentDay) return { relationship: 'current', access: 'content' };
  return { relationship: 'futureLocked', access: 'metadataOnly' };
}

export type DayTarget = 'detail' | 'scripture' | 'reflection';
export type DayTargetDecision =
  | { readonly decision: 'render'; readonly relationship: 'historical' | 'current' }
  | { readonly decision: 'canonicalToday' }
  | { readonly decision: 'denied'; readonly reason: 'futureLocked' | 'unavailable' };

export function dayTargetDecision(
  state: JourneyState,
  day: JourneyDayNumber,
  target: DayTarget,
): DayTargetDecision {
  const access = journeyDayAccess(state, day);
  if (access.access !== 'content') return { decision: 'denied', reason: access.relationship };
  if (access.relationship === 'current' && target === 'detail')
    return { decision: 'canonicalToday' };
  return { decision: 'render', relationship: access.relationship };
}
