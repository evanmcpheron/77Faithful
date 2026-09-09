# 77Faithful Visual Design Guide

## Quiet Sanctuary

**Status:** Visual direction selected by the product owner from the Today concept.  
**Applies to:** Every app screen, shared component, navigation surface, interaction state, and future screen design.  
**Visual reference:** [The selected Today concept](docs/design/today-reference.png).  
**Companion documents:** `STYLE_GUIDE.md` governs code; `VOICE_AND_LANGUAGE_GUIDE.md` governs words; `/product` governs the product.

> Build an interface that feels like opening a thoughtfully typeset devotional beside a still lake in the early morning: warm paper, deep green ink, quiet light, generous margins, and a clear invitation to spend time with God. It should feel personal and comforting before it feels like software.

## 1. The feeling we are protecting

The atmosphere is peaceful, grounded, and human. Soft morning light rests over distant mountains. Water is still rather than dramatic. The colors feel borrowed from paper, stone, leaves, and weathered wood. Nothing flashes, glows, competes for attention, or demands that the participant prove something.

The interface has the warmth of a familiar book and the clarity of a well-designed mobile application. Large, graceful serif headings give important words room to settle. A clean sans serif quietly handles instructions, controls, and details. Cream-colored space surrounds nearly white cards. Forest-green actions feel dependable, not promotional.

The cards are softly rounded and substantial without looking inflated. Their edges are barely announced. A restrained shadow suggests a sheet of paper resting above another surface, not a floating glass dashboard. Small circles of sage, muted ochre, slate, and clay distinguish practices without turning the page into a rainbow.

The person should not encounter a wall of explanations. A greeting feels addressed to them. A heading tells them where they are. One short sentence offers context. The next action is obvious. Additional detail is available when it is useful, not delivered all at once.

This is **warm editorial minimalism with a distinctly Christian purpose**. It is not generic wellness, luxury branding, a productivity dashboard, a fitness challenge, or an ornamental church brochure. Beauty supports Scripture, prayer, reflection, and ordinary faithful action. It never becomes the main event.

**The central design test:** Does this screen make room for the person, or ask the person to make room for the interface?

## 2. Authority and boundaries

This document is the visual source of truth. It does not replace the coding guide, change domain contracts, decide theological wording, or authorize new functionality.

| Concern                                                      | Authority                                  |
| ------------------------------------------------------------ | ------------------------------------------ |
| Product behavior, release scope, privacy, navigation         | Relevant specialist document in `/product` |
| Existing implementation and available capabilities           | Actual source, configuration, and tests    |
| Visual identity, spacing, typography, surfaces, presentation | This document                              |
| UI wording and Christian voice                               | `VOICE_AND_LANGUAGE_GUIDE.md`              |
| Code structure, naming, typing, abstraction                  | `STYLE_GUIDE.md` and `AGENTS.md`           |
| Data contracts                                               | Relevant read-only files in `src/types/**` |

The reference image establishes an aesthetic, **not an exact product specification**. Its five-tab navigation, example name, passage, wording, practice count, and illustrated progress are not requirements. Do not implement mistakes or unsupported features to imitate it.

For the repository reviewed on September 9, 2026, the working tab set is Today, Journey, and Settings; Communities remains feature-flagged. The daily commitment is three foundational practices plus two to four chosen practices. Use the actual assigned total rather than hard-coding five. Reinspect the current repository before implementation; this paragraph is a dated orientation, not a competing product definition.

When appearance conflicts with readability or truthful behavior, improve the appearance without sacrificing the latter. Do not resolve a product disagreement by quietly changing code during a styling task.

## 3. Recognizable visual signatures

**Warm light, not clinical white.** Use ivory for the page and soft off-white for working surfaces. Reserve pure-looking brightness for contrast, not as the entire atmosphere.

**Deep green, not luminous blue.** Forest green is the principal action and identity color. Blue can remain a muted supporting hue, never the old electric-blue visual language.

