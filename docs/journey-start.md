# Journey Start — Trusted Backend Contract

## Status

This document defines the server-authoritative journey-start boundary that
should be built. It does not assume that a Cloud Function, client service,
Firestore transaction, collection, rule, or test already exists.

## Why journey start is trusted

Starting establishes the participant's immutable calendar and creates the one
active journey allowed by V1.

A client should not be able to create an active journey by directly writing
arbitrary Firestore documents because the start operation must atomically
validate:

- authenticated identity;
- required email confirmation;
- setup ownership and readiness;
- valid practice selection;
- formation-course availability;
- selected Scripture-edition availability;
- today's reviewed calendar date;
- one-active-journey invariant;
- idempotency for repeated requests.

The target implementation should use a Firebase callable Cloud Function or
another equivalent authenticated trusted server boundary.

## Suggested operation

A clear name is:

`startJourney`

The final exported name can differ if project conventions require it, but the
semantics should remain stable.

## Suggested request

A request should contain only the participant-controlled and concurrency values
the server needs.

Example target shape:

```ts
interface IStartJourneyRequest {
	setupRevision: number;
	reviewedStartDate: TCalendarDate;
	reviewedTimeZoneId: TIanaTimeZoneId;
	deviceOperationId: string;
}
```

The server should resolve authoritative setup selections, course/version, and
account identity rather than trust duplicate client-supplied copies of those
values.

If the setup model requires explicit IDs in the request, validate them against
the owned setup record.

## Authentication

Reject the request when:

- no Firebase Authentication user is present;
- the authenticated account is not eligible to start;
- required email confirmation is not complete.

Do not accept a user ID supplied by the client as proof of ownership.

## Setup readiness

The setup used for start must:

- belong to the authenticated participant;
- be in a ready state;
- match the expected setup revision;
- contain two to four distinct valid additional practice IDs;
- contain an actually available selected Bible edition/version;
- reference the intended released course/version;
- contain only optional motivation/reminder data permitted by the product.

A stale setup revision should produce a conflict/review response rather than
starting with unseen choices.

## Practice validation

The backend must enforce:

- three foundational practices are implicit and fixed;
- selected additional practices are distinct;
- selected count is 2–4;
- every ID exists in the approved optional-practice catalog.

Do not trust UI disabled states as validation.

## Formation content readiness

Before the start is confirmed, the selected course/version must be suitable for
a 77-day journey.

At minimum:

- the course/version is released for new journeys;
- all 77 days and 11 weekly themes required by the release exist;
- the selected Bible edition is released;
- every assigned passage required for that edition is available;
- required edition metadata/acknowledgments are resolvable.

A catalog label alone is insufficient.

## Date review

The participant should see today's proposed start date and projected Day 77 date
before submitting Start.

The server should verify that:

- `reviewedTimeZoneId` is a valid IANA time-zone ID;
- `reviewedStartDate` equals the current calendar date derived for that zone at
  the trusted server check;
- the setup review is not stale.

If midnight has passed between review and confirmation, reject with a specific
review-outdated result and require the UI to show the new Day 1 / Day 77 dates.

Do not silently start on a date the participant did not review.

## One active journey

The operation must atomically enforce no more than one active journey for the
participant.

Two devices starting at nearly the same time must not create two active
journeys.

Use a transaction, lock/sentinel record, or another Firestore-safe invariant
pattern that can be covered by automated tests.

Do not rely on a client query followed by a client write.

## Idempotency

`deviceOperationId` should make a repeated request safe.

If the same authenticated participant retries the same start operation because a
response was lost, return the same confirmed result rather than creating another
journey.

Idempotency records must not become an unbounded source of sensitive history.
Define a practical retention strategy consistent with the final privacy
architecture before release.

## Atomic write set

A successful transaction should establish the minimum durable records needed for
the active journey.

Potential write responsibilities include:

- create the journey identity/lifecycle record;
- establish the one-active-journey ownership marker;
- pin the released course/version;
- pin the initial selected practices;
- record start date and starting time zone;
- copy the optional starting motivation into journey ownership where the product
  model requires it;
