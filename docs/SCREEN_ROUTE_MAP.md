# 77Faithful screen route map

**Delivered status: Title-only route scaffold — not functional V1**

The product requirements in [product/README.md](../product/README.md) and its numbered documents remain authoritative for the eventual experience. This implementation phase provides 22 personal-product screen files, eight disabled future-community screen files, and one not-found screen: **31 screens and three layouts**. Dynamic routes are reusable screens, not individual journey, day, practice, community, or post records.

## What exists now

Every screen body renders exactly one literal title through `SeventySevenScreenPlaceholder`, exported from `src/components/core/index.ts`. The shared component uses Tamagui stacks, the existing `SeventySevenText` heading size, theme background/text tokens, horizontal padding, and all four safe-area insets. Text can scale and wrap; the title has a heading accessibility role. Expo Router's installed `ExpoRoot` supplies `SafeAreaProvider`, so the app adds no redundant provider.

The root layout retains the existing Tamagui configuration and phone-following light/dark selection. All three layouts use headerless stacks when their children are enabled. Only `src/app/index.tsx` owns `/`, which directly renders **Sign In**. There is no app-group index, Welcome screen, duplicate sign-in route, navigation bar, screen directory, or clickable prototype. The unreferenced onboarding demo remains outside the routes.

Public routes are inspectable without a session or data fixture. `(app)` is the authenticated area: its layout waits for Firebase's initial authentication state and redirects signed-out visitors to `/`. No forms, parameters, private data access, Scripture, notifications, business workflows, or navigation controls are implemented. Server-side data access still requires ownership checks and Firebase Security Rules; a client route guard or feature flag is not a security boundary.

## Actual route tree

```text
src/app/
├── _layout.tsx
├── index.tsx
├── register.tsx
├── confirm-email.tsx
├── recover-access.tsx
├── about.tsx
├── privacy.tsx
├── scripture-acknowledgments.tsx
├── themes.tsx
├── onboarding.tsx
├── +not-found.tsx
└── (app)/
    ├── _layout.tsx
    ├── today.tsx
    ├── journey.tsx
    ├── reflections.tsx
    ├── journeys/
    │   └── [journeyId]/
    │       ├── summary.tsx
    │       └── days/
    │           └── [dayNumber]/
    │               ├── index.tsx
    │               ├── scripture.tsx
    │               ├── prayer.tsx
    │               ├── reflection.tsx
    │               └── practices/
    │                   └── [practiceId].tsx
    ├── settings/
    │   ├── index.tsx
    │   ├── practices.tsx
    │   └── account/
    │       ├── index.tsx
    │       └── delete.tsx
    └── communities/
        ├── _layout.tsx
        ├── index.tsx
        ├── create.tsx
        ├── join.tsx
        └── [communityId]/
            ├── index.tsx
            ├── members.tsx
            ├── settings.tsx
            └── posts/
                ├── compose.tsx
                └── [postId].tsx
```

## Exact personal-product titles and later responsibilities

These responsibilities are planned, not rendered or functional.

