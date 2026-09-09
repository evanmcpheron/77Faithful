# Journey start and Today

The final onboarding action is **Start my journey**. It saves the latest setup and calls `startJourney` using the existing start request/result contracts. The account route guard opens Today when its server-backed journey subscription confirms a journey. A failed start keeps the setup available; a stale revision requires loading and reviewing the saved setup. A changed date requires another deliberate start action.

The callable requires a signed-in account with confirmed email and an existing profile. It derives Day 1 in the reviewed phone time zone, checks the setup revision and published content, and transactionally creates `users/{userId}/journeys/{journeyId}`. That record fixes the start date, course version, and initial practices. Its `timeZoneId` records the phone zone at start; current days follow the phone’s current zone. Day 77 completion is evaluated in the current phone zone supplied to the start request. Once confirmed, completion remains terminal. Reminder preferences retain local clock times; notification scheduling is not yet implemented. Account Bible translation preferences are saved at `users/{userId}/preferences/current`; device reminder preferences remain unchanged.

`users/{userId}/journeyControl/current` serializes starts across devices. Actor-scoped receipts at `users/{userId}/journeyStartOperations/{operationId}` retain the original result, including after the original journey ends. A different operation returns an existing active journey. An elapsed active period is reconciled to Completed before a new start commits. Firestore rules continue to prohibit client writes to journeys and default-deny access to these server-only control records.

The draft and its writing history are retained. Starting motivation also receives an initial journey writing revision with the existing text and provenance. No `isSaved` or `isStarted` field is added to the draft or profile.

Today reads the newest journey and shows its actual calendar day, current phone time zone, weekly theme, foundational practices, initial Chosen Practices, and starting motivation. It handles loading, errors, clock discrepancies, ended journeys, and the end of Day 77. This first screen does not yet implement daily reading views, practice completion, practice changes, or daily writing.

## Publishing prerequisites

Starting is intentionally unavailable until a real complete course and the selected translation are published. The [provisional course importer](../content/provisional-course/README.md) supplies 77 candidate readings with exact WEB text and working devotional content. It creates versioned content without changing existing journeys. Other translations require their own released text.

The server expects the following admin-managed documents:

- `formationConfiguration/current`: `courseId`, `courseVersionId`, and `bibleTextEditionIds` mapping each available `TBibleVersionId` to its exact edition ID.
- `formationCourses/{courseId}/versions/{courseVersionId}`: the shared published course-version contract.
- `formationCourses/{courseId}/versions/{courseVersionId}/days/{dayContentId}`: all 77 shared day-content records, with unique day numbers, matching week/theme, and authored guidance.
- `formationCourses/{courseId}/versions/{courseVersionId}/weekIntroductions/{weekIntroductionId}`: all 11 shared introduction records.
- `scriptureAssignments/{scriptureAssignmentId}`: the shared assignment contract.
- `bibleTextEditions/{bibleTextEditionId}`: a released edition with acknowledgments and source revision.
- `bibleTextEditions/{bibleTextEditionId}/assignmentTexts/{scriptureAssignmentId}`: the complete assigned passages in that edition for each of the 77 days.

These paths are server-only in the current rules. Reader access and content publishing are separate work. A publication status must only be set after editorial and translation-release review; runtime structural validation cannot establish those approvals.

## Build and verification

`scripts/prepare-functions.cjs` copies the read-only canonical contracts and shared calendar implementation into ignored `functions/generated/`. Functions compiles its own source plus those generated inputs into `functions/lib/`; its entry point is `lib/src/index.js`. This keeps the Firebase upload self-contained without a second hand-maintained contract layer or new dependency. Run Functions commands from the repository checkout, where the canonical sources are available; Firebase predeploy runs preparation before upload.

```sh
npm --prefix functions run build
node --test tests/start-journey.test.cjs tests/journey-setup.test.cjs tests/journey-access.test.cjs tests/route-access.test.cjs
npm --prefix functions run lint
npx --no-install tsc --noEmit
npm run format
npm run lint
```

The start tests use a local transaction double with optimistic-conflict retries and atomic commits. They cover start, retry receipts, competing requests, stale setup and dates, unavailable content, failed commits, motivation transfer, authentication, time zones, and elapsed periods. They do not replace live/emulator integration tests.

Deploy `startJourney` after verifying the intended Firebase project and publishing eligible content. Local implementation does not deploy the callable or publish content.
