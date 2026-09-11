# 77Faithful Target Domain Type System

## Status

This document defines the domain contracts and persistence rules that should be
established before broad feature work. It does not assume that `src/types/**`,
Firestore collections, indexes, Cloud Functions, repositories, validators, or
tests already exist.

The purpose is to give client code, server code, Security Rules design, offline
state, and future community work one coherent vocabulary.

Product documents remain authoritative for behavior.

## 1. Design goals

The domain layer should be:

- dependency-light;
- explicit at trust boundaries;
- usable by both client and server TypeScript;
- independent of Firebase snapshot classes;
- stable enough to prevent screens and services from inventing incompatible
  shapes;
- organized around product concepts rather than database convenience.

A target location is `src/types/**`, with `src/types/index.ts` as the deliberate
public export surface.

## 2. Separation of concerns

Keep these concepts distinct:

- persisted document body;
- path/document identity;
- hydrated application projection;
- function request DTO;
- function response DTO;
- device-local state;
- authored content;
- derived statistics.

Do not spread raw Firestore snapshots into participant-facing or
function-response objects.

## 3. Suggested domain organization

```text
src/types/
  account/
  formation/
  journey/
  shared/
  community/      # future
  messaging/      # future only if explicitly approved
  index.ts
```

### Account

Target contracts:

- `IUserDocument`
- `IDevicePreferencesDocument`
- `IJourneySetupDocument`
- account-deletion request/status contracts

### Formation

Target contracts:

- practice catalog
- Bible version/edition catalog
- Scripture reference/text
- course/version
- weekly introduction
- daily formation content

### Journey

Target contracts:

- `IJourneyDocument`
- `IJourneyDayDocument`
- practice-selection changes
- private writing
- journey statistics projections
- function request/response contracts
- device-local journey state

### Shared

Target contracts:

- persisted timestamp representation;
- calendar date;
- local clock time;
- IANA time-zone ID;
- revision/version fields;
- sync/save-state types.

### Future community

Keep future community types physically and conceptually isolated so V1 code does
not accidentally treat them as released behavior.

## 4. Persistent record identity

A persisted document-body interface should normally omit the Firestore path ID.

Example:

```ts
interface IJourneyDocument {
	ownerUserId: string;
	status: TJourneyStatus;
	startDate: TCalendarDate;
}
```

A hydrated application projection can add a `journeyId` deliberately:

```ts
interface IJourney extends IJourneyDocument {
	journeyId: string;
}
```

Do not rely on `documentId` appearing inside every record unless the data model
deliberately requires it.

Ownership references should be explicit fields where needed for Security Rules,
queries, and server validation.

## 5. Time types

### Calendar date

Use a validated ISO local calendar date:

```ts
type TCalendarDate = `${number}-${number}-${number}`;
```

The semantic format is `YYYY-MM-DD`.

Do not use an instant timestamp as a substitute for the journey's assigned local
date.

### Local clock time

Use a validated local clock value such as `HH:mm`.

```ts
type TLocalClockTime = `${number}:${number}`;
```

Runtime validation must still verify ranges.

### Time zone

Use an IANA time-zone identifier, for example:

- `America/New_York`
- `Europe/London`

Do not persist a fixed UTC offset as the primary time-zone identity because
offsets change with daylight-saving rules.

### Persisted timestamps

For cross-boundary DTOs that must not depend on a Firebase SDK class, use a
structural representation:

```ts
interface IPersistedTimestamp {
	seconds: number;
	nanoseconds: number;
}
```

At the Firestore persistence layer, audit timestamps should be native Firestore
timestamps. Adapters can convert to/from the dependency-light representation
where a shared DTO needs it.

Server audit time and participant-device observation time are not the same
concept.

A field such as `recordedOnDeviceAt` is advisory and must not authorize access,
decide journey eligibility, or settle a conflict by itself.

## 6. Schema versions and nullability

Important persistent document boundaries may include a numeric `schemaVersion`.

Use the version to validate the document shape and support deliberate future
evolution.

`null` should represent explicit absence when the distinction matters, including
writing-deletion tombstones.

Do not write `undefined` to persistent records. Normalize optional fields
deliberately in persistence adapters.

## 7. User and account records

`IUserDocument` should contain only private account/profile information required
by the product.

V1 profile data should remain minimal:

- owner identity;
- optional preferred name;
- account/contact state needed for the application;
- created/updated audit fields;
- schema version.

Do not add public biography, follower counts, denomination, spiritual score, or
profile photo fields because they are not part of V1.

Authentication credentials belong to Firebase Authentication, not duplicated
inside Firestore.

## 8. Device preferences

`IDevicePreferencesDocument` should represent settings that are intentionally
device-specific.