**A book-like hierarchy.** Serif headings establish warmth; clean sans-serif labels preserve usability. Not every sentence is a heading, and not every heading needs to be bold.

**Generous, repeated spacing.** The same distances recur across the app. Whitespace separates thoughts before borders do. A crowded form does not belong to a different design system just because it is functional.

**Selective atmosphere.** Scenic imagery is welcome at entry points and Today. Settings and forms should feel like the same app without requiring a mountain behind every control.

**Restrained language.** One clear thought at a time. One main action in an action group. Short support text. Important details remain accessible.

**Grace without vagueness.** Completion states are honest and calm. Incomplete work is not an alarm. Errors are still unmistakable, and privacy or safety explanations are never softened into ambiguity.

## 4. Color system

These are deliberate implementation targets informed by the reference and the repository's existing warm formation subthemes. They are not claimed to be the original image's exact sampled colors.

### Core semantic palette

| Semantic role     | Light     | Dark      | Use                                                         |
| ----------------- | --------- | --------- | ----------------------------------------------------------- |
| `background`      | `#F6F3EE` | `#17231F` | Page canvas                                                 |
| `surface`         | `#FFFEFC` | `#21332B` | Cards and primary reading/form surfaces                     |
| `surfaceElevated` | `#F2F0EA` | `#2A3D33` | Quiet alternate surface and pressed/secondary areas         |
| `surfaceSubtle`   | `#EEEAE3` | `#314439` | Insets and low-emphasis grouping                            |
| `textPrimary`     | `#203D34` | `#F4F0E7` | Headings and primary text                                   |
| `textSecondary`   | `#616963` | `#C3CBBF` | Supporting text                                             |
| `textMuted`       | `#6B706A` | `#A3AEA3` | Low-emphasis text on the main canvas; verify other pairings |
| `primary`         | `#294F42` | `#426953` | Filled primary action                                       |
| `primaryPressed`  | `#1E3D32` | `#355842` | Pressed primary action                                      |
| `onPrimary`       | `#FFFEFC` | `#F4F0E7` | Filled primary action text/icons                            |
| `link`            | `#294F42` | `#C1D8C5` | Inline links and navigation emphasis                        |
| `accentSoft`      | `#DCE5DD` | `#314A3B` | Selection wash; not a text color                            |
| `border`          | `#E4E2DA` | `#405448` | Decorative card outlines and dividers                       |
| `controlBorder`   | `#838A82` | `#8B9B8E` | Boundaries necessary to identify controls                   |
| `focus`           | `#365F4B` | `#D3BD89` | Visible interaction focus                                   |

`border` and `controlBorder` are intentionally different. A subtle card outline can be decorative. An unchecked checkbox or empty input cannot disappear into the page.

Set semantic values centrally. Component code consumes theme roles rather than spreading hex colors through screens. Map the same roles into navigation headers, tab bars, root backgrounds, field focus, placeholder text, selection, loading states, and native presentation where the existing stack allows it. Do not leave a blue inherited state behind a green default state.

### Practice accents

Use these primarily for icon discs, not entire large cards. The text/icon color must be darker than the disc in light mode. Category color never communicates completion by itself.

| Family | Light disc / ink      | Dark disc / ink       | Typical use                                |
| ------ | --------------------- | --------------------- | ------------------------------------------ |
| Sage   | `#DCE5DD` / `#294F42` | `#314A3B` / `#D8E8DB` | Scripture, service, nature-related accents |
| Ochre  | `#EBD8AF` / `#785A20` | `#4A3E27` / `#E8D3A5` | Prayer and quiet emphasis                  |
| Slate  | `#D9E0E4` / `#365462` | `#2E4148` / `#CEDFE7` | Reflection and writing                     |
| Clay   | `#E7D5D1` / `#7B4D44` | `#4B3632` / `#E8CCC4` | Movement and intentional action            |

