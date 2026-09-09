Before creating, modifying, or reviewing code, read `STYLE_GUIDE.md` in full.

Treat `STYLE_GUIDE.md` as the repository’s source of truth for code style. Follow it for every code change.

## Reusable UI components

Use Tamagui for all reusable UI components wherever reasonably possible. Before using another library or creating a custom component from scratch, verify that Tamagui does not provide a suitable component. When Tamagui does not provide what is needed, use the most appropriate alternative that remains consistent with `STYLE_GUIDE.md`.

## Dependency installation

Never install a dependency without first receiving the user's explicit approval. If a new dependency appears necessary, explain why it is needed and provide supporting evidence, including why the existing dependencies or platform capabilities are insufficient, before asking for permission to install it.

Before delivering code, always run:

- `npm run format`
- `npm run lint`