Examples:

- morning reminder enabled/time;
- evening reminder enabled/time;
- device identifier;
- notification preference metadata;
- local appearance preference when the chosen product behavior is
  device-specific.

Each phone can have independent reminder choices. Do not assume one device's
local notification permission applies to another.

## 9. Journey setup

Setup exists before an active journey.

A target `IJourneySetupDocument` should hold resumable choices such as:

- selected additional practice IDs;
- selected Bible version/edition ID;
- optional starting motivation draft or saved setup motivation;
- reminder choices if those are persisted at setup;
- readiness state;
- updated timestamp;
- revision/version used for concurrency.

Suggested state:

```ts
type TJourneySetupStatus = 'incomplete' | 'ready';
```

Do not create a persisted active journey merely because setup is complete.

The start date is not reserved by a setup document.

## 10. Journey identity and lifecycle

`IJourneyDocument` should capture immutable journey identity and schedule plus a
small set of lifecycle fields.

Core immutable fields should include:

- owner user ID;
- course ID;
- course version ID;
- start calendar date;
- starting time-zone ID as context;
- initial selected additional practices;
- created/start audit timestamp.

Lifecycle:

```ts
type TJourneyStatus = 'active' | 'completed' | 'endedEarly';
```

Ending early and completion are terminal.

Do not add paused, frozen, scheduled, or restarted states to V1.

A participant can have many historical journeys but only one active journey.

## 11. Calendar rules

Day 1 is the confirmed start date.

Day 77 is `startDate + 76 calendar days`.

Do not calculate the journey as `77 * 24 hours`.

Use calendar arithmetic so daylight-saving transitions do not alter day
numbering.

Target formation constants:

```ts
const FormationStructure = {
	journeyDayCount: 77,
	weekCount: 11,
	daysPerWeek: 7,
} as const;
```

Derived week number:

```text
ceil(dayNumber / 7)
```

Valid day numbers are `1–77`.

## 12. Current position

Current position should be derived from:

- immutable start date;
- current phone local calendar date;
- current phone IANA time zone;
- terminal journey status.

The starting time zone is retained for context, but travel does not lock the
participant into that zone.

Do not persist `currentDayNumber` as the authoritative truth unless there is a
specifically documented synchronization reason. It is normally derived.

## 13. Journey completion

A journey becomes completed after the Day 77 calendar date ends in the phone's
current zone and an authoritative check records that terminal state.

Completion of the 77-day period is independent of complete-day count.

Completing all Day 77 practices early completes that day, not the period.

Once a journey is terminal, later travel must not reopen it.

## 14. Early ending

An early ending should record at least:

- terminal status;
- ending calendar date;
- last reached day;
- trusted audit timestamp.

After ending:

- future unused days remain not reached;
- historical reached days remain available under product rules;
- unapplied practice changes are canceled;
- the journey cannot resume.

## 15. Journey-day records

A journey-day record should preserve the assignment and participation state for
that numbered day.

Important fields may include:

- journey owner/reference;
- day number;
- assigned calendar date;
- course/day content reference;
- assigned practice IDs;
- per-practice completion state;
- participant-update audit fields.

Do not materialize a future day merely so it can appear in a grid.

If days are created lazily, the app still must not interpret “missing record” as
“no practices happened.” Missing data and zero marked completions are different
states.

## 16. Practice IDs

Foundational IDs:

- `readScripture`
- `pray`
- `reflect`

Additional catalog IDs should be stable identifiers independent of display
labels.

The V1 additional catalog contains:

- Movement;
- Serve or Encourage;
- Scripture Memorization;
- Gratitude;
- Christian Reading;
- Worship;
- Generosity;
- Family or Household Devotion;
- Intentional Discipline;
- Intentional Witness.

A valid day has:

- all three foundational practices;
- two to four distinct additional practices;
- five to seven total distinct practice IDs.

## 17. Practice completion

Completion is explicit participant state keyed by the practice assigned to that
day.

Opening a practice does not complete it.

Saving reflection text does not complete Reflect.

Deleting reflection text does not clear Reflect.

Never transfer a completion marker from an old optional practice to a
replacement optional practice.

## 18. Practice-selection changes

The initial selected additional practices belong to the journey's start.

Later changes should be represented as dated/revisioned selection changes rather
than mutating historical day assignments.

A pending change should capture:

- owner/journey;
- current selection;
- proposed selection;
- effective day number;
- effective calendar date;
- revision;
- status;
- trusted timestamps.

Suggested statuses:

- `pending`;
- `canceled`;
- `superseded`;
- `applied`.

Only one upcoming selection should exist in V1.

The new selection must remain two to four distinct catalog practices.

