# 16 · Product Acceptance Scenarios

[Documentation guide](README.md)

This document gives observable examples of the intended product. A non-technical reviewer should be able to follow a scenario and determine whether the experience matches the definition. These are acceptance requirements, not claims that checks have already passed.

The scenarios summarize rules from the specialist documents. An example does not introduce a different rule from its owner document.

## Introduction, accounts, and setup

| ID  | Situation                                                             | Expected participant experience                                                                                                           |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | A person opens the app for the first time.                            | They can understand the Christian purpose, 77-day structure, five to seven practices, privacy, and permanent free access before starting. |
| A02 | A person creates an account but leaves before starting.               | No journey begins and no numbered days pass for an unstarted journey.                                                                     |
| A03 | Email confirmation is incomplete.                                     | The person receives a clear path to finish, correct the address, or return. Start does not silently succeed.                              |
| A04 | The person selects one optional practice.                             | The app explains that two to four distinct selections are required.                                                                       |
| A05 | The person tries to select the same practice twice or add a fifth.    | The invalid selection is not accepted; the explanation is understandable.                                                                 |
| A06 | The person skips motivation and reminders.                            | They can still review and start once the required choices and account steps are complete.                                                 |
| A07 | The review stays open across midnight before Start is selected.       | The displayed actual starting date and final-day date are updated before confirmation.                                                    |
| A08 | Start is selected repeatedly or from two phones.                      | Only one active journey is confirmed, and the participant reaches that journey.                                                           |
| A09 | A returning participant signs into an account with an active journey. | They reach the actual current day, not a blank account or duplicate setup.                                                                |
| A10 | A person recovers access or changes their confirmed contact email.    | Their existing journey and private history remain associated with the same account.                                                       |

## Calendar and journey behavior

| ID  | Situation                                                                   | Expected participant experience                                                                                                    |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| A11 | A journey starts September 8, 2026.                                         | Day 1 is September 8, Day 77 is November 23, and the period ends when November 24 begins in the fixed journey time zone.           |
| A12 | Someone starts shortly before midnight.                                     | Day 1 is still the current date; the review explains when it ends. There is no hidden 24-hour extension or automatic future start. |
| A13 | The participant misses one entire day.                                      | The calendar advances normally and earlier records remain. There is no restart.                                                    |
| A14 | The participant returns five days after their last visit.                   | Today reflects the actual journey date, not the count of visits. Catch-up is optional.                                             |
| A15 | The participant changes phone time zones while traveling.                   | The journey's day numbers, dates, and assigned practices remain tied to its original time zone.                                    |
| A16 | A daylight-saving-time boundary occurs.                                     | No numbered day is lost, repeated, shortened out of existence, or added.                                                           |
| A17 | A participant selects a future day.                                         | They see when it becomes available without gaining access to its full daily reading or completion controls.                        |
| A18 | A participant reviews the course overview before starting.                  | All eleven theme names and brief descriptions are visible, but not the future daily content.                                       |
| A19 | A full week has not yet begun.                                              | Its brief description is visible, but its full introduction and future daily content remain unavailable.                           |
| A20 | Midnight occurs while the participant is writing on an open day.            | Their draft remains attached to that day; they can finish there as a historical update or go to the new Today.                     |
| A21 | The participant wants to alter a started journey's start date or time zone. | Those values are not editable. This does not prevent reviewing or honestly updating previous days.                                 |

## Practices and formation content

| ID  | Situation                                                                             | Expected participant experience                                                                                                |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A22 | The person opens any reached day.                                                     | Five to seven practices appear: the foundational three and the selection assigned to that day.                                 |
| A23 | The person opens or scrolls through Scripture but does not mark it complete.          | Scripture remains unmarked.                                                                                                    |
| A24 | The person reads the assigned passage in a printed Bible.                             | They can mark Scripture complete without an in-app reading session.                                                            |
| A25 | The person reads only the devotional.                                                 | The app does not automatically count Scripture as complete or represent the devotional as the passage itself.                  |
| A26 | The person prays privately without entering any text.                                 | Pray can be marked complete. No recording, timer, or proof is required.                                                        |
| A27 | The person reflects without writing.                                                  | Reflect can be marked complete with empty writing fields.                                                                      |
| A28 | The person saves a reflection but does not mark Reflect complete.                     | The writing is saved; the practice remains unmarked until explicitly changed.                                                  |
| A29 | The person skips the intention or weekly introduction.                                | These do not add incomplete practices or prevent a complete day.                                                               |
| A30 | The person completes all practices and later clears one marker.                       | The day moves from complete to partial, with updated statistics and no punitive message.                                       |
| A31 | The participant changes translation on a historical day.                              | The displayed text and label change when ready; assigned references, completion, and private wording do not.                   |
| A32 | A named intended translation is not cleared or not available.                         | It is not presented as a working option or a paid upgrade. A reduced release catalog requires the owner's documented decision. |
| A33 | A devotional, prompt, or passage has not been finalized for a later day.              | The course is not declared ready for release. A draft title is not accepted as a complete day's formation content.             |
| A34 | The participant has a disability, limited money, or unsuitable fasting circumstances. | Practice guidance offers appropriate flexibility without demanding exercise targets, money, or food fasting.                   |

## Practice changes and historical corrections

