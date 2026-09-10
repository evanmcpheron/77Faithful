# Utils

Shared TypeScript utilities. Pick a module, import what you need.

| Module                        | What's inside                                                        |
| ----------------------------- | -------------------------------------------------------------------- |
| [string](./string/README.md)  | Case conversion, validation, formatting, text manipulation           |
| [object](./object/Objects.md) | Deep clone, dot-path access, flatten/unflatten                       |
| [date](./object/Date.md)      | Formatting, relative time, arithmetic, boundary helpers, predicates  |
| [styles](./styles/README.md)  | `shouldForwardProp` for styled-components, hex → rgb/rgba conversion |

---

All utilities are pure functions — no side effects, no global state. Tree-shake
freely.
