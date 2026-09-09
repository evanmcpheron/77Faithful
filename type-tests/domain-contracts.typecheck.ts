import type {
  CommunityInvitationStatus,
  FoundationalPracticeId,
  IActiveJourneyStatistics,
  IAuthorDeletedCommunityPost,
  IAuthorDeletedMessage,
  IBibleVersionDefinition,
  ICommunityInvitationDocument,
  ICommunityMemberSummary,
  ICommunityMembershipDocument,
  ICommunitySharedReflectionContent,
  IConversationDocument,
  IEndedJourneyStatistics,
  IJourneyDayDocument,
  IJourneyDocument,
  IModeratorRemovedCommunityPost,
  IModeratorRemovedMessage,
  IPracticeChangeDocument,
  IStartJourneyRequest,
  TAssignedDailyPracticeIds,
  TBibleVersionId,
  TCommunityMembershipStatus,
  TJourneyStatus,
  TOptionalPracticeSelection,
} from '@77/types';

// Compile-only contracts: never import this file into an application entry point.
type TAssertAssignable<TExpected, TActual extends TExpected> = TActual;

export type TFiveToSevenPractices = TAssertAssignable<
  5 | 6 | 7,
  TAssignedDailyPracticeIds['length']
>;
export type TTwoToFourOptionalPractices = TAssertAssignable<
  2 | 3 | 4,
  TOptionalPracticeSelection['length']
>;
export type TScriptureIsFirst = TAssertAssignable<
  typeof FoundationalPracticeId.ReadScripture,
  TAssignedDailyPracticeIds[0]
>;
export type TPrayerIsSecond = TAssertAssignable<
  typeof FoundationalPracticeId.Pray,
  TAssignedDailyPracticeIds[1]
>;
export type TReflectionIsThird = TAssertAssignable<
  typeof FoundationalPracticeId.Reflect,
  TAssignedDailyPracticeIds[2]
>;

// @ts-expect-error An eighth assigned practice must not exist.
export type TRejectEighthPractice = TAssignedDailyPracticeIds[7];
// @ts-expect-error A fifth optional choice must not exist.
export type TRejectFifthOptionalPractice = TOptionalPracticeSelection[4];
export type TRejectOptionalFoundation = TAssertAssignable<
  TAssignedDailyPracticeIds[3],
  // @ts-expect-error A foundational practice cannot fill an optional slot.
  typeof FoundationalPracticeId.Pray
>;
// @ts-expect-error Setup is separate from persisted journey status.
export type TRejectNotStartedJourney = TAssertAssignable<TJourneyStatus, 'NotStarted'>;
// @ts-expect-error Journeys cannot be paused.
export type TRejectPausedJourney = TAssertAssignable<TJourneyStatus, 'Paused'>;

declare const journey: IJourneyDocument;
declare const journeyDay: IJourneyDayDocument;
declare const practiceChange: IPracticeChangeDocument;

// @ts-expect-error Confirmed journey dates are immutable.
journey.startDate = journey.startDate;
// @ts-expect-error Travel cannot change the confirmed journey time zone.
journey.timeZoneId = journey.timeZoneId;
// @ts-expect-error Initial selections anchor the immutable assignment history.
journey.initialOptionalPracticeIds = journey.initialOptionalPracticeIds;
// @ts-expect-error An assignment change cannot be rescheduled retroactively.
practiceChange.effectiveDayNumber = practiceChange.effectiveDayNumber;
// @ts-expect-error A historical day cannot replace its whole assigned-practice record.
journeyDay.practices = journeyDay.practices;
// @ts-expect-error A historical optional slot cannot change its practice identity.
journeyDay.practices.optionalPractices[0].practiceId =
  journeyDay.practices.optionalPractices[0].practiceId;

// @ts-expect-error Ownership comes from authenticated server context.
export type TRejectStartOwner = IStartJourneyRequest['userId'];
// @ts-expect-error The server assigns the journey identity.
export type TRejectStartJourneyId = IStartJourneyRequest['journeyId'];
// @ts-expect-error The caller cannot choose the resulting journey status.
export type TRejectStartStatus = IStartJourneyRequest['status'];

export type TStableBibleIdentity = TAssertAssignable<string, TBibleVersionId>;
export type TRejectBibleDisplayIdentity = TAssertAssignable<
  TBibleVersionId,
  // @ts-expect-error Display metadata is not the persisted translation identity.
  IBibleVersionDefinition
>;

// @ts-expect-error Community summaries exclude account email.
export type TRejectMemberEmail = ICommunityMemberSummary['email'];
// @ts-expect-error Community summaries exclude private contact information.
export type TRejectMemberContactEmail = ICommunityMemberSummary['contactEmail'];
// @ts-expect-error Community summaries exclude private reflections.
export type TRejectMemberReflection = ICommunityMemberSummary['reflection'];
// @ts-expect-error Community summaries exclude private intentions.
export type TRejectMemberIntention = ICommunityMemberSummary['intention'];
// @ts-expect-error Community summaries exclude starting motivation.
export type TRejectMemberMotivation = ICommunityMemberSummary['startingMotivation'];

// @ts-expect-error Sharing a copy must not expose the private source journey.
export type TRejectSharedJourneyReference = ICommunitySharedReflectionContent['journeyId'];
// @ts-expect-error Sharing a copy must not expose a private source day.
export type TRejectSharedDayReference = ICommunitySharedReflectionContent['dayNumber'];
// @ts-expect-error Sharing a copy must not link a private writing revision.
export type TRejectSharedRevisionReference = ICommunitySharedReflectionContent['revisionId'];

// @ts-expect-error Author-deleted posts retain no readable content.
export type TRejectDeletedPostContent = IAuthorDeletedCommunityPost['content'];
// @ts-expect-error Author-deleted posts also exclude direct text fields.
export type TRejectDeletedPostText = IAuthorDeletedCommunityPost['text'];
// @ts-expect-error Moderator-removed posts retain no readable content.
export type TRejectRemovedPostContent = IModeratorRemovedCommunityPost['content'];
// @ts-expect-error Moderator-removed posts also exclude direct text fields.
export type TRejectRemovedPostText = IModeratorRemovedCommunityPost['text'];
// @ts-expect-error Author-deleted messages retain no readable text.
export type TRejectDeletedMessageText = IAuthorDeletedMessage['text'];
// @ts-expect-error Moderator-removed messages retain no readable text.
export type TRejectRemovedMessageText = IModeratorRemovedMessage['text'];
// @ts-expect-error Conversations do not embed an unbounded message collection.
export type TRejectEmbeddedMessages = IConversationDocument['messages'];

export type TRejectInvitationAsMembership = TAssertAssignable<
  ICommunityMembershipDocument,
  // @ts-expect-error An invitation is not a community membership.
  ICommunityInvitationDocument
>;
export type TRejectPendingMembership = TAssertAssignable<
  TCommunityMembershipStatus,
  // @ts-expect-error Pending invitations do not confer membership.
  typeof CommunityInvitationStatus.Pending
>;

export type TActiveCurrentStreak = TAssertAssignable<
  number,
  IActiveJourneyStatistics['currentCompleteDayStreak']
>;
// @ts-expect-error Ended journeys have no ongoing complete-day streak.
export type TRejectEndedCurrentStreak = IEndedJourneyStatistics['currentCompleteDayStreak'];