A change:

- never affects the current day;
- never rewrites history;
- never targets Day 78;
- can be revised/canceled before it takes effect;
- is canceled if the journey ends before application.

Concurrency checks should use expected revision/effective day values so a stale
phone cannot confirm a different next-day selection after midnight or after
another device changed it.

## 19. Authored formation content

Formation content should be separate from participant records and versioned.

A journey pins a specific:

- course ID;
- course version.

Each day can then resolve:

- week/theme;
- working/published title;
- primary Scripture assignment;
- optional supporting Scripture assignment;
- devotional;
- prayer prompt;
- authored written prayer;
- reflection question;
- intention invitation;
- weekly introduction where applicable.

Routine editorial edits should produce a new content version for future journeys
rather than silently rewriting the context of older private writing.

Rights, safety, or serious theological corrections can require replacing or
withdrawing content under an explicit correction process.

## 20. Scripture editions

A Bible version ID is a participant preference; a Bible edition record
identifies the exact text that can be displayed.

Desired catalog:

- NASB 2020;
- NIV;
- NLT;
- MSG;
- KJV;
- NKJV;
- CSB;
- WEB.

The existence of a catalog constant must not imply that an edition is cleared or
complete.

Suggested edition availability:

```ts
type TBibleEditionStatus = 'pending' | 'released' | 'withdrawn';
```

Before a version can be selected as working, the exact edition and every
assigned passage needed by the course must be prepared and approved.

Never substitute a different translation under a requested label.

## 21. Course/version stability

A journey should continue resolving the course version it began with.

A later course version should not alter prior journey titles, devotional
context, prayer prompts, or reflection questions merely because the app has
newer content.

Participant-authored words must never be rewritten by an editorial update.

## 22. Private writing

V1 private writing includes:

- optional starting motivation;
- daily intention;
- daily reflection.

Prayer does not require a separate V1 prayer journal.

Writing and practice completion remain separate.

A useful model is:

- a current writing head;
- immutable or auditable revisions as needed;
- explicit conflict records;
- deletion tombstones where required.

## 23. Writing concurrency

Writing is intimate data. Silent last-write-wins loss is unacceptable.

A save/delete operation should carry:

- expected revision;
- device operation ID;
- new text or deletion intent.

If the expected revision is stale:

- preserve the account version;
- preserve the participant's competing version;
- return a conflict state;
- let the participant review and resolve it.

Do not automatically line-merge personal reflections.

A conflict resolution may select one version or a participant-composed
replacement, but should recheck the current revision before committing.

## 24. Local drafts and save states

Device-local state should distinguish:

- editing draft;
- saved on this phone;
- confirmed for the account;
- waiting to sync;
- conflict;
- failed save;
- deletion waiting to sync.

A draft is not a server save.

Namespace local data by account, journey, day, and device context as needed so
signing into a different account cannot inherit another person's private
writing.

## 25. Offline content preparation

A journey should be called prepared for offline use only after the phone durably
holds:

- all 77 days of the pinned formation guidance needed for that journey;
- the exact selected released Scripture edition text for all assigned readings;
- required acknowledgments and identifiers;
- sufficient metadata to detect stale/withdrawn content.

Caching future content does not unlock future content.

A newly selected translation should not replace the current readable one until
the replacement has been prepared successfully.

## 26. Offline participation

Daily participant actions may be recorded locally during ordinary connection
gaps when the product has a defined reconciliation path.

However, consequential server-authoritative operations should require
connection, including:

- starting a journey;
- ending early;
- confirming a next-day practice-selection change;
- account-wide destructive actions.

The UI must communicate what is local and what has been confirmed.

## 27. Reconciliation order

When returning online, reconciliation should learn authoritative state before
replaying queued participant changes.

This prevents stale local work from:

- writing to a journey that ended elsewhere;
- applying a superseded practice choice;
- resurrecting deleted writing;
- creating a second active journey.

If locally drafted writing belongs to a day later discovered to be not reached
because the journey ended elsewhere, preserve it for participant recovery/copy
rather than silently accepting it as valid journey history.

## 28. Derived progress and statistics

Prefer derived statistics.

Potential projections include:

- practice completion count for a day;
- complete-day state;
- journey complete-day count;
- total completed-practice markers;
- current complete-day streak;
- longest complete-day streak;
- count of nonempty saved daily reflections;
- reached-day denominator for early-ended journeys.

Do not persist a cross-journey spiritual score.

### Complete day

A day is complete when every practice actually assigned to that day is marked
complete.

### Current streak

For an active journey:

- if Today is complete, the current streak may end on Today;
- if Today is unfinished, do not break the streak during the day; calculate
  backward from yesterday;
