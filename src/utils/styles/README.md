# Styles Utils

`import { ... } from '@td/utils/styles/styles.util'`

For styled-components prop filtering and hex color conversion in React Native.

---

## `createShouldForwardProp`

Builds a `shouldForwardProp` predicate that prevents custom styling props from
leaking onto native RN elements.

**The rule:** a prop is forwarded when it's a known RN prop **or** it isn't in
your `customProps` list.

```ts
const MyButton = styled.Pressable.withConfig({
	shouldForwardProp: createShouldForwardProp<Props>([
		'variant',
		'size',
		'isLoading',
	]),
})`
	opacity: ${({ isLoading }) => (isLoading ? 0.5 : 1)};
`;
```

Pass an array of your component's styling-only props. Anything in that list gets
stripped before hitting the native element; everything else passes through.

The built-in `standardRNProps` whitelist covers all common RN primitives:
`View`, `Text`, `TextInput`, `Image`, `Pressable`, `TouchableOpacity`, and
`ScrollView` — including layout, accessibility, press, responder, scroll, and
input props.

---

## Color Conversion

Convert hex colors to CSS color strings. Accepts 3-digit (`#fff`) and 6-digit
(`#ffffff`) hex — with or without `#`.

```ts
hexToRgbString('#1a2b3c'); // 'rgb(26, 43, 60)'
hexToRgbString('fff'); // 'rgb(255, 255, 255)'

hexToRgbaString('#1a2b3c', 0.5); // 'rgba(26, 43, 60, 0.5)'
hexToRgbaString('#000', 0); // 'rgba(0, 0, 0, 0)'
```

Both throw if the hex string is malformed. `hexToRgbaString` also throws if
`alpha` is outside `[0, 1]`.