| URL                                                             | Exact title               | Later responsibility                                                                                     |
| --------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                                                             | Sign In                   | Returning account access, registration/recovery entry points, and brief product context.                 |
| `/register`                                                     | Create Account            | Account creation without starting a journey.                                                             |
| `/confirm-email`                                                | Confirm Email             | Pending, expired, resend, correction, and completion states.                                             |
| `/recover-access`                                               | Recover Access            | Chosen recovery method, request, and outcome states. No assumed password flow.                           |
| `/about`                                                        | About & Help              | Introduction, practical help, support/content reporting, and public information links.                   |
| `/privacy`                                                      | Privacy                   | Privacy information and accurate deletion/retention disclosures.                                         |
| `/scripture-acknowledgments`                                    | Scripture Acknowledgments | Credits for translations actually offered.                                                               |
| `/themes`                                                       | Weekly Themes             | Eleven-theme overview and eligible weekly introductions.                                                 |
| `/onboarding`                                                   | Set Up Your Journey       | Guided setup, saved steps, review, and deliberate start.                                                 |
| `/today`                                                        | Today                     | Actual current day, no-active-journey, final-day, and ended-period home states.                          |
| `/journey`                                                      | Journey                   | Active/previous selection, calendar/list history, secondary statistics, and journey motivation.          |
| `/reflections`                                                  | Reflections               | Private saved day-based intentions/reflections with a journey filter.                                    |
| `/journeys/[journeyId]/days/[dayNumber]`                        | Journey Day               | A specific reached day's context and practices, including historical review.                             |
| `/journeys/[journeyId]/days/[dayNumber]/scripture`              | Scripture                 | Assigned passage and clearly separated devotional.                                                       |
| `/journeys/[journeyId]/days/[dayNumber]/prayer`                 | Prayer                    | Focused prayer prompt and independent completion.                                                        |
| `/journeys/[journeyId]/days/[dayNumber]/reflection`             | Reflection                | Reflection question, separate optional intention/reflection writing, and independent Reflect completion. |
| `/journeys/[journeyId]/days/[dayNumber]/practices/[practiceId]` | Practice Guidance         | One catalog practice assigned to this day.                                                               |
| `/journeys/[journeyId]/summary`                                 | Journey Summary           | Preliminary final-day, completed-period, and early-ended summary states.                                 |
| `/settings`                                                     | Settings                  | Translation, reminders, appearance, and practices/account/information access.                            |
| `/settings/practices`                                           | My Practices              | Current/pending selections and next-day replacement review.                                              |
| `/settings/account`                                             | Account                   | Preferred name, contact/access management, sign-out, and deletion access.                                |
| `/settings/account/delete`                                      | Delete Account            | Deliberate deletion, identity confirmation, consequences, and accurate request status.                   |

## Exact future-community titles and later responsibilities

All eight routes share one disabled subtree. These files do not deliver community features or make them part of V1.

