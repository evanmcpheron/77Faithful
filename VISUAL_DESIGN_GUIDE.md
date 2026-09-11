# 77Faithful Visual Design Guide

## Visual direction: Quiet Sanctuary

Build an interface that feels like opening a thoughtfully typeset devotional
beside a still lake: calm, warm, spacious, grounded, and unmistakably Christian
without becoming ornate or sentimental.

The core feeling should be:

- peaceful;
- grounded;
- human;
- morning light over water or hills;
- natural materials such as paper, stone, leaves, and wood;
- book-inspired composition;
- serif-led editorial headings with a clean sans-serif interface;
- restrained cream and forest-green color;
- paper-like cards;
- subtle accent circles and markers;
- warm editorial minimalism with recognizably Christian content.

The interface should not feel like:

- a generic wellness app;
- a fitness or productivity challenge;
- a neon church-event brand;
- a glassy analytics dashboard;
- a gamified score surface;
- a dense administration application.

The central design test is:

> Does this screen invite a person to slow down, understand what matters, and
> respond to Christ without unnecessary friction?

## Design authority

Use these documents together:

- `product/` owns behavior and participant requirements.
- `VOICE_AND_LANGUAGE_GUIDE.md` owns original participant-facing language.
- this guide owns visual composition, spacing, color, typography, and
  interaction tone.
- `STYLE_GUIDE.md` and `AGENTS.md` own code quality and agent behavior.
- `docs/domain-type-system.md` owns the intended cross-boundary data model.

Do not invent visual affordances for behavior that the product does not support.

## Signature characteristics

77Faithful should be recognizable through a consistent set of design decisions:

1. **Warm light surfaces and deep green structure.**
2. **Editorial hierarchy rather than dashboard density.**
3. **Generous whitespace as an intentional design feature.**
4. **Selective atmospheric imagery rather than decorative image overload.**
5. **Quiet controls with clear states.**
6. **Grace-oriented progress presentation.**
7. **Scripture given visual priority over commentary and metrics.**
8. **Stable, opaque surfaces that remain readable in light and dark
   appearance.**

## Color system

Use semantic tokens rather than raw color values inside feature screens.

### Core palette

| Semantic role    | Light     | Dark      |
| ---------------- | --------- | --------- |
| Background       | `#F6F3EE` | `#17231F` |
| Surface          | `#FFFEFC` | `#21332B` |
| Elevated surface | `#F2F0EA` | `#2A3D33` |
| Subtle surface   | `#EEEAE3` | `#314439` |
| Primary text     | `#203D34` | `#F4F0E7` |
| Secondary text   | `#616963` | `#C3CBBF` |
| Muted text       | `#6B706A` | `#A3AEA3` |
| Primary action   | `#294F42` | `#426953` |
| Primary pressed  | `#1E3D32` | `#355842` |
| On primary       | `#FFFEFC` | `#F4F0E7` |
| Link             | `#294F42` | `#C1D8C5` |
| Soft accent      | `#DCE5DD` | `#314A3B` |
| Border           | `#E4E2DA` | `#405448` |
| Control border   | `#838A82` | `#8B9B8E` |
| Focus            | `#365F4B` | `#D3BD89` |

### Practice accents

Use practice accents sparingly. They help distinguish content without turning
daily participation into a multicolor scorecard.

| Accent | Light background | Light text | Dark background | Dark text |
| ------ | ---------------- | ---------- | --------------- | --------- |
| Sage   | `#DCE5DD`        | `#294F42`  | `#314A3B`       | `#D8E8DB` |
| Ochre  | `#EBD8AF`        | `#785A20`  | `#4A3E27`       | `#E8D3A5` |
| Slate  | `#D9E0E4`        | `#365462`  | `#2E4148`       | `#CEDFE7` |
| Clay   | `#E7D5D1`        | `#7B4D44`  | `#4B3632`       | `#E8CCC4` |

Do not assign spiritual meaning to accent colors.

### Dark appearance

Dark appearance should feel like the same sanctuary at dusk, not a generic black
inversion.

Use deep green-charcoal backgrounds, warm off-white text, softened borders, and
subdued accent surfaces. Preserve the same hierarchy and spacing as light
appearance.

## Typography

The target type pairing is:

- **Source Serif 4** for editorial and devotional emphasis;
- **Inter** for interface text.

If these fonts are not yet bundled, use a stable platform serif and system
sans-serif fallback until the intended fonts are deliberately added.

### Type roles

| Role                          | Target size / line height | Family / emphasis             |
| ----------------------------- | ------------------------- | ----------------------------- |
| Hero                          | `34 / 40`                 | Serif                         |
| Page title                    | `30 / 38`                 | Serif                         |
| Section heading               | `24 / 30`                 | Serif                         |
| Editorial/practice card title | `20 / 26`                 | Serif                         |
| Body / form field             | `16 / 24`                 | Sans                          |
| Supporting copy               | `14 / 20`                 | Sans                          |
| Field label                   | `14 / 20`                 | Sans medium                   |
| Metadata / navigation         | `13 / 18`                 | Sans                          |
| Primary button                | `16 / 22`                 | Sans semibold                 |
| Scripture                     | `20 / 32` default         | Serif, participant-adjustable |
| Featured quote                | `20 / 28`                 | Serif                         |

