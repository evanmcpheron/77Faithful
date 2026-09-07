# UI consistency review

Review only under `AGENTS.md`. Read `docs/engineering/design-system.md` and inspect the specified UI, shared primitives/tokens, and a bounded set of comparable usages.

Screens, components, or diff to compare: `<TASK>`

## Compare

- Check typography, spacing, colors, radius, control sizes, buttons, fields, icons, and loading/empty/error presentation for accidental drift.
- Find independently recreated primitives or shared styles that would benefit from one owner. Name the existing primitive/token to extend or the concrete responsibility a missing primitive would own.
- Distinguish dynamic style arrays and purposeful screen-specific layout from duplication. Similar markup alone is not evidence that two components should merge.
- Inspect light/dark and platform variants while preserving legitimate native/web differences. Test proposed reuse against current consumers so consolidation does not require a large configuration API.

## Verify and report

Compare rendered states where available and substantiate each finding with example locations and a usability or maintenance consequence. Separate subjective preference and source-based inferences from observed drift. Return bounded consolidation recommendations, or state that the reviewed UI is sufficiently consistent. Stop at the requested comparison; do not propose a replacement design system just because the current one is partial.
