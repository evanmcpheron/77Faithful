# String Utils

`import { ... } from '@td/utils/string/string.util'`

---

## Case Conversion

| Function            | Example                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `toCamelCase(str)`  | `'hello-world'` → `'helloWorld'`                                 |
| `toKebabCase(str)`  | `'helloWorld'` → `'hello-world'`                                 |
| `toSnakeCase(str)`  | `'helloWorld'` → `'hello_world'`                                 |
| `toPascalCase(str)` | `'hello-world'` → `'HelloWorld'`                                 |
| `capitalize(str)`   | `'hello world'` → `'Hello world'`                                |
| `titleCase(str)`    | `'hello world'` → `'Hello World'`                                |
| `normalCase(str)`   | `'helloWorld'` → `'Hello World'` — camelCase/PascalCase → spaced |

---

## Formatting

```ts
formatNumber(1234567.89); // '1,234,567.89'
formatNumber('1000'); // '1,000'

truncate('hello world', 8); // 'hello...'
truncate('hello world', 8, '…'); // 'hello w…'  — custom suffix

slug('Hello World 2024!'); // 'hello-world-2024'

padStart('5', 3, '0'); // '005'
padEnd('5', 3, '0'); // '500'

repeat('ab', 3); // 'ababab'
repeatChar('*', 5); // '*****'

formatAddress({
	addressLine1: '123 Main St',
	city: 'Austin',
	stateCode: 'TX',
	postalCode: '78701',
}); // '123 Main St, Austin, TX, 78701'
```

---

## Validation

```ts
isEmail('user@example.com'); // true
isUrl('https://example.com'); // true
isNumeric('12345'); // true  — digits only
isEmpty('   '); // true  — blank/whitespace
isPalindrome('racecar'); // true
```

---

## Searching & Comparing

```ts
containsAny('hello world', 'foo', 'world'); // true
containsAll('hello world', 'hello', 'world'); // true

stringSimilarity('hello', 'hallo'); // 0.8  — 0 (no match) → 1 (identical)

highlight('hello world', 'world'); // 'hello **world**'
highlight('hello world', 'world', '<em>'); // 'hello <em>world<em>'
```

---

## Cleaning & Transforming

```ts
removeWhitespace('hello world'); // 'helloworld'
removeSpecialChars('hello@#123'); // 'hello123'
normalizeSpaces('hello    world'); // 'hello world'
removeDuplicates('aabbcc'); // 'abc'
stripHtml('<p>Hello <b>world</b></p>'); // 'Hello world'

extractNumbers('abc123def456'); // '123456'
splitMultiple('a,b;c', ',', ';'); // ['a', 'b', 'c']

reverse('hello'); // 'olleh'
wordCount('hello world test'); // 3
charCount('hello world'); // 10  — excludes whitespace
longestWord('the quick brown fox'); // 'quick'
```

---

## Encoding

```ts
toBase64('hello'); // 'aGVsbG8='
fromBase64('aGVsbG8='); // 'hello'
```

---

## Misc

```ts
pluralize('cat'); // 'cats'
pluralize('box'); // 'boxes'
pluralize('child'); // 'children'  — handles common irregulars

toNumber('123'); // 123
toNumber('abc'); // null

escapeRegex('a.b*c'); // 'a\\.b\\*c'
```
