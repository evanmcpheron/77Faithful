# 77Faithful Documentation Manifest

## Purpose

This archive is a clean starting documentation set for 77Faithful. It is written as a product and engineering blueprint and does not assume that application screens, navigation, components, Firebase resources, services, data contracts, tests, content loaders, or release infrastructure have been built.

The source material was reviewed from the `main` branch of `evanmcpheron/77Faithful` at tree `943ea3390312af0f766e45cffd352cc640203fe0`.

## Included project documentation

This archive preserves and rewrites the project-authored documentation from:

- the repository root;
- `docs/`;
- `product/`;
- `content/provisional-course/README.md`.

The original directory and file names are retained where practical so future agents can follow stable links between documents.

## Excluded material

The archive does not include application source code, configuration files, generated data payloads, lockfiles, tests, image assets, or third-party agent/tool reference material under `.agents/` and `.claude/skills/`.

Those materials are not part of the product documentation baseline.

## Documentation stance

Every document should be read as one of the following:

- **Product requirement:** what 77Faithful must do or must not do.
- **Design standard:** how 77Faithful should look, sound, and behave.
- **Engineering target:** the architecture, contracts, invariants, and safeguards to establish.
- **Editorial target:** the formation content that must be authored, reviewed, and prepared.
- **Future direction:** a deliberate later capability that must not appear as a finished V1 feature.

Statements about routes, Firebase boundaries, data shapes, component primitives, tests, content publishing, and offline behavior describe what should be created. They are not evidence that those artifacts exist.

## Authority order

When two documents appear to conflict, use this order:

1. `product/02-principles-and-boundaries.md` for permanent product principles.
2. The subject-specific document under `product/` for detailed participant behavior.
3. `product/17-decision-register.md` for the record of adopted product choices.
4. `VOICE_AND_LANGUAGE_GUIDE.md` for original participant-facing language.
5. `VISUAL_DESIGN_GUIDE.md` for visual and interaction direction.
6. `STYLE_GUIDE.md` and `AGENTS.md` for code and agent working standards.
7. `docs/` for target technical architecture and route organization.
8. `content/provisional-course/README.md` for provisional editorial data handling.

Product behavior takes precedence over technical convenience. Technical documents should be reconciled to product requirements rather than redefining them.

## V1 navigation correction

The intended V1 primary navigation is:

- **Today**
- **Journey**
- **Settings**

**Reflections** belongs under Journey. Communities are a future direction and must not appear in V1 navigation.

## Core technical direction

The intended application platform is Expo + React Native with Expo Router. Firebase is the target backend platform for authentication, Cloud Firestore persistence, and trusted server operations through Cloud Functions where client authority would be unsafe or ambiguous.

The reusable UI layer should be built around shared semantic tokens and shared application primitives rather than screen-specific styling. No specific third-party UI framework is required by this documentation set.

## Quality rule for future agents

Do not infer that a requirement has been delivered because a document describes it precisely. Inspect the actual code and deployed environment before making any claim about what works.