- mark or archive setup as consumed/started;
- preserve an auditable start operation result for idempotency.

Do not pre-mark any daily practice complete.

Do not create future participant completion records merely to fill a 77-row
structure.

## Suggested response

Return enough information for the client to navigate safely:

```ts
interface IStartJourneyResponse {
	journeyId: string;
	status: 'active';
	startDate: TCalendarDate;
	day77Date: TCalendarDate;
	courseId: string;
	courseVersionId: string;
}
```

The response should reflect committed server state.

## Failure categories

Prefer stable domain error categories rather than leaking raw Firebase errors.

Useful categories include:

- `unauthenticated`
- `email_not_confirmed`
- `setup_not_found`
- `setup_not_ready`
- `setup_conflict`
- `invalid_practice_selection`
- `course_unavailable`
- `bible_edition_unavailable`
- `review_outdated`
- `active_journey_exists`
- `temporarily_unavailable`

Participant-facing text belongs in the client voice layer.

## Existing active journey at request time

If an active journey already exists:

- never create a second one;
- if the request is a known retry of the operation that created it, return the
  idempotent result;
- otherwise return a typed active-journey conflict that lets the app navigate to
  the real journey.

Do not end or replace an active journey automatically.

## Starting motivation

The motivation is optional.

If present:

- preserve the participant's exact text;
- transfer/copy it into the new journey's private writing scope as defined by
  the domain model;
- do not make motivation nonempty as a start condition;
- do not publish it to future community data.

## Reminder settings

Reminder choices do not determine journey eligibility.

If setup collects them, persist them through the device-preferences workflow
rather than making the journey transaction depend on local notification
permission.

A participant can start with reminders disabled.

## Offline behavior

Journey start requires connection.

If the request has not been confirmed by the trusted backend, the client must
not display a definitive active journey.

After confirmation, content preparation for offline use is a separate state. The
UI should distinguish:

- journey confirmed;
- content preparing;
- content prepared.

Do not call the journey start failed merely because local content preparation is
still running.

## Security Rules

Security Rules should prevent a client from bypassing the trusted start
operation with equivalent direct writes.

Rules should also protect:

- participant ownership;
- immutable journey identity fields;
- terminal lifecycle fields where only trusted operations may change them;
- private motivation/writing.

The exact collection layout may vary, but the invariant must be testable.

## Tests to establish

### Authentication

- unauthenticated request is rejected;
- required unconfirmed email is rejected;
- another user's setup cannot be started.

### Setup

- incomplete setup is rejected;
- stale revision is rejected;
- one selected optional practice is rejected;
- five selected optional practices are rejected;
- duplicate or unknown practice IDs are rejected;
- valid 2, 3, and 4 selections are accepted.

### Content

- unavailable course/version is rejected;
- unavailable/withdrawn Bible edition is rejected;
- an edition missing an assigned passage is rejected.

### Dates

- reviewed local date starts as Day 1;
- Day 77 is 76 calendar days later;
- stale review across midnight is rejected;
- daylight-saving boundaries do not change the calendar-day count.

### Concurrency

- repeated operation ID is idempotent;
- two concurrent devices create no more than one active journey;
- stale setup revision cannot start after another setup update.

### Data

- foundational practices are present in day assignment semantics;
- no practice starts as complete;
- starting motivation is preserved exactly when supplied;
- empty motivation does not block start;
- journey pins the released course/version and selected Bible edition preference
  correctly.

### Security

- client cannot directly create an equivalent active journey in Firestore;
- one user cannot read/write another user's private start/setup records.

## Client behavior after success

After a confirmed response:

1. update local account/journey state;
2. navigate to Day 1 / Today;
3. begin or continue full-course local content preparation;
4. display preparation status without blocking ordinary connected use;
5. never repeat onboarding solely because local cache preparation is incomplete.

## Client behavior after uncertain failure

If the network drops after the request may have reached the server:

1. keep the `deviceOperationId`;
2. retry safely with the same operation ID;
3. query/resolve the actual active-journey state if needed;
4. do not offer a new start until uncertainty is resolved.

This prevents a connectivity problem from becoming a duplicate journey.
