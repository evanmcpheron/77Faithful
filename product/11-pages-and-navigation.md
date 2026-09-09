# 11 · Pages and Navigation

[Documentation guide](README.md)

**Authority:** This document owns the participant's destinations and how they connect. It describes pages and visible behavior, not the method used to build them.

## Main navigation

V1 has three primary destinations:

| Destination     | Main purpose                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Today**       | Engage with the current day's Scripture, prayer, reflection, and five practices.              |
| **Journey**     | Understand the current journey, inspect days and weekly themes, and review previous journeys. |
| **Reflections** | Browse private written intentions and reflections across journeys.                            |

**Settings** is consistently easy to reach from all three destinations. It does not need to become a fourth primary destination. Access should be labeled clearly rather than relying on an unfamiliar symbol without explanation.

Today is the default destination for a signed-in participant with an active journey. Opening a historical day does not redefine Today. A visible return to Today is available when the person is deep within history.

## Overall flow

**First visit:** Welcome → account access and confirmation → journey introduction → practice selection → translation selection → optional motivation → optional reminders → review and start → Today.

**Ordinary use:** Today → Scripture, Prayer, Reflect, or optional-practice guidance → Today.

**Historical use:** Journey → choose journey → choose reached day → historical day → reading, prayer, or reflection → return to the same historical day.

**Written history:** Reflections → choose an entry → its reflection/day → optionally open its Scripture or edit writing → return to Reflections.

**After the period:** Today → completed-journey summary → review history or start another journey.

All journeys remain personal in V1. There is no Community destination, invitation inbox, public profile, or shared feed hidden within this navigation.

## Screen inventory

The numbers below identify product destinations for discussion. They are not addresses, files, or instructions for building the app. Some closely related informational pages may share a consistent presentation, but the listed information and actions must remain available.

### P01 · Welcome and product introduction

**Purpose:** Explain the app before account creation or commitment.

**Shows:** Product name, concise mission, 77-day structure, five-practice explanation, permanent free access, privacy reassurance, and a way to inspect the broad theme overview.

**Actions and destinations:** Create account or sign in → P02. Learn about the journey → P05 or the public overview of P18. Read privacy and help → P25.

**Important states:** First visit, signed-out return, and arrival after account deletion. Do not display another participant's private name, progress, or writing here.

### P02 · Create account and sign in

**Purpose:** Establish or regain access to the correct personal account.

**Shows:** Clear choices for creating an account and signing in, the information needed for the chosen account-access experience, and recovery help.

**Actions and destinations:** Continue through confirmation → P03 when necessary. Recover access → P04. Return → P01. Successful returning access → the appropriate Today or unfinished setup state.

**Important states:** In progress, invalid information, interrupted attempt, unavailable connection, existing account, and confirmed access. Explain failures in plain language without exposing another person's private account details.

### P03 · Confirm email

**Purpose:** Confirm the contact email before starting a journey.

**Shows:** The address being confirmed, clear instructions, confirmation status, and how to correct the address.

**Actions and destinations:** Complete confirmation → unfinished setup or the existing account destination. Request another confirmation, correct the address, or return to account access.

**Important states:** Awaiting confirmation, unsuccessful or expired confirmation, a new request still pending, and success. This page must not start the journey by itself.

### P04 · Recover account access

**Purpose:** Help the participant regain the same account instead of unnecessarily creating another.

**Shows:** The required recovery steps, next action, and an explanation that successful recovery restores access to the existing journey.

**Actions and destinations:** Request and complete recovery → P02 or the existing account. Retry or return safely.

**Important states:** Awaiting a response, a request that cannot be completed, and successful recovery. Never promise that a new empty account contains the person's former history.

### P05 · Journey introduction

**Purpose:** Explain the commitment before setup.

**Shows:** The three foundational practices, the two-choice structure, eleven-week progression, calendar-based days, the no-reset rule, and optional private writing.

**Actions and destinations:** Continue → P06. Inspect weekly overview → P18. Return to Welcome or account setup as appropriate.

**Important states:** First-time introduction and a shorter returning-participant review. Reading an introduction is not a practice completion.

