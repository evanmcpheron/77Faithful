# Agent Instructions

## Documentation is strictly read-only

All `.md` and `.txt` files are strictly read-only for AI agents, including
`AGENTS.md`, `CLAUDE.md`, guides, specifications, and status documents. Under no
circumstances may an AI agent change or alter these files unless the user has
explicitly instructed or granted permission for those documentation changes.

This protection prohibits creating, modifying, overwriting, deleting, renaming,
moving, or reformatting documentation without that explicit authorization. It
applies to direct edits and indirect changes through formatters, generators,
scripts, or other tools, including whitespace-only changes.

A general request to implement, fix, refactor, test, or format code does not
authorize documentation changes. Instructions elsewhere to update documentation
do not grant user permission. Keep unauthorized `.md` and `.txt` files out of
write operations; use read-only checks or scoped commands instead. Any explicit
permission applies only to the documentation changes the user authorized.

## Read the product before coding

Read `DOCUMENTATION_MANIFEST.md` for initial orientation, documentation
authority, and the distinction between intended requirements and implemented
features.

Before making a meaningful application change, read the product documents that
own the behavior being built. At minimum, consult:

- `product/README.md`;
- the relevant subject document under `product/`;
- `VOICE_AND_LANGUAGE_GUIDE.md` for participant-facing copy;
- `VISUAL_DESIGN_GUIDE.md` for UI work;
- `STYLE_GUIDE.md` for code quality;
- `docs/domain-type-system.md` for persistent or cross-boundary data;
- `docs/SCREEN_ROUTE_MAP.md` for navigation work;
- `SCREEN_AND_ROUTE_PATTERNS.md` for screen, route, layout, header, and
  navigation implementation;
- `docs/journey-start.md` for onboarding submission, journey creation, and the
  trusted backend boundary;
- `docs/README.md` and the relevant component and pattern documents it indexes
  before changing shared UI;
- `docs/12-testing-guidelines.md` when selecting tests for changed behavior;
- `docs/14-component-acceptance-checklists.md` when reviewing shared components
  before handoff.

Do not treat a precise specification as evidence that code already exists.

Some component documentation retains Turndown-specific instructions. Use it for
applicable implementation patterns, subject to 77Faithful's product
requirements, `VOICE_AND_LANGUAGE_GUIDE.md`, `VISUAL_DESIGN_GUIDE.md`,
`STYLE_GUIDE.md`, and these agent instructions. Legacy visual defaults,
accessibility targets, and task-specific refactor restrictions do not override
the current 77Faithful requirements or the user's authorized scope.

## Product behavior is authoritative

The application must preserve the permanent product principles:

- Scripture is central.
- Jesus Christ is the focus.
- Spiritual disciplines do not earn God's favor.
- Missing a day never resets the journey.
- Private writing remains private unless a future product requirement explicitly
  creates a deliberate sharing action.
- The product is permanently free and does not use advertising.
- Progress is factual and personal, not a measure of holiness.
- Communities are outside V1.

When a coding shortcut conflicts with these principles, the shortcut is wrong.

## Shared domain contracts

Before starting any task, consult the relevant existing type definitions under
`src/types/**` and use them as the source of truth for existing data shapes and
contracts.

All files under `src/types/**` are read-only for AI agents unless the user
explicitly instructs otherwise. Do not create, modify, delete, rename, move, or
reformat files in this directory without that explicit instruction, including
through formatters, generators, or other tools. A general request to implement
or fix a feature does not authorize changes to these files.

The project should establish a dependency-light shared domain layer under
`src/types/**` or an equivalent stable domain-contract location.

Before defining persisted records, function request/response DTOs, local sync
state, or cross-feature models, read `docs/domain-type-system.md`.

Once shared contracts exist:

- treat them as the canonical definition of cross-boundary data;
- do not duplicate a domain shape inside a screen or service;
- do not change a shared contract as an incidental side effect of unrelated
  work;
- make persistence and runtime validation explicit at trust boundaries;
- keep SDK-specific snapshot objects out of application-domain DTOs.

## Visual work

Read `VISUAL_DESIGN_GUIDE.md` before creating or changing a user-facing surface.

The visual direction is **Quiet Sanctuary**: calm, warm, spacious, book-like,
grounded, and recognizably Christian without being ornate or sentimental.

UI work should:

- use shared semantic design tokens;
- use a small set of reusable application primitives;
- keep one clear visual hierarchy per screen;
- preserve generous whitespace;
- avoid dense dashboard styling;
- support light and dark appearance;
- support dynamic text and assistive technologies;
- keep touch targets large enough for ordinary mobile use;
- use actual domain state rather than decorative fake data.

Do not invent one-off component variants when the same pattern should become a
shared primitive. Do not create speculative abstractions for patterns that occur
only once.

## Reusable UI

Build reusable primitives around semantics rather than screens. Expected
categories include:

- text roles;
- buttons and links;
- cards and surfaces;
- form fields;
- checkbox and radio controls;
- page shells;
- account-entry shells;
- notices;
- section headings;
- practice rows;
- tab and navigation presentation.

A page should compose these primitives rather than reproduce the same spacing,
radii, typography, validation, loading, and accessibility behavior locally.

## Participant-facing language

All original UI text must follow `VOICE_AND_LANGUAGE_GUIDE.md`.

The app should sound like a trusted Christian guide: warm, clear, direct,
biblically grounded, and encouraging without being sentimental or manipulative.

Do not use corporate growth language, fitness-challenge language, shame,
spiritual scoring, or language that claims to know a participant's spiritual
condition.

Scripture text is exempt from app-copy style rules. Preserve the approved
Scripture source exactly, including wording, punctuation, and required
attribution.

## Navigation

The intended V1 primary navigation is:

- Today
- Journey
- Settings

Reflections is a Journey child surface. Communities must not be exposed in V1
navigation.

Route access must be driven by account and journey state, not merely by whether
a URL exists.

## Firebase boundaries

Firebase is the target backend platform.

Use Firebase Authentication for identity. Use Cloud Firestore for persisted
records. Use trusted Cloud Functions for operations that must enforce
server-authoritative invariants such as one active journey, journey start, early
ending, account-wide destructive actions, and future group enrollment.

Do not allow a client write to bypass an invariant just because Firestore can
technically accept the write.

Security Rules are part of the product's privacy boundary and require tests.

## Dependency changes

Never install a dependency, including a development dependency, without the
user's explicit approval. Before requesting approval, explain why it is needed
and provide supporting evidence, including why the existing dependencies or
platform capabilities are insufficient.

Do not add a dependency only to avoid writing a small amount of straightforward
application code.

Before adding a runtime dependency, confirm that it is necessary, maintained,
compatible with the target Expo/React Native environment, and materially
improves correctness or maintainability.

## Code quality

Follow `STYLE_GUIDE.md`.

Prefer:

- descriptive names;
- narrow functions;
- explicit data flow;
- small focused components;
- direct types;
- clear error states;
- simple composition;
- behavior-driven tests.

Avoid:

- unnecessary layers;
- generic utility dumping grounds;
- premature factories or registries;
- broad `any`;
- unexplained type assertions;
- stale comments;
- screen-local copies of shared behavior.

Before handing off code, run the repository's configured formatter, linter, type
checks, and relevant tests. If one of those checks does not yet exist, do not
claim it passed.

## No invented delivery claims

When reporting work, distinguish clearly between:

- a requirement;
- code written locally;
- a test that passed;
- a deployed backend resource;
- a release-ready feature.

Do not claim more than the evidence supports.
