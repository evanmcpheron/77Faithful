# 04 · Journey and Calendar

[Documentation guide](README.md)

**Authority:** This document owns the meaning of a journey, its dates, day access, historical changes, and ending states.

## 1. The unit of participation

A journey is one person's separate 77-calendar-day experience. It has a fixed starting date, a fixed journey time zone, a specific formation course, a history of the optional practices assigned to its days, and the person's own participation and writing.

The days are labeled **Day 1** through **Day 77**. There is no Day 0 or Day 78 within a journey. The app may display a calendar date alongside a numbered day so that historical records remain understandable.

A participant may have many previous journeys but no more than one active journey. The app must not create two active journeys because someone starts from two phones or repeats the start action.

## 2. Starting a journey

V1 starts on the date the participant confirms **Start my journey**. Finishing onboarding alone does not start the calendar. Creating an account does not start it either.

There is no date picker for choosing a future or past start. A person who is not ready can leave setup and return later. Their saved setup choices do not reserve a start date.

Before confirmation, the participant sees the five selected practices, selected available Bible translation, today's proposed start date, the projected Day 77 date, and the journey time zone. The review explains that the dates will not move after starting.

The journey time zone is the phone's current time zone when the journey starts, shown in a human-readable form such as **New York time**. No location-sharing permission is required as a product condition. A person traveling at setup should be able to understand that starting there fixes the journey to that time zone. V1 does not offer a separate journey-time-zone customization feature.

Starting must be confirmed while connected to the internet. Until the app confirms the start, it must not tell the participant that a journey definitely exists. When a start is confirmed but the phone is still preparing the reading content for use without internet, that separate status must remain visible.

## 3. Calendar rules

Day 1 is the starting calendar date in the journey time zone. Day 2 is the following calendar date, and so on. The date for Day 77 is 76 calendar dates after Day 1.

A journey day changes at midnight in the fixed journey time zone. It is not a rolling 24-hour period beginning when the person clicked Start. Starting late in the evening creates a shorter first day; the review should explain that Day 1 ends at midnight in the displayed journey time zone. There is no automatic move to tomorrow and no pressure to finish all five before midnight.

Once a journey has started, neither its start date nor its time zone can be edited. Traveling, changing the phone's time zone, or a daylight-saving-time change must not add, remove, repeat, or renumber a journey day.

The participant can see the journey's time zone from the journey details. When the phone is using a different time zone, Today should explain the difference unobtrusively. The app must not present an apparently incorrect day without explanation.

### Concrete example

A journey starting on **September 8, 2026** has Day 1 on September 8 and Day 77 on **November 23, 2026**, in its fixed journey time zone. It becomes a completed journey when November 24 begins in that time zone.

If the participant travels during that period, those dates remain attached to the same numbered days. If the phone's local date differs from the journey date, the journey date determines Today.

## 4. Journey states

| State       | What it means                                                                                        | What the participant can do                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Not started | The participant has no active journey and has not confirmed a new one. Setup may be partly complete. | Learn about the product, finish setup, review previous journeys, or start when ready.                                          |
| Active      | Today falls within Day 1 through Day 77, and the participant has not ended the journey early.        | Use today and eligible historical days, change future optional-practice selections, and review progress.                       |
| Completed   | The entire Day 77 calendar date has ended without the journey being ended early.                     | Review the summary, view and update all 77 historical days, and start a separate journey.                                      |
| Ended early | The participant explicitly stopped the journey before its scheduled period ended.                    | Review the accurate early-ended summary, update eligible historical days through the ending day, and start a separate journey. |

V1 has no scheduled, paused, frozen, or suspended journey state. Leaving the app unused does not pause the calendar. Closing the app, signing out, or losing internet does not end a journey.

A temporary inability to display account information is not the same as having no journey. The app must not offer an unsafe duplicate start while it is unsure whether an active journey already exists.

## 5. Current, historical, and future days

**Current day:** The numbered day assigned to the current date in the journey time zone while the journey is active.

**Historical day:** A day that has already occurred within the part of the journey the participant actually reached. Historical days remain available for reading, reflection, and changes to participation records.

**Future day:** A day not yet reached in an active journey. Its detailed content and completion controls are unavailable.

The course overview may show all eleven theme names, brief theme descriptions, and their day ranges from the beginning. That is not access to future daily readings, devotional text, prayer prompts, or reflection questions.

A future day may appear in the day grid with its number and a clear unavailable state. Selecting it explains when it becomes available. It must not reveal that day's detailed content or let someone record participation in advance.

