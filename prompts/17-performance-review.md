# Performance investigation

## Role

Act as an engineer investigating a concrete or suspected performance issue.

## Task

Slow behavior, affected flow/platform, and existing measurements if any: `<TASK>`

User-visible target or constraints: `<REQUIREMENTS>`

## Context gathering

Read root and applicable directory `AGENTS.md` instructions and relevant project/testing guidance. Inspect the affected render/data path, installed profiling tools, build mode, and device/runtime context. Check React Compiler configuration and existing subscriptions/caches before proposing optimization.

## Success criteria

Separate measured bottlenecks from hypotheses and recommend the smallest change with a meaningful expected user benefit.

## Constraints

Investigation/review only; do not edit source, tests, configuration, or documentation, or install tools unless explicitly asked. Use synthetic data and bounded diagnostics; do not benchmark against private production records.

Do not add memoization everywhere or sacrifice readability for negligible gains. A theoretical re-render or larger file is not itself a performance defect.

## Investigation expectations

- Establish a repeatable scenario and baseline using available tools. Record device/platform, development or release mode, data size, and relevant timing/count measurements.
- Investigate applicable causes: React re-renders, expensive calculations, lists, images, request waterfalls/duplication, Firestore reads, repeated subscriptions, startup, bundle size, or animations.
- Trace the costly work to a concrete location and distinguish React, JavaScript, native/UI-thread, network, and backend behavior.
- Prioritize findings by measured user impact and frequency. State confidence where direct measurement is unavailable.
- For each proposed change, give the expected benefit, complexity/maintenance cost, and a before/after validation method.
- If a fix is explicitly authorized, implement only the supported optimization and preserve behavior.

## Verification

Repeat measurements under comparable conditions when possible. Avoid attributing development-only overhead to production behavior. After an authorized fix, run relevant behavioral tests and the checks required by `AGENTS.md`; report both performance results and correctness checks.

## Final response

Give measurements, supported causes, prioritized recommendations, and evidence limits. Report changes/files changed (normally none), checks actually run and outcomes, and remaining concerns.