| URL                                         | Exact title        | Later responsibility                                                                                                         |
| ------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/communities`                              | Communities        | Participant's private communities, creation, and joining entry points.                                                       |
| `/communities/create`                       | Create Community   | Deliberate creation flow.                                                                                                    |
| `/communities/join`                         | Join Community     | Invitation entry/preview, explicit acceptance, cancellation, invalid/expired states.                                         |
| `/communities/[communityId]`                | Community          | Shared schedule, announcements, prayer/discussion sections, enrollment, and permitted high-level progress.                   |
| `/communities/[communityId]/members`        | Community Members  | Membership, organizer invitation controls, and member-specific safety actions.                                               |
| `/communities/[communityId]/settings`       | Community Settings | Member preferences, organizer controls, shared-journey configuration, private safety/moderation controls.                    |
| `/communities/[communityId]/posts/compose`  | Write a Post       | Shared composer for creating/editing prayer requests, discussions, and announcements, with deliberate audience confirmation. |
| `/communities/[communityId]/posts/[postId]` | Community Post     | Shared post/thread detail, replies, author actions, and safety actions.                                                      |

Unknown URLs use `+not-found.tsx`, whose only visible title is **Page Not Found**. Fixed community `create`, `join`, and post `compose` paths identify their dedicated screens rather than dynamic resource detail.

## Product-ID coverage and consolidation

P01–P27 identify product destinations and interactions in [Document 11](../product/11-pages-and-navigation.md), not one file per identifier. Consolidation preserves their information, actions, and states for later implementation.

| Product coverage                                                                                         | Assigned destination or interaction                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 introduction; P02 account entry                                                                      | Sign In and Create Account retain concise context and access to About & Help / Weekly Themes. Introduction remains available before commitment; no compulsory Welcome route.                                                      |
| P03 confirmation                                                                                         | One Confirm Email screen contains pending, expired, resend, correction, and success states.                                                                                                                                       |
| P04 recovery                                                                                             | One Recover Access screen; provider-specific details wait for the chosen access method. No speculative reset, OAuth-callback, or magic-link routes.                                                                               |
| P05 commitment; P06 practice selection; P07 translation; P08 motivation; P09 reminders; P10 review/start | Internal steps within `/onboarding`, including exactly two distinct catalog practices, optional motivation/reminders, and deliberate review/start. Authentication uses account routes, not a duplicate onboarding account screen. |
| P07 after setup                                                                                          | Reusable focused translation selector over Settings or Scripture; reused within onboarding. No translations/settings-translation route.                                                                                           |
| P08 after setup                                                                                          | Editable section in the selected Journey, accessible from its summary. Separate from day-based writing and Reflections statistics; no motivation route.                                                                           |
| P09 after setup                                                                                          | Independent morning/evening preferences in Settings; optional shared controls in onboarding. No reminder inbox or notification-settings route.                                                                                    |
| P11 Today                                                                                                | Normal, no-active-journey, final-day, ended-period, and completion-count states share `/today`.                                                                                                                                   |
| P12–P16 day/practice detail                                                                              | Journey Day, Scripture, Prayer, Reflection, and Practice Guidance are the five canonical day-related files. Today and history reuse them; no parallel today/history reader routes.                                                |
| P17 history                                                                                              | Journey includes selected-journey context, previous journeys, calendar/list, secondary statistics, and motivation. No Past Journeys, statistics, or duplicate details screen.                                                     |
| P18 themes                                                                                               | `/themes` combines overview and expandable/focused eligible introductions. No eleven weekly files or mandatory separate introduction screen.                                                                                      |
| P19 writing                                                                                              | Reflections collection opens the existing day Reflection editor, including intention-only entries. No second journal app.                                                                                                         |
| P20 summaries                                                                                            | One journey-scoped summary with accurate status; no congratulations, certificate, or early-ending screen.                                                                                                                         |
| P21–P23 settings                                                                                         | Secondary Settings with My Practices and Account as substantial children. Settings is not a fourth V1 primary destination.                                                                                                        |
| P24 appearance                                                                                           | Settings controls and a focused reader control/sheet; no appearance route.                                                                                                                                                        |
| P25 information                                                                                          | Combined About & Help plus independently referenceable Privacy and Scripture Acknowledgments.                                                                                                                                     |
| P26 ending                                                                                               | Selected Journey owns a confirmation dialog, followed by its summary after successful connected confirmation. No end-journey route.                                                                                               |
| P27 deletion                                                                                             | Dedicated Account child for identity, scope, consequences, and truthful request status.                                                                                                                                           |
| Save/discard, delete writing, sign-out warnings, conflicting drafts                                      | Local states/dialogs in the responsible screen. No confirmation center, sync dashboard, or error collection.                                                                                                                      |
| Community prayer/discussion/announcements                                                                | Community sections/filters and shared post detail/composer. Writing and audience confirmation justify one focused composer, not one per post type.                                                                                |
| Community shared journey                                                                                 | Configuration in Community Settings; presentation/enrollment/progress in Community. Eligible participants reuse personal journey/day routes after explicit start.                                                                 |
| Community reporting, leaving, removal, organizer transfer/closure                                        | Contextual controls and confirmations in post, members, or settings. Reports stay private with a path independent of a reported organizer; no public moderation feed.                                                             |

## Planned account flow and main navigation

None of the following routing or controls are wired in this phase.

Signed-out entry begins at Sign In, with Create Account, Recover Access, About & Help, Privacy, Scripture Acknowledgments, and Weekly Themes available as appropriate. Registration and confirmation alone never begin Day 1. Sign-out and completed deletion eventually return to Sign In with public information accessible and former private context removed.

After real account access exists, incomplete confirmation goes to Confirm Email; unfinished setup resumes its saved step; an active-journey participant goes to Today. Ended history remains accessible without forcing another start. Successful access and recovery must not create another journey. The underlying sign-in method is not settled by Firebase's presence.

Onboarding is one internal stepper. Repeat participants reuse it with a shorter introduction and review their selections. Only explicit, connected confirmation of **Start my journey** creates a journey; that action is not implemented here.

V1's primary destinations are **Today, Journey, and Reflections**, with consistent labeled Settings access. No navigation bar, buttons, links, or tabs render now. A future released community feature can add Communities as a conditional fourth destination. Changing the local flag alone does not authorize launching communities or satisfy their release prerequisites.

## Planned origin and return context

Today will open Scripture, Prayer, Reflection, and Practice Guidance with the real current `journeyId` and `dayNumber`. Journey opens a reached day and then those same focused screens. Reflections opens the correct journey/day's existing Reflection screen.

Ordinary back navigation must preserve the actual stack. Scripture opened from a historical reflection returns to that reflection, then its collection, rather than losing context at Today. A cold link to a focused day screen falls back to its own Journey Day; the day or summary falls back to Journey with the same journey selected. No generic `returnTo` URL scheme, navigation context store, or custom back handler exists now.

## Planned parameter contracts

| Parameter     | Meaning and later checks                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `journeyId`   | A particular personal journey; establish session and ownership before private loading.          |
| `dayNumber`   | Numbered day, eventually validated as an integer from 1 through 77 and checked for eligibility. |
| `practiceId`  | One of that day's assigned catalog practices, not unrestricted custom content.                  |
| `communityId` | A future community resource requiring appropriate membership/access checks.                     |
| `postId`      | A future post resource requiring appropriate community and post permissions.                    |

Optional query contracts for later use: `/journey?journeyId=…` selects a journey; `/reflections?journeyId=…` filters its collection; `/themes` may receive `journeyId` and `weekNumber` to retain the source course and focus an eligible week. `/communities/join` may receive an invitation identifier, and the composer may receive `postId` to edit an existing post.

The title-only components do not read or validate parameters, infer a default journey, or display identifiers. Future code must validate parameters and ownership before loading private content. Email addresses, private writing, motivations, and serialized records do not belong in URLs. Invitation and recovery credentials must not be logged or included in example data.

## Essential boundaries for later implementation

Future and not-reached days remain unavailable; Today never becomes Day 78. Historical screens remain attached to their original journey/day across midnight and later journey starts. Optional-practice guidance before a journey exists stays inline in setup rather than inventing an identifier for a historical route. The calendar, fixed time zone, reached-day rules, next-day practice replacement, and one-active-journey requirement remain unchanged.

Public Themes shows only the permitted broad overview. Full introductions require an eligible journey context with authentication and ownership checked before private loading; arbitrary query parameters grant no access.

Daily intention and reflection share one screen but remain distinct optional fields. Writing is not required for Reflect; saving is not completion. The devotional stays within Scripture and does not become a sixth practice or obligatory separate stop. Journey-level motivation stays separate from day-based writing.

Community membership, group enrollment, and personal journey start are distinct. Joining must not expose journals, silently end a personal journey, backdate records, or create a second active journey. A shared post is separate from the original private writing. Direct messages, public profiles, competitive progress, and unrestricted discovery are outside this scaffold and the defined community direction. Privacy, safety, moderation, conduct, and appropriate permissions must be established before community release.

## Community flag and inspection

`src/constants/feature-flags.ts` exports `featureFlags.areCommunitiesEnabled`, defaulting to **false**. `src/app/(app)/communities/_layout.tsx` imports it and returns declarative `<Redirect href="/today" />` while disabled, without rendering children. The root and app navigators are already mounted. This single gate covers the hub and every defined direct child URL. With the flag temporarily true, a headerless stack exposes all eight title placeholders for local inspection. Restore false afterward; the delivered value is false.

Run the existing `npm run web` command and use the address it actually prints. Append these direct paths; no preview menu or navigation links are part of the app:

```text
/
/register
/confirm-email
/recover-access
/about
/privacy
/scripture-acknowledgments
/themes
/onboarding
/today
/journey
/reflections
/journeys/preview-journey/days/1
/journeys/preview-journey/days/1/scripture
/journeys/preview-journey/days/1/prayer
/journeys/preview-journey/days/1/reflection
/journeys/preview-journey/days/1/practices/preview-practice
/journeys/preview-journey/summary
/settings
/settings/practices
/settings/account
/settings/account/delete
/communities
/communities/create
/communities/join
/communities/preview-community
/communities/preview-community/members
/communities/preview-community/settings
/communities/preview-community/posts/compose
/communities/preview-community/posts/preview-post
/this-route-does-not-exist
```

Preview identifiers are artificial URL examples only. They create no resources, load no data, and prove no authorization. Use the development server for dynamic inspection. Production static-host/deep-link behavior is a separate deployment check; the existing static output mode is unchanged and no fictional static journeys are generated.

## Validation record

Checks performed on September 9, 2026:

- Inspected the initially clean working tree, all repository instructions, every numbered product document, current routes/demo/text exports, configuration, relevant lockfile entries, and installed package sources. Baseline lint and TypeScript checks passed. No application test suite or test script was present.
- A local inventory assertion verified the exact 31 screen files and three layouts, named default exports, literal titles, eight community files, single root owner, and absence of helpers/configuration inside `src/app`. Generated route types were refreshed by the installed Expo development server, not edited or committed.
- `npm run format` completed successfully. Comparing tracked files with a snapshot from immediately before formatting found no unrelated formatting changes.
- `npm run lint` and `npx --no-install tsc --noEmit` passed. Expo reports the existing advisory about legacy ESLint configuration; no unrelated baseline failures were found.
- `npm run web` encountered the existing server on port 8081 and was declined without stopping it. `npm run web -- --port 8082` started the separate development server and printed `http://localhost:8082`. A direct HTTP request to `/` returned 200 with only Sign In in the rendered body.
- The in-app browser tool failed to connect with `codex/sandbox-state-meta: missing field sandboxPolicy`. The fallback used already-installed headless Chrome, an isolated temporary profile, and a temporary smoke script outside the repository; no tooling was installed.
- Chrome directly opened all 22 personal URLs and the unknown URL. Each had exactly the expected visible heading and body text, no visible navigation/controls, no horizontal overflow, and horizontal/vertical centering at a 390 × 844 viewport. No session, private data, or fixtures were supplied. An initial check exposed Tamagui v2's use of `role` rather than `accessibilityRole`; the shared title was corrected to `role="heading"` with level 1, and the checks then passed.
- With the flag false, all eight community URLs resolved to `/today`; a DOM observer saw no community heading during those loads. With the flag temporarily true, all eight displayed their specified titles, including fixed `create`, `join`, and `compose` paths. The flag was restored to false.
- Light and dark modes were inspected through screenshots and computed styles. The existing theme produced text/background colors `#050505` / `#f7f7f7` in light and `#ffffff` / `#141414` in dark. Scripture Acknowledgments remained centered and unclipped when browser text was enlarged from the existing 26px heading to 60px with 72px line height at 320 × 640; it wrapped to three lines. This is a browser layout stress check, not a native font-scaling certification.
- No uncaught browser runtime exceptions occurred in the successful smoke checks. Package manifests/lockfiles, Expo and TypeScript configuration, the demo, native projects, and backend integration remain unchanged.

Not tested: physical iOS/Android safe-area behavior, native system text scaling, screen-reader speech, production static hosting/deep links, or offline native launch. Safe-area handling was checked against the installed provider context and component source; the browser used zero insets. These checks do not establish functional V1, authentication, data authorization, privacy enforcement, community readiness, or all-platform release readiness.

## Technical references

The structure follows Expo Router's [file-routing concepts](https://docs.expo.dev/router/basics/core-concepts/), [route notation](https://docs.expo.dev/router/basics/notation/), and [navigation layouts](https://docs.expo.dev/router/basics/navigation-layouts/). The installed package's exports and types were inspected alongside the [Router API](https://docs.expo.dev/versions/latest/sdk/router/). [Protected routes](https://docs.expo.dev/router/advanced/protected/) concern the later access implementation; none is simulated here. Tamagui's [stacks](https://tamagui.dev/ui/stacks) supply the reusable layout primitives.