Optional practices may reuse these families. Do not create ten unrelated bright colors. Keep a stable mapping by practice ID rather than by list position.

Retain distinct semantic error, warning, success, and information colors, with readable text/surface pairings in both modes. Clay is not automatically an error; green is not automatically a success. Never make a missed day look like a destructive error.

### Dark mode

Dark mode is the same sanctuary at dusk: deep evergreen surfaces, warm pale text, softened imagery, and quiet edges. It is not inverted beige, black-and-neon green, or the old navy theme. Preserve the same spacing and hierarchy. Use surface separation rather than heavy shadows. Check selection and button foregrounds independently; do not reuse a light-theme foreground by habit.

## 5. Typography

### Character and family strategy

Headings should feel literary and approachable: a readable book serif with open counters and enough stroke weight to remain clear on a phone. Avoid decorative script, excessively thin fashion serifs, and oversized all-caps religious slogans.

The proposed final pairing is **Source Serif 4 for editorial headings and reading accents, with Inter for interface text**. This is a design recommendation, not an identification of the font in the generated image. Official family references are listed below. [R7–R8]

The supplied repository has no bundled custom font files. Do not assume a named font works because a `fontFamily` string was added. Until approved assets are available, centralize a verified platform-serif fallback for headings and the system sans serif for UI. The fallback is an interim implementation, not a promise of identical cross-platform typography.

Do not download font assets, install font packages, or add external font requests without owner approval. When approved files are supplied, use the existing font facilities, map actual families/weights, and handle loading or failure without trapping the app behind a splash. Expo documents local-asset loading and native embedding separately; use the approach compatible with this project's platforms and development workflow. [R3]

### Type roles at default text size

Sizes below are logical interface units, not pixels measured from the reference image. They are starting values for the shared system, not fixed-height layout constraints.

| Role                                | Size / line height | Treatment                                      |
| ----------------------------------- | ------------------ | ---------------------------------------------- |
| Personal greeting / hero title      | 34 / 40            | Serif, regular or medium                       |
| Page title                          | 30 / 38            | Serif, regular or medium                       |
| Section heading                     | 24 / 30            | Serif, medium                                  |
| Practice or editorial card title    | 20 / 26            | Serif, medium                                  |
| Body and field value                | 16 / 24            | Sans serif, regular                            |
| Supporting description              | 14 / 20            | Sans serif, regular                            |
| Field label / important small label | 14 / 20            | Sans serif, medium                             |
| Metadata / navigation label         | 13 / 18            | Sans serif, regular or medium                  |
| Primary button                      | 16 / 22            | Sans serif, semibold                           |
| Scripture reading                   | 20 / 32            | Readable book serif; adjustable when supported |
| Brief featured quotation            | 20 / 28            | Serif; italic only where appropriate           |

Use modest or no tracking for ordinary text. Reserve small uppercase labels and approximately 1 unit of tracking for occasional short markers such as “THIS WEEK.” Do not apply tracking to paragraphs, email addresses, or button labels.

Allow names, headings, buttons, and rows to grow. At large accessibility sizes, wrap and stack rather than shrinking the font. Do not set low `maxFontSizeMultiplier` caps to protect a composition. React Native's text scaling behavior should remain enabled. [R4]

## 6. Spacing, proportion, and rhythm

The whitespace is a defining feature, not leftover room.

Use a coherent scale: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64**. Create meaningful shared tokens or mappings; do not assume an existing Tamagui token such as `$4` equals a particular number without checking configuration. Tamagui supports centralized tokens and font configuration. [R1]

