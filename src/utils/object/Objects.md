# Object Utils

`import { ... } from '@td/utils/object/object.util'`

---

## Checking Properties

```ts
hasProperties({ a: 1 }); // true   — has at least one own key
hasProperties({}); // false
hasProperty(obj, 'name'); // true/false — safe even if obj is null/undefined
hasOwnProp(obj, 'name'); // same, thinner wrapper around hasOwnProperty
```

---

## Reading Values

```ts
getFirstPropertyValue({ a: 1, b: 2 }); // 1

// Dot-path access — no optional chaining chains required
getNestedValue({ user: { name: 'John' } }, 'user.name'); // 'John'
getNestedValue(obj, 'a.b.c'); // undefined if any segment is missing
```

---

## Writing Values

```ts
// Mutates in place, creates intermediate objects as needed
setNestedValue({}, 'user.name', 'John');
// → { user: { name: 'John' } }
```

---

## Cloning & Cleaning

```ts
const copy = deepClone(original); // deep clone — handles nested objects & arrays

removeUndefined({ a: 1, b: undefined, c: 3 });
// → { a: 1, c: 3 }
```

---

## Flatten / Unflatten

```ts
flatten({ user: { name: 'John', age: 30 } });
// → { 'user.name': 'John', 'user.age': 30 }

unflatten({ 'user.name': 'John', 'user.age': 30 });
// → { user: { name: 'John', age: 30 } }
```

> Arrays are **not** descended into during `flatten` — array values are kept
> as-is.