An early-ended journey never unlocks the unused remainder merely because later real-world dates pass. Those days are labeled **Not reached**, not ordinary incomplete days. A completed journey exposes all 77 days, including Day 77.

## 6. Missed and partially completed days

The calendar always continues. A day with zero recorded practices stays associated with its original date. Tomorrow becomes the next numbered day, not another attempt at the same one.

The app records partial completion accurately, such as **2 of 5 practices complete**. A day with no completed practices should be described as **No practices marked complete**, not proof that the person did nothing spiritually.

A participant returning after an absence lands on the actual current day. The app may offer previous days for review, but must not require backfilling, explanations, apologies, or a restart before today becomes available.

If the full 77-day period passed during the absence, the participant sees the completed journey and its actual record. The app does not restart the period from the day they returned.

## 7. Updating historical days

The participant may mark or unmark practices, write or edit an intention, and write or edit a reflection on an eligible historical day. There is no arbitrary seven-day editing limit.

Late changes can represent correcting an earlier record, participating in the earlier day's material later, or adding a retrospective reflection. The app does not claim to verify when a spiritual practice actually occurred.

The historical page always shows its original day number and date. When a day is changed after its assigned date, it includes a modest **Updated after this day** indication and the latest update date. This helps the record remain honest without punishing the participant.

Historical changes recalculate the corresponding journey's practice counts and complete-day statistics. They do not move the journey's dates, unlock future days, or change the current journey day. A former day's optional practices remain the ones assigned to that day; they are not replaced by the participant's present choices.

There is no bulk action to declare a week or an entire journey complete. Each day's practice record is changed deliberately.

## 8. A day changes while the person is using the app

The app must not move writing to a new date merely because midnight occurred while a page was open.

An already-open day remains associated with the day the person was viewing. When it becomes historical, the screen makes that clear. The participant may finish saving to that day or navigate to the new Today. The app must not erase their writing or mark the same action complete on both dates.

If a scheduled optional-practice change has now taken effect, the new selection appears on the new day. The older open day retains its own selection.

## 9. Ending a journey early

Ending early is available from journey details or settings, not presented as the usual response to one missed day.

The confirmation explains that:

- The current journey will stop and cannot be resumed.
- Existing records and writing will remain available.
- Today and all earlier reached days will remain editable.
- Unreached days will stay unavailable within that journey.
- A separate new journey may be started afterward.

The participant can cancel. No reason or spiritual explanation is required. The product may offer a neutral reminder that missed days do not require ending, but must not obstruct a deliberate decision.

An early ending must be confirmed while connected. Once confirmed, the summary displays **Ended early**, the actual ending date, and the last reached day. It must not use a completed-journey label or imply the full 77-day period was finished.

Ending on the Day 1 date is still an early-ended journey with one reached day. Unused future optional-practice changes are canceled. The ended journey's dates and assignments cannot later be reopened or extended.

## 10. Reaching Day 77 and finishing the period

Day 77 remains an active day until its date ends in the journey time zone. Completing all five practices early that day completes the day, not the calendar period.

The participant may read a final-day message and review a preliminary summary on Day 77. The wording should say **Your final day** rather than claim the full period has already elapsed.

The journey becomes completed automatically after Day 77 ends. There is no required **Complete journey** button, final survey, final donation, or final written entry. Returning days later still produces the correct completed state.

The summary remains available afterward. An incomplete Day 77 may be updated later under the same historical-edit rules as every other day.

## 11. Beginning another journey

A participant with no active journey may start another through a clear **Start another journey** action. They review their optional practices and translation again and may keep or change their selections. A new motivation is optional.

The new journey starts on the date it is confirmed. It has its own day numbers, writing, practice assignments, progress, and summary. It does not inherit completed practices from another journey, even when two different journeys contain entries associated with the same calendar date.

Previous journeys remain accessible from Journey and Reflections. Their historical updates affect only their own summaries.

The same fixed V1 course is used again. There is no promise of a different reading, randomized passage, or alternative devotional merely because it is a repeat journey.

## 12. Deletion is different from ending

Ending early preserves history. Deleting a written entry removes that writing but does not end the journey. Signing out does not delete the account or its history. Account deletion is a separate, explicitly confirmed process described in Document 13.

V1 does not include a separate delete-whole-journey feature. This avoids presenting accidental history removal as a routine alternative to ending or reviewing a journey. Permanent account deletion remains available.