| Relationship                       | Default target                                 |
| ---------------------------------- | ---------------------------------------------- |
| Phone page gutter                  | 24; 16 on narrow layouts when needed           |
| Broad-screen gutter                | 32 around a centered content column            |
| Related title and description      | 8                                              |
| Label and input                    | 8                                              |
| Helper text and its control        | 4–8                                            |
| Form field groups                  | 20                                             |
| Major sections                     | 24–32                                          |
| Card interior                      | 20–24; 16 for compact cards                    |
| Practice-row interior              | 12–16                                          |
| Practice rows                      | 10–12                                          |
| Icon to text                       | 12                                             |
| Content to primary action          | 24                                             |
| Screen content after the last item | 24–32, plus only the inset not already handled |

At typical phone widths, use one readable column. Two compact context cards can share a row when their text actually fits. On narrow screens or with larger text, stack them. Never shrink labels to preserve two columns.

Keep account forms around 460 logical units maximum width and general content around 640. These are content constraints, not reasons to stretch controls across a tablet. Allow the scenic background to extend beyond the text column where appropriate.

Use intrinsic height. A routine practice row will often be about 88–104 units tall, but long names or larger text can require more. Buttons and single-line input frames start around 52–56 units and may grow. Do not specify a fixed height that clips scaled content.

The reference is a visual composition, not a promise that all content fits on one physical screen. A real Today screen can scroll. At an ordinary phone size, the greeting, day context, and beginning of the practices should be readily discoverable; seven practices must not be compressed to fit above the fold.

Prefer normal document flow. Percentage-positioned form controls, absolute-positioned headings, and fixed-offset footers are not the spacing system. Absolute positioning is appropriate for background art and controlled decoration, not for core reading and interaction.

## 7. Surfaces, shape, and depth

Use a consistent radius family: **16 for inputs, 18 for buttons and practice rows, 24 for standard cards, and up to 28 for a featured panel**. Circular icon discs are genuinely circular. Pills are reserved for compact tags or controls that benefit from the shape, not every button in the app.

Working surfaces are mostly opaque. The softness comes from tone, padding, typography, and restrained depth—not mandatory blur, transparency, glass effects, or gradients.

A suggested light-mode card shadow is a dark-green shadow at roughly 5–8% opacity with a small vertical offset and a broad, soft blur. Translate this into appropriate platform styling centrally; do not assume web shadow syntax is universally supported. Use little or no shadow in dark mode.

Two visible grouping levels are normally enough: a section panel and its quiet rows. Do not stack cards inside cards inside colored cards. Not every paragraph needs a border. A form can sit directly on the page.

Press feedback should feel like a surface responding under a fingertip: a mild tonal change, not a glowing halo, dramatic bounce, or enlargement. A stable layout is preferable to an animated one that draws attention away from the task.

## 8. Imagery and decorative restraint

Choose wide, quiet landscapes: mist over water, layered mountains, soft tree silhouettes, muted shorelines, and diffused dawn light. Composition should include areas of low visual detail where text can remain readable. Use natural, low-saturation color with warm highlights and cool atmospheric depth.

Avoid hard midday sunlight, intensely green stock photography, saturated cyan skies, prominent people, dramatic lens flares, towering glowing crosses, busy foregrounds, or imagery that makes the app feel like a promotional poster.

The Today header may begin with atmosphere and settle into the ivory page. That transition need not require a new rendering dependency. A well-cropped approved image, a restrained overlay, or a simple tonal boundary is sufficient. Prefer an opaque text region when a photograph cannot support reliable contrast.

**Image fallback:** No broken-image icon, blocked interaction, blank hero, or dependence on a remote image request. Render the same header hierarchy on the theme background when approved artwork is unavailable. Do not treat the current vivid landscape placeholder as the final art direction.

The reference PNG is documentation only. It includes generated text and controls. Do not use it as the runtime screen, crop its lettering into an asset, or trace its controls into a static background. UI must remain real, accessible text and components.

Botanical details or a paper-like texture may appear sparingly in a secondary reflective surface. They must not run behind long text, repeat on every card, or require a new asset before the app looks coherent. Omit them before sacrificing readability.