Do not reduce text merely to fit a fixed-height card. Prefer intrinsic height
and scrolling.

Support dynamic type. Headings may scale differently from body copy, but text
must remain legible and must not clip.

## Spacing

Whitespace is a defining feature, not leftover room.

Use a coherent spacing scale:

**4, 8, 12, 16, 20, 24, 32, 40, 48, 64**

Create shared semantic spacing tokens or mappings.

Recommended defaults:

- phone horizontal gutter: **24**;
- narrow-phone gutter: **16** when necessary;
- broad centered layouts: **32** side space where available;
- title to description: **8**;
- label to input: **8**;
- helper/error below input: **4–8**;
- form-group separation: **20**;
- major section separation: **24–32**;
- standard card padding: **20–24**;
- compact card padding: **16**;
- practice row vertical padding: **12–16**;
- stacked row gap: **10–12**;
- icon-to-text gap: **12**;
- content-to-primary-action gap: **24**;
- final content padding: **24–32** plus safe-area requirements.

Do not fill every open area with text, decoration, or a secondary call to
action.

## Width and layout

Target readable content widths rather than stretching forms across tablets or
desktop-sized web views.

Suggested maximum content widths:

- account and focused forms: approximately **460 px**;
- general reading and application content: approximately **640 px**.

Phone layouts should normally be single-column.

Use intrinsic content height. Avoid fixed-height cards for variable copy. Allow
pages to scroll naturally.

Daily practice rows should generally land around **88–104 px** when they include
title, support copy, and a completion control.

Primary buttons and form fields should generally be at least **52–56 px** high
and may grow with larger text.

Absolute positioning should be reserved for decorative elements or tightly
controlled overlays, not normal document flow.

## Surfaces

Suggested radii:

- inputs: **16**;
- buttons and practice rows: **18**;
- standard cards: **24**;
- featured editorial cards: **28**.

Use opaque surfaces.

Shadows should be subtle and rare. Prefer tonal surface separation and borders.
The product does not require glass effects, blur, or gradients.

## Imagery

Imagery should create atmosphere without becoming the product's main content.

Preferred image qualities:

- quiet landscape photography;
- dawn or soft morning light;
- open water;
- low hills or mountains;
- natural greens and muted blues;
- low focal complexity;
- no prominent people;
- no logos;
- no embedded text;
- no watermark;
- no high-saturation treatment.

Avoid staged “victory” imagery, glowing crosses, stock-photo worship poses, or
literal devotional clichés.

### Today imagery

Today may use a wide scenic header or atmospheric image when it supports the day
without pushing the essential content too far below the fold.

A clean Today landscape asset should be:

- morning-side lake or mountain scenery;
- muted blue/green palette;
- soft sky;
- visually calm;
- low-detail behind text;
- free of text and branding.

Always provide a stable no-image presentation so the screen remains complete if
the asset is unavailable.

### Botanical illustration

Small botanical or natural-form illustration may be used as a supporting
editorial detail. It should remain subtle and secondary.

## Shared application primitives

The UI layer should establish a small reusable component system rather than let
every screen invent its own visual language.

Expected primitives include:

- semantic text roles;
- primary, secondary, quiet, and destructive buttons;
- text links;
- cards and elevated surfaces;
- text fields and text areas;
- checkbox and radio controls;
- page shell;
- focused account shell;
- notice/status surface;
- section heading;
- practice row;
- progress indicator;
- tab presentation;
- Scripture reading surface.

These primitives should encode spacing, typography, states, contrast, disabled
behavior, and accessibility consistently.

Do not make a component “reusable” by giving it dozens of arbitrary style props.
Prefer a small semantic API.

## Touch and control behavior

Prefer a **48 × 48 px** minimum interactive area for ordinary controls.

A daily practice row has two distinct possible actions:

- open the practice guidance;
- mark or unmark completion.

Do not make those actions ambiguous. The navigation target and completion target
should be visually and semantically distinct.

Do not render a chevron, switch, checkbox, overflow menu, or link unless the
product actually supports the implied action.

## Screen family patterns

### Public welcome and account entry

The first signed-out experience should be visually warm and quiet.

It may include:

- atmospheric imagery;
- the 77Faithful name;
- a concise Christ-centered invitation;
- clear **Create account** and **Sign in** actions;
- secondary access to About, Privacy, and related information.

Do not imply that account creation itself starts Day 1.

### Sign in, registration, recovery, and email confirmation

Use a compact editorial heading, restrained support text, and a clear form.

Validation should appear near the field or action that needs attention.

Do not create a different visual theme for every account screen.

### Journey setup

Use one meaningful decision per step.

Show progress through setup without making onboarding feel like a survey.

Practice selection must make the required **2–4** range obvious. Selected state,
disabled state at the maximum, and the current count must be understandable
without relying on color alone.

