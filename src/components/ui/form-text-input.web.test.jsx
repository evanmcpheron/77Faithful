/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { FormTextInput } from './form-text-input.web';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

// JSDOM teardown reads globals; this DOM-only suite must not initialize Expo's lazy native fetch.
Object.defineProperty(globalThis, 'fetch', { configurable: true, value: undefined });

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  // JSDOM has no layout. Model browser measurements to exercise resizing against the real DOM input.
  jest.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
    return Math.max(
      Number.parseFloat(this.style.height) || 0,
      this.value.split('\n').length * 26 + 16,
    );
  });
  jest.spyOn(HTMLTextAreaElement.prototype, 'offsetHeight', 'get').mockReturnValue(50);
  jest.spyOn(HTMLTextAreaElement.prototype, 'clientHeight', 'get').mockReturnValue(48);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

it('fits prefilled text, grows when typing, shrinks after deletion, and forwards native changes and refs', async () => {
  const onChange = jest.fn();
  const onChangeText = jest.fn();
  const ref = { current: null };
  await act(() =>
    root.render(
      <FormTextInput
        ref={ref}
        accessibilityLabel="Fixture editor"
        multiline
        scrollEnabled={false}
        defaultValue={'Synthetic line\n'.repeat(10)}
        onChange={onChange}
        onChangeText={onChangeText}
      />,
    ),
  );
  const input = container.querySelector('textarea');
  expect(ref.current).toBe(input);
  const initialHeight = Number.parseFloat(input.style.height);
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  await act(() => {
    setValue.call(input, 'Synthetic line\n'.repeat(100));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(Number.parseFloat(input.style.height)).toBeGreaterThan(initialHeight);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChangeText).toHaveBeenLastCalledWith('Synthetic line\n'.repeat(100));
  await act(() => {
    setValue.call(input, 'Short fixture');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(Number.parseFloat(input.style.height)).toBeLessThan(initialHeight);
  expect(input.value).toBe('Short fixture');
  await act(() => root.unmount());
  expect(ref.current).toBeNull();
  root = createRoot(container);
});

it('resizes when a controlled draft loads and preserves single-line behavior', async () => {
  const field = (value, multiline = true) => (
    <FormTextInput multiline={multiline} scrollEnabled={false} value={value} />
  );
  await act(() => root.render(field('')));
  const input = container.querySelector('textarea');
  const initialHeight = Number.parseFloat(input.style.height);
  await act(() => root.render(field('Loaded synthetic line\n'.repeat(100))));
  expect(Number.parseFloat(input.style.height)).toBeGreaterThan(initialHeight);
  await act(() => root.render(field('synthetic@example.test', false)));
  expect(container.querySelector('textarea')).toBeNull();
  expect(container.querySelector('input').style.height).toBe('');
});