**Clean landscape asset brief:**

> A quiet mountain lake at dawn, photographed with natural realism. Layered distant ridgelines softened by mist, still water, subdued evergreen trees, warm ivory morning light, gentle gray-blue atmospheric depth, low saturation, and an uncluttered upper-left area for interface text. Peaceful and grounded, not dramatic or fantastical. No text, letters, logo, UI, people, religious symbol, lens flare, or glowing effect. Compose for both a shallow mobile header crop and a taller welcome crop. Supply landscape artwork separately from all interface elements.

## 9. Shared component language

Evolve the existing `SeventySeven*` components instead of introducing a parallel UI kit. Use Tamagui where suitable; verify the installed API. Keep feature-specific compositions close to their feature until reuse is real.

| Component responsibility | Required visual behavior                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Text                     | Central type roles; editorial serif versus functional sans; semantic text colors                                     |
| Button                   | Filled, outlined, and restrained text action where needed; consistent radius; busy, disabled, focus, and error cases |
| Card                     | Quiet surface, padding, border, and optional featured treatment; no arbitrary per-screen redesign                    |
| Form field               | Persistent label, readable value, distinct control outline, visible focus, inline error, retained password behavior  |
| Checkbox / radio         | Clear unchecked and checked states; accessible target; label remains readable and tappable                           |
| Page shell               | Shared gutters, content width, safe areas, scroll behavior, and bottom clearance                                     |
| Account shell            | Same visual family as Today, with less scenery and a clear form-first hierarchy                                      |
| Section heading          | Title, optional short description, and optional restrained secondary action                                          |
| Notice                   | Compact but clear loading, error, confirmation, or unavailable state; truthful action/status text                    |
| Practice row             | Category icon, name, optional short description, and independent action/status regions when supported                |
| Tab presentation         | Quiet surface, stable icon/label positions, clear active state, unchanged product destinations                       |

A decorative icon can be 22–24 units inside a 44–48 unit tinted disc. A small visible checkbox still needs a comfortably sized interactive region. Adopt at least a 48-by-48 logical target for primary touch controls and icon-only actions as this project's design target; do not confuse visible glyph size with hit area.

When a practice row supports both opening guidance and marking completion, use **separate sibling targets**. A checkbox must not be nested in a tappable card that also navigates. Give each action an unambiguous accessible name. Opening guidance, scrolling, saving writing, and marking completion remain separate behaviors.

Do not draw an interactive checkbox, chevron, or primary button for a capability that is unavailable. Unknown completion is not zero completion. Present the practice without a false affordance, or use an explicitly labeled development-only preview.

## 10. Screen families

### Welcome and account entry

More atmospheric than other screens, but never a poster with buttons pasted onto it. Introduce the brand, one short Christ-centered invitation, a clear account-creation action, and a quieter sign-in action. Use normal layout flow and safe areas. Keep the actions reachable on short phones and with large text.

Do not display a private name or progress on a signed-out screen. Do not imply account creation starts Day 1. No full-screen electric-blue glow remains in the interactive entry screen.

### Sign in, create account, recovery, and email confirmation

Use a compact editorial heading, one short description, and a breathable form. Inputs belong to the same color and radius system as Today. A small scenic strip is optional; filling a form should not require looking through scenery.

Preserve all meaningful account, recovery, verification, privacy, and error information. Reduce repetition through hierarchy, not by removing consequences or changing how actions work. Make long email addresses wrap. Confirmation should feel like another page in the same app, not a different template.

### Journey setup

One decision per step. A small “Step X of Y” indicator, a quiet progress line, a serif title, and the relevant choices are enough to orient the participant.

Keep selected practices obvious. Explanations and examples may expand on request, but essential selection limits and safety boundaries remain available and clear. Optional motivation and reminders must still look optional. Review/start is the deliberate commitment boundary, not a congratulatory launch animation.

### Today

Arrange the page as a gentle progression from welcome to action:

1. A personal greeting, with a short time-appropriate invitation and restrained atmosphere.
2. Current day and weekly context, presented compactly.
3. A dominant “Today's practices” panel with readable rows.
4. Optional secondary reflection or motivation content only when it is useful and supported.

Use a real preferred name only when safely available from the current account. Otherwise, “Good morning” or “Welcome back” is sufficient. Never invent “Alex,” infer a name from an email address, or pretend to know how the person feels.

The practice panel is the functional center of the screen. Foundational practices come first, then the person's actual chosen practices. A row usually needs a name and at most one short supporting thought. Full prayers, devotionals, technical dates, time-zone identifiers, and long motivation text should not become the default overview density. Preserve access to existing content with an appropriate detail view or local disclosure rather than deleting it.

Use actual day content; do not mix an attractive reference passage with an unrelated weekly theme. “X of N complete” requires known real completion data. A calendar-location indicator such as “Day 12 of 77” must not be mislabeled as twelve fully completed days. Any bar must represent its labeled value proportionally, not an attractive arbitrary fill.

“Start my journey” belongs only to deliberate onboarding confirmation. A daily reading action may say “Read Scripture” or “Continue Day 12” when it has a real destination. The screenshot's “Start Today's Journey” is not the preferred action label.

A second decorative Bible quotation is optional, not required. Avoid stacking multiple encouragements and verses just to fill space. Scripture wording must come from an approved text source with the necessary reference and translation context; never transcribe the generated image as authoritative Scripture.

### Journey

A reflective record, not an analytics dashboard. Use a clear summary, compact date/context details, a legible sequence of weeks or reached days when implemented, and restrained access to saved reflections. Highlight the current week with a gentle visual distinction, not a trophy or score.

Keep calendar position, recorded completion, and spiritual growth conceptually separate. Never invent a faith score, leaderboard, completion heat map, or statistic to populate a design.

### Settings

Quiet and practical. A serif heading and well-spaced grouped rows should be sufficient. Reduce decorative scenery here. Keep settings explanations near the relevant controls and destructive actions clearly distinguished. Do not make read-only information look like a configurable setting.

### Scripture, prayer, and reflection

Reading and thought take precedence over decoration. Use a stable, opaque reading surface, generous leading, and a comfortable column. Scripture and original commentary are visibly distinct. Prayer includes its prompt and written prayer when supplied. Reflection writing remains optional and private.

The minimal-copy rule does **not** abbreviate Scripture, truncate a supplied prayer, rewrite authored devotional content, or remove required acknowledgments. These are focused reading experiences, not dashboard summaries.

### Placeholders and future screens

Existing title-only placeholders inherit the background and typography. Do not fill them with invented legal copy, fake community activity, mock private writing, unsupported controls, or speculative features. A cohesive unfinished screen is preferable to a misleading finished-looking screen.

## 11. Language density and personal warmth

Follow the voice guide for wording. The following are presentation budgets, not rigid validation limits:

| Element              | Default writing target                                         |
| -------------------- | -------------------------------------------------------------- |
| Page title           | About 2–6 words                                                |
| Introductory support | One short sentence, normally 1–2 lines                         |
| Practice row         | Name plus one short supporting phrase                          |
| Button               | Familiar, specific action, usually 1–4 words                   |
| Empty state          | Clear title, one explanation, one relevant action if available |
| Error                | What happened and what the person can do next                  |

Use progressive disclosure for secondary explanations. Never put mandatory consent, a destructive consequence, an unsaved-work warning, essential validation, or an availability limitation behind optional reading solely to keep the page short.

Personal does not mean repeatedly using the participant's name. Comfort comes from restraint, accurate reassurance, and a lack of pressure. An honest “Your setup is saved” is comforting only when the application knows it is saved.

## 12. Interaction states and accessibility