| ID  | Situation                                                              | Expected participant experience                                                                                                        |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A35 | A new optional selection is confirmed on Day 10.                       | It starts on Day 11; Day 10 and earlier days retain their assigned practices.                                                          |
| A36 | Optional practices are replaced, added, or removed together.           | The new selection contains two to four distinct choices, and all earlier days remain unchanged.                                        |
| A37 | The upcoming change is canceled before the next journey day.           | The existing selection continues; no extra practice or misleading future change remains.                                               |
| A38 | A practice becomes unsafe or inappropriate today.                      | The person can stop immediately and leave it incomplete without a reset; the next-day rule does not compel unsafe participation.       |
| A39 | A participant tries to change practices on Day 77.                     | No replacement for a nonexistent Day 78 is offered. They can choose differently for another journey.                                   |
| A40 | The participant updates a historical day.                              | Its original date and assigned practices remain; later-update information is shown, and only the relevant journey's statistics change. |
| A41 | A new journey uses different optional practices from the previous one. | Old days display the previous assignments, not the new selection.                                                                      |

## Progress, writing, and endings

| ID  | Situation                                                             | Expected participant experience                                                                                      |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A42 | Days 1–4 are complete and Day 5 is unfinished.                        | The active current streak remains 4 during Day 5 rather than breaking at the start of the day.                       |
| A43 | Day 5 remains incomplete when Day 6 begins.                           | The current complete-day streak is interrupted, but the journey and prior progress continue.                         |
| A44 | A historical correction fills a gap in a complete-day streak.         | The recorded streak recalculates and is not described as verified on-time behavior.                                  |
| A45 | The participant has marked Reflect on several days but never written. | The Reflections collection explains optional writing; it does not claim the person never reflected.                  |
| A46 | A day contains only an intention.                                     | It appears as intention writing in Reflections but does not increase the written-reflection statistic.               |
| A47 | A saved reflection is deleted.                                        | After confirmation, the text is removed; practice completion remains unless separately changed.                      |
| A48 | An older reflection is edited.                                        | It stays associated with its original journey date and does not become falsely labeled as today's entry.             |
| A49 | The participant ends on Day 20.                                       | The summary says Ended early, retains Days 1–20, and labels Days 21–77 as not reached rather than 57 failed days.    |
| A50 | Real-world dates continue after an early ending.                      | The unreached remainder does not gradually unlock inside that ended journey.                                         |
| A51 | All practices are complete early on Day 77.                           | The day is complete, but the 77-day period remains active until that date ends.                                      |
| A52 | The full period ends with many incomplete days.                       | The journey becomes completed automatically, with accurate counts and no claim of 77 perfect days.                   |
| A53 | The person returns after the entire period passed while absent.       | They see the completed period and actual record; the app does not extend or restart it.                              |
| A54 | A participant reopens Day 77 in a completed journey.                  | The content and eligible editing remain available.                                                                   |
| A55 | A participant starts another journey.                                 | It begins separately on its confirmation date. Old records remain, and no completion markers carry into the new one. |

## Reliability, reminders, privacy, and accessibility

| ID  | Situation                                                          | Expected participant experience                                                                                               |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| A56 | A prepared phone loses internet during an active journey.          | The reached-day readings, guidance, practice recording, and private writing remain usable.                                    |
| A57 | A change was confirmed saved on the phone and the app is closed.   | Reopening preserves that saved change and accurately states whether it is available to the account elsewhere.                 |
| A58 | A new phone does not yet have the person's history.                | The app explains that history needs to become available; it does not call the account empty.                                  |
| A59 | Two phones contain incompatible versions of one reflection.        | Both versions are preserved and the participant can decide what to retain. No private version disappears silently.            |
| A60 | Signing out would discard phone-only changes.                      | The risk is explained and an explicit choice is required. The next account never receives those changes.                      |
| A61 | The participant declines reminder permission.                      | The full journey remains usable and the app does not repeatedly pressure them.                                                |
| A62 | The phone already knows that all assigned practices are complete.  | It does not deliberately send an incomplete-day reminder for that day.                                                        |
| A63 | A reminder appears on a locked phone.                              | It contains no private journal text, intentions, or sensitive missed-practice details.                                        |
| A64 | Account deletion is requested but has not completed.               | The displayed status is accurate. Once deletion is known, private access stops and older changes do not recreate the account. |
| A65 | Another person uses the phone after sign-out.                      | They cannot see the former participant's name, writing, progress, private pages, or personal journey reminders.               |
| A66 | The participant enlarges text or uses assistive reading.           | Scripture, controls, practice status, day access, writing, and recovery actions remain understandable and usable.             |
| A67 | A person cannot accurately use the visual calendar.                | A readable list offers access to the same eligible days and state information.                                                |
| A68 | The participant tries to leave unsaved writing.                    | They receive a meaningful Save, Keep editing, or Discard choice rather than silent loss.                                      |
| A69 | Any participant inspects V1 navigation.                            | No unfinished community, public profile, donation, premium, advertisement, or paid translation feature appears.               |
| A70 | Someone reads the completion summary or returns after missed days. | The wording is accurate, biblically appropriate, and free of spiritual grading, payment requests, or shame.                   |

## Future community acceptance principles — not V1 checks

When communities are introduced, joining must not expose past journals or start a second active journey. A shared journey must use a common schedule and reading references. Members must retain personal control of optional practices and voluntary sharing.

A leader must not be able to purchase private visibility, delete a member's personal history by removing them, or require a donation to participate. Reporting and leaving a group must be available without public shaming.

These are future release conditions, not permission to include incomplete social features in V1.

### Practice selection range

- Zero or one additional practice keeps Continue unavailable with a clear explanation.
- Two, three, or four distinct additional practices allow Continue and appear in the final review, for totals of five, six, or seven daily practices.
- A fifth selection is unavailable. Deselecting one of four preserves the other three and allows another choice.
- Returning from review preserves every selection; reducing the selection to one prevents continuing.
- Completion requires every practice assigned to that day. Historical totals and journey denominators retain each day’s original assignments after selection changes.
