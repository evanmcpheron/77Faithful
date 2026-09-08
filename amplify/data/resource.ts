import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

import { dataInvariants } from '../data-invariants/resource';

const optionalPracticePattern =
  '^(movement|serve-or-encourage|scripture-memorization|gratitude|christian-reading|worship|generosity|family-devotion|personal-fasting-or-discipline|intentional-witness)$';
const translationPattern =
  '^(nasb2020|niv|nlt|esv|msg|csb|nkjv|kjv|bsb|nrsvue|lsb|nasb1995|net|amp)$';

const schema = a.schema({
  PracticeScheduleEntry: a.customType({
    effectiveDay: a.integer().required(),
    optionalPracticeAId: a.string().required(),
    optionalPracticeBId: a.string().required(),
  }),

  UserProfile: a
    .model({
      userId: a
        .id()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      onboardingOverviewCompleted: a.boolean().required(),
      optionalPracticeAId: a.string().validate((value) => value.matches(optionalPracticePattern)),
      optionalPracticeBId: a.string().validate((value) => value.matches(optionalPracticePattern)),
      translationId: a.string().validate((value) => value.matches(translationPattern)),
      owner: a.string().authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
    })
    .identifier(['userId'])
    .disableOperations(['create', 'delete', 'list', 'subscriptions'])
    .authorization((allow) => [allow.owner().identityClaim('sub').to(['read', 'update'])]),

  Journey: a
    .model({
      journeyId: a
        .id()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      startDate: a
        .date()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      timeZone: a
        .string()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      contentVersion: a
        .string()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      practiceSchedule: a
        .ref('PracticeScheduleEntry')
        .required()
        .array()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      owner: a.string().authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
    })
    .identifier(['journeyId'])
    .disableOperations(['mutations', 'subscriptions'])
    .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),

  DailyEntry: a
    .model({
      id: a
        .id()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      journeyId: a
        .id()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      day: a
        .integer()
        .required()
        .validate((value) =>
          value.gte(1, 'Day must be at least 1.').lte(77, 'Day must be at most 77.'),
        )
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      practiceCatalogVersion: a
        .string()
        .required()
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      optionalPracticeAId: a
        .string()
        .required()
        .validate((value) => value.matches(optionalPracticePattern))
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      optionalPracticeBId: a
        .string()
        .required()
        .validate((value) => value.matches(optionalPracticePattern))
        .authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
      scriptureComplete: a.boolean().required(),
      prayerComplete: a.boolean().required(),
      optionalPracticeAComplete: a.boolean().required(),
      optionalPracticeBComplete: a.boolean().required(),
      reflectionComplete: a.boolean().required(),
      morningIntention: a.string(),
      reflectionText: a.string(),
      owner: a.string().authorization((allow) => [allow.owner().identityClaim('sub').to(['read'])]),
    })
    .secondaryIndexes((index) => [
      index('journeyId').sortKeys(['day']).queryField('listDailyEntriesByJourney'),
    ])
    .disableOperations(['create', 'delete', 'list', 'subscriptions'])
    .authorization((allow) => [allow.owner().identityClaim('sub').to(['read', 'update'])]),

  ensureUserProfile: a
    .mutation()
    .returns(a.ref('UserProfile'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(dataInvariants)),

  startJourney: a
    .mutation()
    .arguments({
      startDate: a.date().required(),
      timeZone: a.string().required(),
      contentVersion: a.string().required(),
    })
    .returns(a.ref('Journey'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(dataInvariants)),

  ensureDailyEntry: a
    .mutation()
    .arguments({
      journeyId: a.id().required(),
      day: a.integer().required(),
    })
    .returns(a.ref('DailyEntry'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(dataInvariants)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