Motivation and reminders are optional. The final review should make **Start my
journey** feel deliberate because it establishes the calendar.

### Today

Today is the primary daily surface.

Prioritize:

1. current day and week context;
2. theme and reading;
3. the participant's assigned practices;
4. optional intention/reflection prompts;
5. secondary journey context.

Use a preferred-name greeting only when a preferred name is actually available.

Show foundational practices first, followed by the participant's actual chosen
practices.

The day number comes from the calendar, not from the number of complete days.

Do not fill Today with future-day previews, large statistical dashboards, or
motivational copy that competes with Scripture and prayer.

### Journey

Journey is a reflective record, not an analytics product.

Use the calendar/day grid and list to help the participant understand where they
are, review reached days, and access previous journeys.

Statistics should be modest and clearly descriptive.

### Reflections

Reflections is a private writing collection within the Journey area.

Make the relationship to the originating journey/day obvious. Use readable
excerpts and clear privacy language where useful.

Do not visually imply social publishing.

### Settings

Settings should be quiet and practical.

Group account, practices, reminders, appearance, Scripture preference, privacy,
and help logically. Keep destructive actions separated and explicit.

### Scripture

Scripture should be the most reading-oriented screen in the app.

The passage reference, translation label, text, and required acknowledgments
must be clear. Commentary must remain visually distinct from Scripture.

Reading, scrolling, or changing translation must not automatically mark
completion.

### Prayer

Prayer should feel focused rather than form-heavy.

Present the prayer prompt and any authored written prayer clearly. A participant
should be able to spend time in prayer without entering text.

### Reflection and intention

Use comfortable writing surfaces with visible save state.

Saving writing and marking Reflect complete are separate actions.

When a draft or save is at risk, communicate the state directly rather than
hiding it behind a generic spinner.

### Historical days

Historical days should keep the original day number, date, reading, and assigned
practices.

When a participant updates a historical day after its date, show a modest
indication rather than a warning treatment.

### Completed or early-ended journey

Completion summaries should be reflective and factual.

Avoid celebratory trophy language, confetti, rankings, or a spiritual grade.

An early-ended journey must be clearly labeled as such without shame.

## Information density

A screen should not contain every fact that exists about the participant.

Use progressive disclosure:

- Today shows what is needed for today's participation.
- Journey holds history and broader context.
- Reflections holds private writing history.
- Settings holds configuration and account controls.

Long explanatory copy belongs in focused help surfaces or expandable sections
when appropriate.

## Motion

Motion should be restrained and functional.

Short transitions around **120–180 ms** are reasonable for ordinary state
changes when platform accessibility settings permit them.

Do not use celebratory motion as a reward for spiritual activity.

Respect reduced-motion preferences.

## Accessibility

Target at least WCAG AA contrast:

- **4.5:1** for ordinary text;
- **3:1** for large text and meaningful non-text controls where the applicable
  criterion permits it.

Also:

- support dynamic text;
- preserve logical screen-reader order;
- provide meaningful accessibility labels;
- expose control state semantically;
- do not communicate completion only through color;
- preserve visible focus on keyboard-capable platforms;
- keep interactive targets large;
- provide a readable list alternative to the journey grid;
- manage the software keyboard without obscuring writing actions;
- ensure one layout owner handles safe-area and bottom-navigation insets.

## Safe areas and keyboard behavior

Do not stack multiple independent safe-area paddings on the same edge.

Bottom-tab layouts should have one clear owner for tab-bar and safe-area
spacing.

Writing screens must keep the active field and save controls reachable with the
keyboard open.

## Visual copy budget

Original app copy should be concise.

Prefer:

- one strong page title;
- one short description;
- one primary action;
- secondary help only where it changes a decision.

Long spiritual content is appropriate where the product calls for Scripture, a
devotional, a weekly introduction, or reflection guidance. UI chrome should
remain quiet around it.

## Future surfaces

Do not display fake community feeds, fake messages, fake public profiles, or
other future capabilities in V1.

Design documentation may describe later surfaces, but participant-facing release
UI should expose only working product behavior.

## Visual acceptance checklist

Before accepting a user-facing screen, verify:

- the screen follows Quiet Sanctuary;
- typography has a clear editorial hierarchy;
- whitespace is generous;
- colors come from semantic tokens;
- light and dark appearance both preserve hierarchy;
- all text remains readable at larger sizes;
- touch targets are adequate;
- controls expose their state without color alone;
- the primary action is clear;
- Scripture is visually distinguished from commentary;
- progress is factual rather than competitive;
- no fake domain data or future feature is used to make the screen look fuller;
- the layout works on a narrow phone and a wider device;
- the keyboard does not hide required actions;
- navigation matches the product hierarchy.

## Technical references for implementation work

When implementing these requirements, consult current official references for:

- Expo font loading;
- React Native `Text` and dynamic type behavior;
- WCAG text contrast;
- WCAG non-text contrast;
- Source Serif 4;
- Inter;
- Expo-supported system-symbol/icon approaches.

Official technical documentation may refine API details, but it must not
override the visual or product intent described here.
