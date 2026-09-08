# 77Faithful

A free 77-day Christian spiritual formation app for iOS and Android, centered on Scripture, prayer, intentional action, and reflection. The repository currently contains an Expo 57 navigation scaffold with engineering checks; curated Scripture data access and validation exist, while approved Scripture content, formation behavior, and AWS Amplify Gen 2 remain pending.

## Development

Use Node 24 and npm 11. With nvm:

```sh
nvm install
nvm use
npm ci
npm start
```

`npm start` starts Metro for the installed development client. `npm run ios` and `npm run android` generate the applicable ignored native project when needed, compile it, and launch it on an available simulator, emulator, or device. Expo Go is no longer the primary native runtime. Native projects remain generated through Continuous Native Generation and must not be committed without a documented reason.

EAS is linked to `@emcpheron/77Faithful`. The `development` profile builds installable development clients for physical devices and Android emulators; `development-simulator` targets the iOS Simulator. Run `npx eas-cli build --platform <ios|android> --profile <profile>` only from an authorized Expo account. `npm run web` remains the credential-free static-web development preview, and `npm run export:web` verifies its production bundle.

Routes and layouts live in `src/app/`. Shared UI is in `src/components/`, theme values are in `src/constants/theme.ts`, and hooks are in `src/hooks/`. Read [AGENTS.md](AGENTS.md) for engineering and verification guidance, including the versioned Expo documentation requirement. [Task prompts](prompts/README.md) provide focused implementation and review starting points.

Read [product requirements](docs/PRODUCT_REQUIREMENTS.md) for settled product policy and release scope, and the [formation content specification](docs/FORMATION_CONTENT_SPEC.md) for curriculum structure, human approval, versions, and fixtures. Before screen, navigation, auth/onboarding, or journey-flow work, read [the navigation and UX contract](docs/APP_NAVIGATION_AND_UX.md). It owns intended routes, screen relationships, user flows, navigation states, and route-level release exposure. Material flow changes update it in the same change. Today/Journey have replaced Home/Explore as navigation scaffolding; Verify Email and Notifications now have navigation-only placeholders, while integrations and state-backed product flows remain planned.

## Verification

```sh
npm run check
```

This runs formatting, ESLint, route generation and TypeScript, the regression tests, and Scripture dataset validation/audit. It works without starting Metro or supplying service credentials.

| Command                                                           | Purpose                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `npm run typecheck`                                               | Generate Expo route types, then run strict TypeScript    |
| `npm run lint` / `npm run lint:fix`                               | Check code / apply available lint fixes                  |
| `npm run format:check` / `npm run format`                         | Check formatting / format repository files               |
| `npm test`                                                        | Run tests once                                           |
| `npm run test:watch`                                              | Watch relevant tests during development                  |
| `npm test -- --runInBand src/components/action-controls.test.tsx` | Run one regression suite                                 |
| `npm run test:coverage`                                           | Run tests and report coverage, including untested source |
| `npm run export:web`                                              | Build the static web preview into `dist/`                |

GitHub Actions runs `npm ci`, `npm run check`, and the web export for pull requests and pushes to `main`. Component tests are colocated as `*.test.tsx` outside the route directory. See [testing notes](docs/engineering/testing.md) for mocks and verification limits.

## Engineering context

- [Product requirements and release scope](docs/PRODUCT_REQUIREMENTS.md)
- [Formation content structure and approval](docs/FORMATION_CONTENT_SPEC.md)
- [Current implementation](docs/engineering/project-context.md)
- [Authoritative navigation and UX flows](docs/APP_NAVIGATION_AND_UX.md)
- [Architecture and integration decisions](docs/engineering/architecture-decisions.md)
- [Design system and visual direction](docs/engineering/design-system.md)

Scripture requires no service credentials or environment variables. The [curated Scripture architecture](docs/engineering/architecture-decisions.md#curated-scripture) separates reading plans, passages, translation metadata, and text. Run `npm run scripture:audit` to reproduce content validation and verse counts; `npm run scripture:audit -- --release` additionally checks publication and fallback readiness. The current draft has no assigned passages or imported text, so release readiness intentionally fails. Local `.env*` files are ignored except the non-secret [.env.example](.env.example). AWS Amplify Gen 2 setup remains planned: Amplify Auth with Amazon Cognito Lite, and Amplify Data with AWS AppSync/Amazon DynamoDB. Amplify Storage/S3 and AWS Lambda are added only for concrete storage or trusted-logic requirements. No backend dependency or cloud configuration is required to run the current scaffold.

The inherited `npm run reset-project` command moves `src/` and `scripts/` into `example/`, or deletes them if deletion is selected, before creating a blank `src/app/`. It is not a development setup step.
