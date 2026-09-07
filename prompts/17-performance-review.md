# Performance investigation

Investigate only under `AGENTS.md`. Inspect the affected render/data path, available profiling tools, build mode, device/runtime, subscriptions/caches, and React Compiler configuration.

Slow behavior, flow/platform, and existing measurements: `<TASK>`

User-visible target or constraints: `<REQUIREMENTS>`

## Measure and explain

- Establish a repeatable scenario and baseline. Record platform/device, development or release mode, data size, and relevant timings/counts using synthetic data and available tools.
- Trace applicable causes such as expensive renders/calculations, lists/images, startup, animations, request waterfalls, duplicate subscriptions, or Firestore reads. Distinguish JavaScript, native/UI-thread, network, and backend work.
- If startup, navigation, or persisted flow state is affected, preserve the gates, day access, and recovery behavior in `docs/APP_NAVIGATION_AND_UX.md`; faster rendering must not flash auth UI or bypass required state. Private reflection/prayer/journal content must not enter profiling logs or an added general-purpose cache.
- Prioritize by observed user impact and frequency. A possible re-render or large file alone is not a demonstrated bottleneck; avoid blanket memoization or caching recommendations.
- For a supported optimization, explain expected benefit, maintenance cost, and a comparable before/after measurement. If evidence is insufficient, name the smallest diagnostic needed instead of guessing a fix.

## Verify and report

Repeat measurements under comparable conditions where possible, separating development overhead from likely production behavior. Return measurements, supported causes, recommendations, and evidence limits. Stop at the diagnosis/recommendation; implementation is a separate task unless the user explicitly includes it, in which case require both behavior checks and before/after measurements.