Loading uses a stable surface and a restrained indicator; avoid unnecessary skeleton frameworks or flickering layout. Errors appear near the failed task, with a real retry where supported. Missing artwork must not affect the task.

Completion uses a clear check and calm wording when the data is known. Incomplete states remain neutral. No confetti, fire icons, public comparison, manufactured urgency, or rewards that suggest spiritual superiority.

Motion is optional and brief. A small transition of roughly 120–180 milliseconds is a starting design target, not a requirement. Respect reduced-motion preferences and avoid continuous movement or parallax.

Use WCAG contrast criteria as design checks: at least 4.5:1 for ordinary text and 3:1 for qualifying large text. Necessary control/state indicators should reach 3:1 against adjacent colors. Test the rendered background, including images and overlays; a palette alone is not an accessibility certification. [R5–R6]

Preserve system text scaling, screen-reader labels and states, visible keyboard focus, meaningful reading order, and non-color state indicators. Check both appearance modes. Keep validation and required instructions readable; “minimal” must never mean tiny gray text.

Safe-area, keyboard, and tab-bar spacing each need a single owner. Do not apply bottom-tab height in both the tab wrapper and every child page. Do not add top safe-area padding again beneath a native header that already provides it.

## 13. Reusable brief for future generated screens

Use this with the reference image and the screen's actual content/behavior specification:

> Design this 77Faithful screen in the Quiet Sanctuary visual language. Preserve the atmosphere of a beautifully typeset devotional in a peaceful natural setting: warm ivory canvas, soft off-white surfaces, deep forest-green emphasis, restrained sage/ochre/slate/clay icon accents, graceful readable serif headings, clean sans-serif controls, rounded paper-like cards, generous consistent spacing, and very little unnecessary text. The experience should feel personal, grounded, comforting, clearly Christian, and easy to begin. Use scenic imagery selectively rather than on every surface. Give the page one clear hierarchy and one dominant action per action group. Let content breathe, wrap, and scroll; do not shrink it to imitate a screenshot. Preserve the supplied product behavior, actual navigation, content, accessibility, and truthful states. Do not add extra tabs, fake completion, a spiritual score, glowing blue buttons, oversized promotional copy, ornate religious decoration, or unsupported features. Match the same design system rather than inventing a new interpretation for this screen.

## 14. Acceptance checklist

A screen is ready for visual review when:

- It belongs to the same warm forest-and-ivory family as the reference, including dark mode and transient states.
- Its typography, spacing, radii, and colors come from shared definitions rather than local reinvention.
- The main purpose and next supported action are clear without reading a paragraph of introduction.
- Larger text, long names, long email addresses, narrow widths, and the keyboard do not break the composition.
- Labels, unchecked controls, focus, and required messages remain readable and identifiable.
- Working flows, private data boundaries, and product navigation remain intact.
- Unavailable capabilities and unknown values are not disguised as completed implementation.
- Actual screenshots have been compared when a runtime is available; untested platforms are identified honestly.

**Final question:** If this screen were placed beside Today, would it feel like another page of the same book?

## Technical references

The art direction and numeric layout targets above are project design decisions. These primary sources support the technical and accessibility guidance; inspect the installed package versions before adopting API examples.

- **R1:** [Tamagui configuration and tokens](https://tamagui.dev/docs/core/configuration).
- **R2:** [Tamagui themes](https://tamagui.dev/docs/core/theme).
- **R3:** [Expo fonts](https://docs.expo.dev/develop/user-interface/fonts/).
- **R4:** [React Native Text and font scaling](https://reactnative.dev/docs/text).
- **R5:** [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **R6:** [W3C: Non-text Contrast](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html).
- **R7:** [Adobe's Source Serif project](https://github.com/adobe-fonts/source-serif).
- **R8:** [Inter's official project](https://rsms.me/inter/).
- **R9:** [Expo Symbols](https://docs.expo.dev/versions/latest/sdk/symbols/).
