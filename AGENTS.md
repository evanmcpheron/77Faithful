Before creating, modifying, or reviewing code, read `STYLE_GUIDE.md` in full.

Treat `STYLE_GUIDE.md` as the repository’s source of truth for code style. Follow it for every code change.

## Shared types

Before starting any task, consult `/src/types/**` (relative to the repository root) and read the type definitions relevant to the work. Use these definitions as the source of truth for existing data shapes and contracts.

All files under `/src/types/**` are read-only for all AI agents unless the user explicitly instructs otherwise. Do not create, modify, delete, rename, move, or reformat files in this directory without that explicit instruction, including through formatters, generators, or other tools. A general request to implement or fix a feature does not authorize changes to these files.

## Reusable UI components

Use Tamagui for all reusable UI components wherever reasonably possible. Before using another library or creating a custom component from scratch, verify that Tamagui does not provide a suitable component. When Tamagui does not provide what is needed, use the most appropriate alternative that remains consistent with `STYLE_GUIDE.md`.

## UI text

Before writing, modifying, or reviewing any user-facing UI text, read and follow `VOICE_AND_LANGUAGE_GUIDE.md` at the repository root. Treat it as the source of truth for all interface copy, including labels, buttons, instructions, validation messages, errors, empty states, and completion states.

## Dependency installation

Never install a dependency without first receiving the user's explicit approval. If a new dependency appears necessary, explain why it is needed and provide supporting evidence, including why the existing dependencies or platform capabilities are insufficient, before asking for permission to install it.

Before delivering code, always run:

- `npm run format`
- `npm run lint`
