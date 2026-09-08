/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { PracticeCard } from './practice-card';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('./ui/selection-target', () => jest.requireActual('./ui/selection-target.web'));
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('expo-symbols', () => ({ SymbolView: () => <span>Decorative fixture glyph</span> }));

// Avoid initializing Expo's lazy native fetch during JSDOM teardown.
Object.defineProperty(globalThis, 'fetch', { configurable: true, value: undefined });

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

it('keeps checkbox input and label clicks outside the navigation anchor', async () => {
  const navigate = jest.fn((event) => event.preventDefault());
  const complete = jest.fn();
  await act(() =>
    root.render(
      <PracticeCard
        title="Scripture"
        complete={false}
        navigation={{ onPress: navigate, href: '/day/3/scripture' }}
        completion={{ onCheckedChange: complete }}
      />,
    ),
  );
  const link = container.querySelector('a');
  const checkbox = container.querySelector('input[type="checkbox"]');
  expect(link.getAttribute('href')).toBe('/day/3/scripture');
  expect(link.contains(checkbox)).toBe(false);
  expect(checkbox.getAttribute('aria-label')).toBe('Scripture completion');
  await act(() => checkbox.click());
  await act(() => container.querySelector('label').click());
  expect(complete.mock.calls).toEqual([[true], [true]]);
  expect(navigate).not.toHaveBeenCalled();
  await act(() => link.click());
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledTimes(2);
});

it('removes disabled navigation href while leaving historical completion editable during sync', async () => {
  const navigate = jest.fn();
  const complete = jest.fn();
  await act(() =>
    root.render(
      <PracticeCard
        title="Stored historical practice"
        complete
        navigation={{ onPress: navigate, href: '/day/3/scripture', disabled: true }}
        completion={{ onCheckedChange: complete, pending: 'sync' }}
      />,
    ),
  );
  expect(container.querySelector('a[href]')).toBeNull();
  const link = container.querySelector('[role="link"]');
  expect(link.getAttribute('aria-disabled')).toBe('true');
  await act(() => link.click());
  expect(navigate).not.toHaveBeenCalled();
  const checkbox = container.querySelector('input[type="checkbox"]');
  expect(checkbox.checked).toBe(true);
  expect(checkbox.disabled).toBe(false);
  expect(checkbox.getAttribute('aria-description')).toBe('Complete. Pending sync');
  await act(() => checkbox.click());
  expect(complete.mock.calls).toEqual([[false]]);
});
