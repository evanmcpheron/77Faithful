# 77Faithful Screen and Route Map

## Status

This is the target V1 navigation specification. It describes the route tree and access rules that should be created. It does not assume that any route file, navigator, screen component, or route guard already exists.

Product behavior in `product/11-pages-and-navigation.md` is authoritative. This document translates that behavior into an Expo Router-oriented route plan.

## Navigation model

V1 should use three primary signed-in destinations:

- **Today**
- **Journey**
- **Settings**

**Reflections** is a child destination within Journey.

Private Communities are a future direction and must not be visible as a V1 tab, drawer item, disabled teaser, or fake feed.

## Route groups

A maintainable Expo Router structure should distinguish:

1. public/account routes;
2. authenticated application routes;
3. primary tabs;
4. Journey child routes;
5. Settings child routes;
6. future community routes that are not registered in V1 release navigation.

The exact folder grouping can follow Expo Router conventions, but public URLs and participant behavior should remain stable.

## Target public routes

| Path | Surface | Purpose |
| --- | --- | --- |
| `/` | Account Entry | Explain 77Faithful briefly and offer Create account / Sign in. |
| `/register` | Create Account | Create a personal account. |
| `/confirm-email` | Confirm Email | Explain and complete email confirmation. |
| `/recover-access` | Recover Access | Restore access to an existing account. |
| `/about` | About & Help | Explain the product and provide support/contact information when real. |
| `/privacy` | Privacy | Explain participant privacy and data handling truthfully. |
| `/scripture-acknowledgments` | Scripture Acknowledgments | Show required edition and publisher acknowledgments. |
| `/themes` | Weekly Themes | Show the eleven-theme overview without exposing future daily content. |

Terms or other legal surfaces may be added when a real release requirement exists, but their existence should not be invented solely for navigation completeness.

## Target authenticated routes

| Path | Surface | Purpose |
| --- | --- | --- |
| `/onboarding` | Journey Setup | Resume the setup workflow until the participant deliberately starts. |
| `/today` | Today | Show the actual current reached journey day and assigned practices. |
| `/journey` | Journey | Show active/previous journey context, calendar/list, themes, and summary access. |
| `/reflections` | Reflections | Show private saved motivation, intentions, and reflections within Journey. |
| `/journeys/[journeyId]/days/[dayNumber]` | Journey Day | Review one reached day in context. |
| `/journeys/[journeyId]/days/[dayNumber]/scripture` | Scripture | Read the assigned passage and devotional. |
| `/journeys/[journeyId]/days/[dayNumber]/prayer` | Prayer | Use the day's prayer prompt and authored prayer. |
| `/journeys/[journeyId]/days/[dayNumber]/reflection` | Reflection | Review/save intention and reflection and separately manage Reflect completion. |
| `/journeys/[journeyId]/days/[dayNumber]/practices/[practiceId]` | Chosen Practice | Read guidance for one assigned additional practice. |
| `/journeys/[journeyId]/summary` | Journey Summary | Review a completed or early-ended journey accurately. |
| `/settings` | Settings | Entry point for preferences and account controls. |
| `/settings/practices` | Practice Settings | Review current selection and prepare a next-day change. |
| `/settings/account` | Account | Manage profile/contact state, sign-out, and deletion access. |
| `/settings/account/delete` | Delete Account | Explicit destructive-account confirmation workflow. |

Unknown paths should resolve to a clear not-found experience.

## Product screen mapping

The product specification describes conceptual pages P01–P27. They do not all require separate URLs.

### P01 — Product Introduction

Integrate the concise product introduction into the signed-out account-entry surface.

It should explain:

- the 77-day calendar;
- the three foundational practices;
- two to four additional practices;
- faithfulness rather than perfection;
- private reflection;
- permanent free access.

The introduction must not suggest that creating an account starts Day 1.

### P02 — Account Access

Use `/`, `/register`, and `/recover-access`.

