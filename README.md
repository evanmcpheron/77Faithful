# 77Faithful

A free 77-day Christian spiritual formation app for iOS and Android, centered on Scripture, prayer, and reflection. The repository currently contains an Expo 57 starter with engineering checks; the formation experience, Firebase, and API.Bible are not implemented yet.

## Development

Use Node 24 and npm 11. With nvm:

```sh
nvm install
nvm use
npm ci
npm start
```

`npm run ios`, `npm run android`, and `npm run web` launch the respective development targets. Native targets need an appropriate simulator, emulator, or device. The current starter can use Expo Go; the selected native Firebase integration will require development builds when implemented. Web is a development preview target for the first release.

Routes and layouts live in `src/app/`. Shared UI is in `src/components/`, theme values are in `src/constants/theme.ts`, and hooks are in `src/hooks/`. Read [AGENTS.md](AGENTS.md) for engineering and verification guidance, including the versioned Expo documentation requirement. [Task prompts](prompts/README.md) provide focused implementation and review starting points.

## Verification

```sh
npm run check
```

This runs formatting, ESLint, route generation and TypeScript, and the regression tests. It works without starting Metro or supplying service credentials.

| Command                                                          | Purpose                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `npm run typecheck`                                              | Generate Expo route types, then run strict TypeScript    |
| `npm run lint` / `npm run lint:fix`                              | Check code / apply available lint fixes                  |
| `npm run format:check` / `npm run format`                        | Check formatting / format repository files               |
| `npm test`                                                       | Run tests once                                           |
| `npm run test:watch`                                             | Watch relevant tests during development                  |
| `npm test -- --runInBand src/components/ui/collapsible.test.tsx` | Run one regression suite                                 |
| `npm run test:coverage`                                          | Run tests and report coverage, including untested source |
| `npm run export:web`                                             | Build the static web preview into `dist/`                |

GitHub Actions runs `npm ci`, `npm run check`, and the web export for pull requests and pushes to `main`. Component tests are colocated as `*.test.tsx` outside the route directory. See [testing notes](docs/engineering/testing.md) for mocks and verification limits.

## Engineering context

- [Current implementation](docs/engineering/project-context.md)
- [Architecture and product decisions](docs/engineering/architecture-decisions.md)
- [Design system and visual direction](docs/engineering/design-system.md)

No environment variables are required for the current starter or its checks. Service credentials and cloud resources must be supplied when the selected integrations are built; API.Bible secrets belong only on the backend. Local `.env*` files are ignored, with `.env.example` reserved for non-secret examples.

The inherited `npm run reset-project` command moves `src/` and `scripts/` into `example/`, or deletes them if deletion is selected, before creating a blank `src/app/`. It is not a development setup step.