### P06 · Choose additional practices

**Purpose:** Select exactly two distinct catalog practices.

**Shows:** The fixed foundational three, the optional catalog, clear descriptions, current selections, and the count out of two.

**Actions and destinations:** Read a practice description, select or deselect, continue → P07 when the pair is valid, or return to review earlier choices.

**Important states:** Zero, one, and two choices; an attempted duplicate or third choice; resumed setup. Explain what prevents continuing.

### P07 · Choose Bible translation

**Purpose:** Make a clear selection from the translations actually available.

**Shows:** Full names, abbreviations, exact edition where relevant, the selected choice, and any preparation or availability information needed before switching.

**Actions and destinations:** Choose and confirm → next setup step, return to the reader, or return to Settings, depending on where the person came from.

**Important states:** No selection yet, preparing a different translation, no internet, or a failed change. Keep the current readable translation available when a replacement is not ready. No premium or pay-to-unlock choices appear.

### P08 · Starting motivation

**Purpose:** Offer an optional private starting reflection for the journey as a whole.

**Shows:** One invitation, a free-form field, optional/private labels, and a visible Skip action during setup.

**Actions and destinations:** Save and continue → P09; skip → P09; later review, edit, or delete from journey details or the summary.

**Important states:** Empty, draft, saved, edited after the start, and confirmed deletion. This is not required to start or finish a journey and is not counted as a daily written reflection.

### P09 · Reminder preferences

**Purpose:** Let the participant choose whether and when the app reminds them.

**Shows:** Separate morning and evening choices, times, their on/off state, and an explanation that times follow this phone's local clock.

**Actions and destinations:** Enable with permission, change times, disable, skip during setup, or return to Settings.

**Important states:** Permission not yet requested, permitted, denied by the phone, disabled in the app, and no active journey. The app remains usable in every state.

### P10 · Review and start

**Purpose:** Make the commitment and dates explicit before Day 1 begins.

**Shows:** All five practices, translation, start and final-day dates, fixed journey time zone, optional reminder state, and the no-reset explanation.

**Actions and destinations:** Edit setup choices; select **Start my journey** → P11 after confirmation; leave setup without starting.

**Important states:** Ready, date changed while reviewing, start awaiting confirmation, confirmed active journey, unavailable connection, and a previously existing active journey. Repeated actions must not create multiple journeys.

### P11 · Today

**Purpose:** Serve as the home for the actual current journey day.

**Shows during an active journey:** Day X of 77, journey date, current weekly theme, assigned Scripture reference, five practices with individual states, X of 5 progress, optional intention, and relevant saved-work or reading-availability notices.

**Actions and destinations:** Read Scripture and devotional → P13. Pray → P14. Reflect or write an intention → P15. Read optional-practice guidance → P16. Inspect the theme → P18. Mark or unmark a practice directly with a separate completion control. Open Journey, Reflections, or Settings.

**Important states:** No active journey with setup available; active day with zero, partial, or full completion; final day; a completed or early-ended journey with summary access; temporarily determining the existing account state; use without internet; a day that changes while the page is open.

Today must not show a fictional Day 78. After the period, it presents the completed state and a clear path to the summary or a new journey. It must not force the participant to start again to get past the home screen.

### P12 · Historical day

**Purpose:** Review and update an eligible earlier day without confusing it with Today.

**Shows:** Journey context, original date and day number, historical label, that day's theme and assigned practices, existing completion, saved writing, and an indication of later updates when applicable.

**Actions and destinations:** Open the day's Scripture, Prayer, Reflect, or practice guidance; mark or unmark completion; navigate to eligible neighboring days; return to the originating journey or Reflections; return to Today.

**Important states:** Complete, partial, no practices marked, not available on this phone, and no longer part of the reached portion after an early ending. Future and not-reached days do not open as editable historical days.

### P13 · Scripture and devotional

**Purpose:** Read the assigned passage with the app's supporting devotional clearly separated.

**Shows:** Day context, reference, translation label, complete assigned Scripture text, required acknowledgments, the devotional under its own heading, and the current Scripture-practice status.