Do not choose sign-in methods based on assumptions in documentation. The release should use the account methods deliberately selected and configured for the application.

### P03 — Confirm Email

Use `/confirm-email`.

A participant whose account requires confirmation should not reach private journey data until confirmation is complete.

### P04 — Recover Access

Use `/recover-access`.

Recovery restores an existing identity. It must not create a new journey or silently create a second account.

### P05–P10 — Journey setup

Use one `/onboarding` workflow with internal steps rather than creating a permanent public URL for every answer.

Recommended conceptual steps:

1. understand the commitment;
2. review the foundational practices;
3. choose two to four additional practices;
4. choose an actually available Bible translation;
5. optionally record a starting motivation;
6. optionally configure reminders;
7. review the start date, Day 77 date, time-zone behavior, and all practices;
8. deliberately choose **Start my journey**.

Progress should be resumable until the start is confirmed.

The practice-selection step must show **N selected · Choose 2–4**. Fewer than two is incomplete. Two, three, or four are valid. A fifth or duplicate selection is invalid.

### P11 — Today

Use `/today`.

Today must be derived from the active journey and the phone's current local calendar date/time zone.

It should not be driven by:

- count of complete days;
- last opened day;
- last complete day;
- a fake demo value.

### P12 — Historical Day

Use `/journeys/[journeyId]/days/[dayNumber]`.

Historical navigation should preserve the original journey/day context. A participant can update eligible history without shifting the current journey date.

### P13 — Scripture

Use the Scripture child route.

The page should contain:

- assigned reference;
- selected approved translation;
- full text when prepared and available;
- required acknowledgment;
- short devotional clearly distinguished from Scripture;
- manual completion action;
- clear return path.

### P14 — Prayer

Use the Prayer child route.

No writing is required. Prayer completion is manual.

### P15 — Reflection and Intention

Use the Reflection child route.

The day may contain both optional private intention writing and optional private reflection writing. Saving text and marking Reflect complete are separate operations.

### P16 — Chosen Practice guidance

Use the dynamic practice route.

The route must resolve only to a practice actually assigned to that day.

### P17 — Journey

Use `/journey`.

This is the home for calendar/list history, journey selection, theme overview access, Reflections access, and summary access.

### P18 — Theme Overview

Use `/themes` for the overview.

For a signed-in participant, a query such as `journeyId` and `weekNumber` may identify the relevant reached weekly introduction when needed. Future full introductions remain unavailable.

### P19 — Reflections

Use `/reflections` as a Journey child destination.

It should provide chronological private writing and a journey filter. Search and favorites are outside V1.

### P20 — Journey Summary

Use the journey summary route.

Completed and early-ended journeys require different factual labels.

### P21 — Settings

Use `/settings`.

### P22 — Practices

Use `/settings/practices`.

### P23 — Account

Use `/settings/account`.

### P24 — Appearance and reading preferences

These can be sections within Settings rather than separate routes unless the final design benefits from a dedicated screen.

### P25 — About, Privacy, and Scripture acknowledgment

Use the public informational routes and link to them from Settings.

### P26 — End Journey

Use an explicit confirmation flow launched from Journey/Settings. It does not need a permanent route if a modal or sheet provides clear, accessible confirmation.

### P27 — Delete Account

Use `/settings/account/delete`.

Account deletion must remain separate from ending a journey or deleting one reflection.

## Route access state

Navigation should be derived from a small set of meaningful product state:

- authentication state;
- email-confirmation state;
- account/setup state;
- active-journey state;
- requested journey/day ownership and access;
- network state only when a connected action requires it.

### Signed out

Allow:

- account entry;
- registration;
- sign-in;
- recovery;
- About;
- Privacy;
- Scripture acknowledgments;
- broad theme overview if intentionally public.

Do not expose private journey records.

### Signed in but email not confirmed

Direct the participant to Confirm Email while preserving a reasonable path to sign out or change account information.

