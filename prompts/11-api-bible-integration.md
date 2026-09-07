# API.Bible implementation

Implement the specified Scripture integration. Read `AGENTS.md`, the API.Bible decisions in `docs/engineering/architecture-decisions.md`, and testing guidance. Inspect existing Scripture UI, services, gateway, configuration, and tests before adding a new path.

Integration task: `<TASK>`

Passages, selection behavior, and acceptance criteria: `<REQUIREMENTS>`

## Establish the provider contract

Consult current official API.Bible documentation for authentication, response formats, identifiers, translation capabilities, usage limits, attribution/licensing, and caching. Validate account-specific entitlements from available evidence. If documentation or terms are unavailable, identify what needs verification and complete independent work without guessing permission to display or persist content. Cite the sources used.

## Implement

- Follow the selected authenticated, App Check-protected backend gateway and the authorization/secrets rules in `AGENTS.md`. Keep provider networking and parsing out of UI components.
- Validate the allowed Bible/version and passage identifiers, bound requests/retries, and validate upstream responses. Do not assume translations share coverage or numbering, guess IDs, or silently substitute versions.
- Keep application-authored prompts/references separate from fetched Scripture. Render the reference, version, and required attribution; do not render arbitrary upstream HTML. Apply the selected session-memory cache policy and verified cache limits.
- Prevent stale passage/version responses when selection changes. Handle invalid IDs, unavailable versions, malformed responses, timeouts, network loss, and quotas with useful states.
- Keep passage references and other practices usable when text is unavailable; reading in one's own Bible must remain compatible with self-reported Scripture completion.

## Verify and finish

Add gateway/service/UI tests using synthetic responses for authorization, validation, parsing, selection changes, attribution, and expected failures. Avoid live provider calls in routine tests. Complete `AGENTS.md` checks and relevant backend verification. Report entitlement/configuration gaps separately from completed code, and stop at the requested integration scope.
