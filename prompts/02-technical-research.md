# Technical research

## Role

Act as an engineer evaluating a technical decision for 77Faithful.

## Task

Decision or question: `<TASK>`

Requirements and constraints: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions, relevant engineering decision records, and the code/configuration involved. Check actual versions in `package.json` and the lockfile, plus Expo configuration and relevant tooling. Do not assume a documented integration already exists.

## Success criteria

Recommend an approach supported by current authoritative evidence, compatible with this checkout, with explicit tradeoffs and confidence.

## Constraints

Research only: do not install packages or modify code, configuration, lockfiles, documentation, or external resources unless explicitly asked. Include the existing solution and platform/standard-library options before considering another dependency.

## Research expectations

- Consult current official Expo, React Native, Firebase, API.Bible, or library documentation as relevant. Follow the versioned Expo documentation requirement in `AGENTS.md`; check APIs against installed versions.
- Compare only plausible options against the actual requirements: behavior, platform support, offline needs, maintenance, dependency weight, security/privacy, and operational cost where relevant.
- Distinguish documented facts, repository observations, and inferences. Cite supporting pages, relevant versions, and the research date.
- If network research is unavailable, use available local documentation and mark claims needing current verification. Do not present remembered support, pricing, or licensing terms as verified.
- Recommend one option with high, medium, or low confidence, explain decisive tradeoffs, and identify evidence that could change the recommendation. Revisit a selected architecture decision only with a concrete reason.

## Verification

Cross-check compatibility and proposed APIs against authoritative references and installed package metadata. Identify any bounded experiment needed to resolve uncertainty; do not build the experiment without authorization.

## Final response

Provide the recommendation, a compact comparison, sources, confidence, and unresolved questions. Report changes/files changed (normally none), checks actually run with outcomes, and remaining concerns.