### Confirmed account with no active journey and incomplete setup

Open/resume Journey Setup.

Previous journey history may remain accessible for a returning participant. Setup should not erase it.

### Confirmed account with one active journey

Primary entry should be Today.

Journey and Settings remain available.

### Confirmed account with no active journey but prior history

Journey should expose previous journeys and a deliberate **Start another journey** action.

Do not fabricate an active Today state.

## Account creation is not journey start

These are separate boundaries:

1. create account;
2. confirm account as required;
3. complete setup choices;
4. review today's start date;
5. call the trusted journey-start operation;
6. receive confirmation;
7. enter Day 1.

No earlier step should make a participant's 77-day calendar begin.

## Journey origin and back behavior

A day can be opened from Today, Journey, or Reflections.

When feasible, preserve meaningful origin:

- from Today → return to Today;
- from Journey history → return to Journey;
- from Reflections → return to Reflections.

A cold deep link should return to the logical parent rather than depend on a missing navigation history.

Do not put private writing or sensitive account information in a `returnTo` query string.

## Route parameters

### `journeyId`

Requirements:

- must identify a journey owned by the signed-in participant;
- must not grant access merely because the ID is known;
- must be validated against access rules;
- may reference an active, completed, or early-ended journey.

### `dayNumber`

Requirements:

- integer `1–77`;
- available only when reached under that journey's lifecycle;
- a future active-journey day must remain unavailable;
- an early-ended journey cannot expose days after its last reached day;
- a completed journey may expose all 77.

### `practiceId`

Requirements:

- must be a valid catalog practice ID;
- must actually be assigned to the referenced day;
- opening an unassigned catalog ID should not create an assignment.

## Suggested query parameters

Use query parameters only when they improve navigation without exposing private content.

Examples:

- `/journey?journeyId=...`
- `/reflections?journeyId=...`
- `/themes?journeyId=...&weekNumber=...`

Never place:

- reflection text;
- motivation text;
- email addresses;
- authentication credentials;
- invitation secrets;
- private message bodies

in a URL or analytics event.

## Future community route plan

The following routes describe a possible later private-community structure. They must not be exposed in V1:

- `/communities`
- `/communities/create`
- `/communities/join`
- `/communities/[communityId]`
- `/communities/[communityId]/members`
- `/communities/[communityId]/settings`
- `/communities/[communityId]/posts/compose`
- `/communities/[communityId]/posts/[postId]`

Future community access must depend on active membership and privacy rules.

An invitation URL may carry an opaque invitation token, but the token must not reveal email addresses, member lists, or private data.

## Future-content boundaries

The route tree must not accidentally unlock future formation content.

From the beginning, a participant may see:

- all eleven theme names;
- day ranges;
- short overview descriptions.

Before a future day/week is reached, do not show:

- daily Scripture references/text;
- daily devotional;
- daily prayer prompt;
- daily reflection question;
- full future weekly introduction;
- completion controls.

Routing should enforce the same boundary as UI buttons.

## Practice-change routing

A practice change affects the next journey day only.

The Settings flow should show:

- current selection;
- proposed selection;
- exact effective day/date;
- pending confirmation state;
- ability to revise/cancel before it takes effect.

A current/historical day route must continue resolving its original assignments.

## Not-found and unavailable states

Distinguish:

- invalid route;
- signed-out access attempt;
- unauthorized journey;
- future day;
- not-reached early-ended day;
- missing content;
- offline data not prepared;
- temporarily unavailable account state.

Do not collapse all of these into “Not found.”

## Expo Router implementation guidance

Use current Expo Router conventions for:

- route groups;
- layouts;
- tabs;
- nested stacks;
- dynamic segments;
- protected navigation;
- deep links.

Keep route files thin. Product access checks should be reusable and testable rather than duplicated in every route module.

Official Expo Router behavior may shape file organization, but it must not change the participant product rules above.
