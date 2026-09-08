import { DataServiceError, type DailyEntryUpdate } from '@/data/types';
import { createDataService } from './data';

jest.mock('./amplify', () => ({}));
jest.mock('aws-amplify/data', () => ({ generateClient: jest.fn(() => ({})) }));

const profile = {
  userId: 'synthetic-user-a',
  onboardingOverviewCompleted: true,
  optionalPracticeAId: 'movement',
  optionalPracticeBId: 'gratitude',
  translationId: 'bsb',
};

const journey = {
  journeyId: 'synthetic-journey',
  startDate: '2026-09-08',
  timeZone: 'America/New_York',
  contentVersion: 'synthetic-published-v1',
  practiceSchedule: [
    { effectiveDay: 1, optionalPracticeAId: 'movement', optionalPracticeBId: 'gratitude' },
  ],
};

const dailyEntry = {
  id: 'synthetic-day',
  journeyId: 'synthetic-journey',
  day: 1,
  practiceCatalogVersion: 'v1',
  optionalPracticeAId: 'movement',
  optionalPracticeBId: 'gratitude',
  scriptureComplete: false,
  prayerComplete: false,
  optionalPracticeAComplete: false,
  optionalPracticeBComplete: false,
  reflectionComplete: true,
  morningIntention: null,
  reflectionText: null,
};

function fixture() {
  const client = {
    mutations: {
      ensureUserProfile: jest.fn(),
      startJourney: jest.fn(),
      ensureDailyEntry: jest.fn(),
    },
    models: {
      UserProfile: { get: jest.fn(), update: jest.fn() },
      Journey: { list: jest.fn() },
      DailyEntry: {
        get: jest.fn(),
        update: jest.fn(),
        listDailyEntriesByJourney: jest.fn(),
      },
    },
  };
  return {
    client,
    service: createDataService(client as unknown as Parameters<typeof createDataService>[0]),
  };
}

it('maps a private profile without exposing the generated owner value', async () => {
  const { client, service } = fixture();
  client.models.UserProfile.get.mockResolvedValue({
    data: { ...profile, owner: 'synthetic-user-a' },
  });

  await expect(service.getProfile('synthetic-user-a')).resolves.toEqual({
    userId: 'synthetic-user-a',
    onboardingOverviewCompleted: true,
    optionalPractices: ['movement', 'gratitude'],
    translationId: 'bsb',
  });
});

it('paginates bounded Journey and DailyEntry index queries', async () => {
  const { client, service } = fixture();
  client.models.Journey.list
    .mockResolvedValueOnce({ data: [journey], nextToken: 'page-2' })
    .mockResolvedValueOnce({ data: [{ ...journey, journeyId: 'journey-2' }], nextToken: null });
  client.models.DailyEntry.listDailyEntriesByJourney
    .mockResolvedValueOnce({ data: [dailyEntry], nextToken: 'page-2' })
    .mockResolvedValueOnce({ data: [{ ...dailyEntry, id: 'day-2', day: 2 }], nextToken: null });

  await expect(service.listJourneys()).resolves.toHaveLength(2);
  await expect(service.listDailyEntries('synthetic-journey')).resolves.toHaveLength(2);
  expect(client.models.DailyEntry.listDailyEntriesByJourney).toHaveBeenNthCalledWith(
    2,
    { journeyId: 'synthetic-journey' },
    { sortDirection: 'ASC', limit: 25, nextToken: 'page-2' },
  );
});

it('retrieves one specific Journey day through the indexed query', async () => {
  const { client, service } = fixture();
  client.models.DailyEntry.listDailyEntriesByJourney.mockResolvedValue({
    data: [dailyEntry],
    nextToken: null,
  });

  await expect(service.getDailyEntry('synthetic-journey', 1)).resolves.toMatchObject({
    id: 'synthetic-day',
    day: 1,
  });
  expect(client.models.DailyEntry.listDailyEntriesByJourney).toHaveBeenCalledWith(
    { journeyId: 'synthetic-journey', day: { eq: 1 } },
    { limit: 2 },
  );
});

it('passes only mutable DailyEntry fields to generated update', async () => {
  const { client, service } = fixture();
  client.models.DailyEntry.update.mockResolvedValue({ data: dailyEntry });
  const hostileInput = {
    scripture: true,
    reflectionText: 'Synthetic private reflection.',
    owner: 'synthetic-user-b',
    journeyId: 'other-journey',
    day: 77,
  } as unknown as DailyEntryUpdate;

  await service.updateDailyEntry('synthetic-day', hostileInput);

  expect(client.models.DailyEntry.update).toHaveBeenCalledWith({
    id: 'synthetic-day',
    scriptureComplete: true,
    reflectionText: 'Synthetic private reflection.',
  });
});

it('keeps provider and private values out of mapped errors', async () => {
  const { client, service } = fixture();
  client.mutations.ensureDailyEntry.mockResolvedValue({
    data: null,
    errors: [{ message: 'Unauthorized: Synthetic private reflection.' }],
  });

  const error = await service
    .ensureDailyEntry('synthetic-journey', 1)
    .catch((failure: unknown) => failure);
  expect(error).toEqual(new DataServiceError('unauthorized'));
  expect(String(error)).not.toContain('Synthetic private reflection');
});

it('maps trusted invariant rejection to an application conflict', async () => {
  const { client, service } = fixture();
  client.mutations.startJourney.mockResolvedValue({
    data: null,
    errors: [{ message: 'ACTIVE_JOURNEY_EXISTS' }],
  });

  await expect(
    service.startJourney({
      startDate: '2026-09-08',
      timeZone: 'America/New_York',
      contentVersion: 'synthetic-published-v1',
    }),
  ).rejects.toEqual(new DataServiceError('conflict'));
});