**Actions and destinations:** Change translation → P07; adjust reading appearance → P24; mark or unmark Scripture complete; return to the day that opened the reader.

**Important states:** Ready, preparing text, unavailable translation or passage, no internet before preparation, and historical content with a material correction notice. Opening or scrolling never automatically completes the practice.

### P14 · Prayer

**Purpose:** Provide the day's focused prompt without collecting proof of prayer.

**Shows:** Day context, the prompt, a brief invitation to pray in the participant's own words, and the completion control.

**Actions and destinations:** Mark or unmark Pray complete; return to the originating day.

**Important states:** Not marked and complete. There is no prayer timer, required text field, recording, or assessment.

### P15 · Reflection and intention writing

**Purpose:** Reflect on the day and optionally retain personal writing.

**Shows:** Day context, primary reflection question, an existing intention when present, clearly separate optional intention and reflection fields, save status, privacy reassurance, and the independent Reflect completion control.

**Actions and destinations:** Write or edit either field, save, delete the relevant saved writing after confirmation, mark or unmark Reflect, review the day's Scripture, or return to the originating day or Reflections.

**Important states:** Empty, unsaved draft, saved on this phone, safely available to the account, late update, unavailable saving, and unresolved competing edits from another phone. The participant can complete Reflect with both text fields empty.

The intention field does not have a completion checkbox. Starting motivation is separate and remains in P08.

### P16 · Optional-practice guidance

**Purpose:** Explain one of the participant's selected practices and offer suitable examples.

**Shows:** The practice name, plain-language purpose, examples, relevant safety boundaries, day context, and completion status.

**Actions and destinations:** Mark or unmark the practice; return to the day; open My Practices → P22 when a future selection change is available.

**Important states:** Current-day assignment, historical assignment, complete, and not complete. A historical page explains its original practice; it does not substitute the current selection.

### P17 · Journey overview and history

**Purpose:** Orient the person within the current or a previous journey.

**Shows:** Journey selection, dates and status, current position where applicable, 77-day overview, readable day list alternative, modest statistics, and access to the starting motivation and theme overview.

**Actions and destinations:** Open an eligible day → P11 or P12; inspect themes → P18; inspect the summary → P20; review motivation → P08; end an active journey → P26; start another → P10 through the required review when no journey is active.

**Important states:** No journeys, active, completed, early-ended, future days, not-reached days, and history unavailable on the current phone. The overview distinguishes unavailable history from genuinely empty history.

### P18 · Course overview and weekly introduction

**Purpose:** Explain the eleven-week progression and the currently available weekly teaching context.

**Shows:** All eleven theme names, ranges, and short descriptions. Current and past weeks offer their full introductions; future weeks show only their overview description.

**Actions and destinations:** Read an available weekly introduction, open an eligible day from that week, or return to Today, Journey, or the public product introduction.

**Important states:** Public overview before starting, available week, future week, completed course, and the reached portion of an early-ended course. The public overview does not expose private journey data.

### P19 · Reflections collection

**Purpose:** Browse saved personal day-based writing.

**Shows:** Newest-assigned-date-first entries, journey filter, date and day context, optional private text preview, entry type, and later-update indication where relevant.

**Actions and destinations:** Open an entry → P15 or its day context; change the journey filter; return to Today, Journey, or Settings.

**Important states:** No writing yet, intention-only entries, written reflections, multiple journeys, and writing not yet available on this phone. No search bar, favorites control, or sharing action appears in V1.

### P20 · Journey summary

**Purpose:** Review an ended period accurately and consider what comes next.

**Shows:** Completed or early-ended status, appropriate dates and denominators, personal recorded statistics, optional motivation, access to Day 77's reflection when reached, and an invitation to continue in faith.

**Actions and destinations:** Review days → P17/P12; review writing → P19/P15; review motivation → P08; start another journey when eligible.

**Important states:** Preliminary final-day view, completed period, early ending, and historical changes that update the summary. A preliminary Day 77 view is not labeled as an already elapsed period.

### P21 · Settings

**Purpose:** Provide a consistent place to manage personal preferences and account-related actions.