- when historical completion changes, recalculate from the underlying record.

### Early-ended denominator

Use only the reached portion of the journey. Do not count unreached future days
as ordinary incomplete days.

### Completed denominator

A completed journey has 77 reached days and between 385 and 539 assigned
practice markers depending on selected-practice history.

## 29. Participant-update timestamps

If a field such as `lastParticipantUpdateAt` is used, it should change only when
the participant changes meaningful state.

Do not update it merely because a backend lazily creates a missing projection or
recalculates a derived value.

This preserves the meaning of “Updated after this day.”

## 30. Reminders

Reminder data should remain device-aware.

Target settings:

- morning reminder enabled;
- morning local time;
- evening reminder enabled;
- evening local time.

Local notification permission is device-specific.

A reminder engine should suppress a notification when the phone reliably knows
it is no longer useful, but should not claim certainty about actions that may
have occurred on another offline phone.

## 31. Security boundary

Firestore Security Rules must enforce participant ownership and prevent direct
access to records that the client should not read/write.

Trusted Cloud Functions should enforce cross-document invariants and operations
that Security Rules cannot express safely.

Never make privacy depend only on the client hiding a button.

## 32. Future private communities

Future community types should be designed around invitation-based private
membership.

Target roles:

- Organizer
- Member

Membership must not grant access to:

- private personal reflections;
- private intentions;
- starting motivation;
- detailed private practice records;
- account contact information beyond explicitly shared profile information.

### Invitations

Invitations should be:

- opaque;
- single-use or explicitly limited;
- revocable;
- server-authoritative for expiry;
- safe under accept/revoke concurrency.

Do not expose invitation secrets, token digests, full member lists, or invitee
email information in a public preview.

### Shared journeys

A future community may coordinate a shared 77-day schedule and course.

Enrollment before the shared start should not create a future-dated personal
journey.

At the real start boundary, the backend should recheck:

- active membership;
- confirmed account eligibility;
- content readiness;
- schedule;
- one-active-personal-journey invariant.

If the participant already has an active personal journey, block or prompt
explicitly. Never end, merge, backdate, or overwrite the existing journey
silently.

Once a personal shared journey starts, later removal from the group must not
delete or reschedule that participant's private journey.

### Progress sharing

Progress sharing should be explicit and revocable.

High-level group progress must avoid exposing:

- exact private practice markers;
- private writing;
- optional practice choices;
- streak rankings;
- motivation;
- contact information.

Aggregate progress should include only participants whose sharing choice allows
it. Small groups may require suppression or coarser reporting when an aggregate
would reveal one person's state.

### Shared posts

A shared prayer request, discussion post, announcement, or deliberately shared
reflection should be a separate shared record.

Do not store a pointer that gives the group live access to the participant's
private writing document.

If a participant chooses to share text derived from a private reflection, copy
only the text they deliberately submit to the stated audience.

Later editing/deleting the private source must not silently edit the group copy.
Shared content needs its own edit/delete controls.

Deleted shared content should not leave the readable body in ordinary member
access.

### Moderation

Future moderation data should support reports and accountable actions without
giving every organizer unrestricted access to private content.

Reporting an organizer needs an independent route.

A moderation action should identify the target record/revision and reviewer so
stale content is not accidentally actioned after meaningful edits.

## 33. Future messaging

Standalone direct messaging is not a committed product requirement.

If a later product decision adds messaging, model it separately from community
posts and require explicit recipient/member authorization.

Do not create unrestricted public direct messages, discovery, calls, presence,
attachment transfer, or contact-list exposure by default.

## 34. Deliberately omitted concepts

Do not add domain contracts merely because they are common in social or habit
applications.

The baseline does not require:

- public profiles;
- followers;
- public activity feeds;
- spiritual scores;
- achievement systems;
- custom user-created practices;
- scheduled future personal starts;
- prayer journals;
- mood scoring;
- AI interpretation of private spiritual writing;
- paid access;
- advertisements;
- export;
- attachments;
- youth account structures;
- arbitrary retention numbers.

A later product decision can add an approved concept with its own privacy and
lifecycle rules.

## 35. Validation and tests to establish

The domain layer should be backed by runtime validation and tests covering at
minimum:

- date format and calendar arithmetic;
- IANA time zones;
- day range `1–77`;
- practice selection `2–4`;
- foundational practice invariants;
- one active journey;
- lifecycle terminality;
- content-version pinning;
- Bible edition availability;
- expected-revision writing saves;
- no silent conflict overwrite;
- next-day practice-change semantics;
- ownership and Security Rules;
- future-community privacy boundaries if that feature is later built.

Types help developers reason about the system. They do not replace runtime
validation or backend authorization.
