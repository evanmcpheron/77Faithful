import { DataServiceError } from '@/data/types';

function unavailable(): never {
  throw new DataServiceError('unauthorized');
}

export const dataService = {
  ensureProfile: unavailable,
  getProfile: unavailable,
  updateProfile: unavailable,
  listJourneys: unavailable,
  startJourney: unavailable,
  getDailyEntry: unavailable,
  listDailyEntries: unavailable,
  ensureDailyEntry: unavailable,
  updateDailyEntry: unavailable,
};
