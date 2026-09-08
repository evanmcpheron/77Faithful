# Amplify-backed feature

Implement the specified data capability. Read `AGENTS.md`, `docs/PRODUCT_REQUIREMENTS.md`, and relevant architecture/testing guidance; read `docs/FORMATION_CONTENT_SPEC.md` for journey content-version or fixture work. Trace existing identity, service calls, Amplify Data models/relationships, authorization, indexes, and tests. Verify the installed SDK's behavior against current official Amplify Gen 2, AWS service, and relevant Expo documentation.

Feature: `<FEATURE>`

Acceptance criteria and required reads/writes: `<REQUIREMENTS>`

## Implement

- Follow AWS Amplify Gen 2 with Amplify Auth/Amazon Cognito and Amplify Data/AWS AppSync/Amazon DynamoDB behind focused services. Explicitly configure Cognito Lite unless a documented settled requirement needs Essentials. Do not introduce SMS, passkeys, or advanced auth without a requirement. Add Amplify Storage/S3 only for actual files and Amplify-defined AWS Lambda only for necessary trusted logic. Preserve Expo development builds and EAS; planned integrations are not configured infrastructure.
- Map each operation to its owner, allowed actors, fields, query, and authorization boundary. Apply the AWS authorization rules in `AGENTS.md`, including verified cloud personal-data writes. Cognito confirmation and authenticated-session establishment are distinct; owner authorization alone does not check email verification. Use generated client outputs for the correct environment, never bundled AWS deployment credentials or static access keys.
- When state affects auth/onboarding redirects, journey start/progression, completion, settings, or sign-out, read `docs/APP_NAVIGATION_AND_UX.md`. Honor its state transitions and persistence-before-navigation requirements. Apply required verification before onboarding and cloud personal-data writes, including restored unverified sessions; never weaken authorization or report a failed write as successful onboarding.
- Deliver the necessary model/field authorization, validation, indexes, and tests with each data capability. Protect owner fields and related-record ownership; broad authenticated rules must not expose private data or generated mutations bypass server validation. Reflections, journals, intentions, and personal prayer content stay private; Community membership is not sharing consent. Keep private records separate from explicitly shared data and include membership enforcement only when future community behavior is in scope; backend models do not enable V1 Community navigation.
- Use the Amplify Data client, not direct DynamoDB access. Bound queries and record growth, paginate, and add/clean up subscriptions only for a current need. Consider actual read/write costs and required atomic operations without building a generic repository framework or invoking Lambda for ordinary CRUD.
- Handle realistic API failures and applicable offline, pending/saved/failed, concurrent-edit, retry, and duplicate-request behavior. Gen 2 Data does not provide durable offline persistence or a mutation queue; implement the scoped local store/sync boundary required by the architecture. Follow settled pending-write sign-out, subsequent-account isolation, and deletion across related records when personal data is affected.

## Verify and finish

Use synthetic accounts in an isolated Amplify cloud sandbox/test backend for allowed access, unauthenticated/unconfirmed/unverified/cross-user denial, invalid fields, ownership or privilege changes, related-record access, and scoped membership cases. Test privileged handlers independently of Data authorization and exercise service failure/state transitions locally. An AWS sandbox provisions real resources; do not invent a local emulation stack or use production personal data.

Complete `AGENTS.md` checks plus backend/authorization checks. When introducing `amplify/` definitions or Lambda handlers, provide runnable checks, document their environment/credentials and cleanup needs, and include applicable checks in CI; root Jest currently only discovers `src/` tests. Verify native build/persistence behavior where available. Report missing external configuration and unverified boundaries without claiming the integration works. Stop at the requested capability; cloud provisioning and deployment are separate unless included in the user's scope.
