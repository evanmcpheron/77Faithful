# 77Faithful

77Faithful is a free 77-day Christian spiritual formation mobile application
designed to help people consistently spend time with God, engage Scripture,
pray, reflect, act intentionally, love others, and continue growing beyond the
structured journey.

This repository should be built from the requirements in this documentation set.
The documents describe the intended product, design language, engineering
boundaries, content model, navigation, and release conditions. They do not
assume that screens, services, Firebase resources, or domain code already exist.

## Product summary

Every reached journey day contains three foundational practices:

1. **Read Scripture**
2. **Pray**
3. **Reflect**

Each participant also chooses **two to four** additional practices from a fixed
catalog. This produces five to seven daily practices while keeping the
experience adaptable to different schedules, physical abilities, family
situations, and areas of growth.

The journey lasts **77 consecutive calendar days**. Missing a practice or a day
never resets the participant to Day 1. The calendar continues, the record stays
honest, and the participant is invited to continue.

The eleven weekly themes are:

1. Abiding in Christ
2. Scripture
3. Prayer
4. Renewal
5. Identity
6. Love
7. Service
8. Stewardship
9. Christian Community
10. Mission
11. Perseverance

Scripture is the primary formation content. Human-written devotionals, prompts,
and questions support engagement with Scripture but must never be presented as
equal to Scripture or as personalized revelation from God.

## Permanent product commitments

77Faithful must remain:

- explicitly Christian and centered on Jesus Christ;
- grounded in Scripture;
- focused on faithfulness rather than perfection;
- permanently free to participants;
- free of advertisements and paid spiritual feature tiers;
- private by default;
- noncompetitive;
- accessible across a range of abilities and life circumstances;
- honest about what the app can and cannot know about a person's spiritual life.

The product must never use points, spiritual scores, public rankings, paid
streak protection, achievement badges, or other mechanics that suggest app
activity measures holiness.

## Intended V1

V1 is a complete personal experience. It should include:

- account creation, email confirmation, sign-in, recovery, sign-out, and account
  deletion;
- journey setup;
- two to four selected additional practices;
- a reviewed Bible translation selection from the actually available catalog;
- an optional starting motivation;
- optional morning and evening reminders;
- one active 77-day journey;
- 77 days of reviewed formation content;
- in-app Scripture reading and the ability to use a personal Bible;
- manual practice completion;
- optional daily intention and reflection writing;
- historical day review and correction;
- practice changes that begin on the next journey day;
- Journey history and modest personal statistics;
- a private Reflections collection;
- reliable use during ordinary connection gaps after required content is
  prepared;
- light and dark appearance, larger-text support, assistive technology support,
  and accessible interaction;
- clear privacy, Scripture acknowledgment, help, and account controls.

Private communities are a committed future direction and are not part of V1.

## Intended technical foundation

The target application is:

- **Expo + React Native** for iOS and Android;
- **Expo Router** for file-based application navigation;
- **TypeScript** for application and server code;
- **Firebase Authentication** for account access;
- **Cloud Firestore** for persisted account, journey, content, and future
  community data;
- **Firebase Cloud Functions** for trusted operations that must enforce
  cross-document or server-authoritative invariants;
- device-local storage for protected drafts, prepared content, and
  offline-support state;
- device-local notifications for participant-configured reminders where
  practical.

These are target architecture decisions. Before writing code, an agent should
confirm the actual repository state rather than assuming any layer has been
created.

## Documentation map

Start with the following:

- [`product/README.md`](product/README.md) — product documentation guide and
  authority model.
- [`product/01-product-overview.md`](product/01-product-overview.md) — product
  purpose and participant experience.
- [`product/02-principles-and-boundaries.md`](product/02-principles-and-boundaries.md)
  — permanent principles.
- [`product/03-v1-scope.md`](product/03-v1-scope.md) — release scope.
- [`product/11-pages-and-navigation.md`](product/11-pages-and-navigation.md) —
  required product surfaces.
- [`VOICE_AND_LANGUAGE_GUIDE.md`](VOICE_AND_LANGUAGE_GUIDE.md) —
  participant-facing language.
- [`VISUAL_DESIGN_GUIDE.md`](VISUAL_DESIGN_GUIDE.md) — visual and interaction
  direction.
- [`STYLE_GUIDE.md`](STYLE_GUIDE.md) — code quality conventions.
- [`AGENTS.md`](AGENTS.md) — instructions for coding agents.
- [`docs/SCREEN_ROUTE_MAP.md`](docs/SCREEN_ROUTE_MAP.md) — target route
  architecture.
- [`docs/domain-type-system.md`](docs/domain-type-system.md) — target domain
  contracts.
- [`docs/journey-start.md`](docs/journey-start.md) — trusted journey-start
  boundary.
- [`content/provisional-course/README.md`](content/provisional-course/README.md)
  — provisional formation-content workflow.

## Documentation rule

Do not let source-code convenience silently change the product. If a technical
choice conflicts with the product specification, update the technical design or
explicitly change the owning product requirement.

Likewise, do not claim a feature, Scripture edition, offline guarantee, privacy
guarantee, or release condition is working until there is evidence in the actual
code and environment.
