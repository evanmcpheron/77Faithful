import type { ReadingPlan, WeeklyTheme } from '@/scripture/types';

export const JOURNEY_DAY_COUNT = 77;

export const weeklyThemes: readonly WeeklyTheme[] = [
  { id: 'abiding-in-christ', name: 'Abiding in Christ' },
  { id: 'scripture', name: 'Scripture' },
  { id: 'prayer', name: 'Prayer' },
  { id: 'renewal', name: 'Renewal' },
  { id: 'identity-in-christ', name: 'Identity in Christ' },
  { id: 'love', name: 'Love' },
  { id: 'service', name: 'Service' },
  { id: 'stewardship', name: 'Stewardship' },
  { id: 'christian-community', name: 'Christian Community' },
  { id: 'mission', name: 'Mission' },
  { id: 'perseverance', name: 'Perseverance' },
];

// Passage assignments await human approval under docs/FORMATION_CONTENT_SPEC.md.
export const readingPlans: readonly ReadingPlan[] = [
  { version: 'v1-draft', publication: { status: 'draft' }, days: [] },
];