**Shows:** My Practices, Bible translation, reminders, reading appearance, account information, privacy, Scripture acknowledgments, help, About, and Sign out. Journey details may be linked where relevant.

**Actions and destinations:** Open the relevant settings page. Return to the primary destination that opened Settings.

**Important states:** Active journey, no active journey, and actions requiring a connection. There is no premium screen, advertisement preference, donation prompt, community administration, or public profile in V1.

### P22 · My Practices and next-day change

**Purpose:** Review current optional selections and confirm a valid replacement beginning the next journey day.

**Shows:** The foundational practices, current pair, any upcoming confirmed pair, proposed changes, and exact effective day/date.

**Actions and destinations:** Choose one or two replacements, confirm, revise or cancel the upcoming pair, or return without changing anything.

**Important states:** No change, awaiting confirmation, confirmed next-day change, unavailable connection, Day 77 with no later day, and no active journey. No historical practice reassignment is offered.

### P23 · Account information and access

**Purpose:** Manage the optional preferred name, contact information, and account access.

**Shows:** Current name and email, accurate confirmation status for an email change, access-management options, Sign out, and clearly separated permanent deletion.

**Actions and destinations:** Edit name, begin and confirm contact changes, recover or update access as supported by the chosen account experience, sign out, or open P27.

**Important states:** Pending contact confirmation, canceled change, unavailable connection, and confirmed update. A changed email does not become a second account or a new journey.

### P24 · Reading appearance

**Purpose:** Make reading comfortable and accessible.

**Shows:** Light, dark, or follow-phone appearance; readable text-size controls; a clear preview of the effect.

**Actions and destinations:** Change a preference and return to the reader or Settings. Larger-text and assistive-reading needs remain respected throughout the app, not only on this page.

**Important states:** Each appearance preference and enlarged text. Choices do not affect content, completion, or another participant's account.

### P25 · Help, About, privacy, and Scripture acknowledgments

**Purpose:** Explain the product, provide a real support route, disclose privacy practices, and credit Scripture appropriately.

**Shows:** Relevant product explanation, common questions, contact/report options, privacy and deletion information, and the acknowledgments for the translations actually offered.

**Actions and destinations:** Read an explanation, report a product or content problem without compulsory journal disclosure, view the relevant policy, and return.

**Important states:** Signed out or signed in as appropriate. The support address must be real before release; no invented placeholder may be presented as a functioning contact. No response-time or pastoral-monitoring promise is made without an actual service behind it.

### P26 · End-journey confirmation

**Purpose:** Make the consequences of an early ending explicit.

**Shows:** Which active journey will end, retained history, the inability to resume it, the cutoff for reached days, and the option to keep going.

**Actions and destinations:** Cancel → current journey. Confirm while connected → early-ended summary.

**Important states:** Awaiting confirmation, unsuccessful attempt, and confirmed ending. The action is not described as deleting the journal or resetting to Day 1.

### P27 · Permanent account deletion

**Purpose:** Let the participant deliberately request removal of the account and its personal records.

**Shows:** The affected account and information, actual retention disclosures, identity-confirmation steps, irreversible consequences, and an unambiguous cancel option.

**Actions and destinations:** Cancel → Account settings. Confirm while connected → accurate deletion status and then the signed-out experience when completed.

**Important states:** Not confirmed, in progress, failed, and completed. Do not describe a merely requested deletion as already finished.

## Cross-page rules

A detail page returns to the day, journey, or list that opened it. Opening a historical reflection must not lead back to Today as though the historical context never existed.

Saved completion changes should be reflected wherever the same day is shown. Unrelated writing or another day's record must not be overwritten by changing one practice.

Unsaved writing receives a clear Save, Keep editing, or Discard choice before ordinary navigation removes it. A date change must not move the text to another day.

Unavailable information is described accurately: checking for an existing account, no records yet, no internet, and a failed action are different states. A blank screen or indefinite unexplained waiting indicator is not an adequate product state.

Sensitive writing must not be exposed on public pages, signed-out screens, or reminder previews. A link or reminder leading to private content must first establish access to the correct account.
