/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { CompletionControl } from './completion-control';
import { RadioRow } from './radio-row';
import { SelectionCard } from './selection-card';
import { SwitchRow } from './switch-row';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('./ui/selection-target', () => jest.requireActual('./ui/selection-target.web'));
jest.mock('./ui/setting-switch', () => jest.requireActual('./ui/setting-switch.web'));
jest.mock('./ui/setting-switch.module.css', () => ({ target: 'switch-target' }));
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

it('uses a real checkbox and isolates both input and label clicks from surrounding navigation', async () => {
  const navigate = jest.fn();
  const change = jest.fn();
  function Example() {
    const [checked, setChecked] = useState(false);
    return (
      <div onClick={navigate}>
        <CompletionControl
          title="Fixture completion"
          checked={checked}
          pending="sync"
          onCheckedChange={(next) => {
            change(next);
            setChecked(next);
          }}
        />
      </div>
    );
  }
  await act(() => root.render(<Example />));
  const input = container.querySelector('input[type="checkbox"]');
  expect(input.getAttribute('aria-label')).toBe('Fixture completion');
  expect(input.getAttribute('aria-description')).toBe('Not complete. Pending sync');
  await act(() => input.click());
  expect(input.checked).toBe(true);
  await act(() => container.querySelector('label').click());
  expect(input.checked).toBe(false);
  expect(change.mock.calls).toEqual([[true], [false]]);
  expect(navigate).not.toHaveBeenCalled();
});

it('preserves native radio grouping and changes only the selected member', async () => {
  const select = jest.fn();
  function Example() {
    const [selected, setSelected] = useState('A');
    return (
      <div role="radiogroup" aria-label="Fixture translations">
        {['A', 'B', 'C'].map((id) => (
          <RadioRow
            key={id}
            title={`Fixture ${id}`}
            groupName="fixture-translations"
            selected={id === selected}
            disabled={id === 'C'}
            onSelect={() => {
              select(id);
              setSelected(id);
            }}
          />
        ))}
      </div>
    );
  }
  await act(() => root.render(<Example />));
  const radios = Array.from(container.querySelectorAll('input[type="radio"]'));
  expect(radios.map((input) => input.name)).toEqual([
    'fixture-translations',
    'fixture-translations',
    'fixture-translations',
  ]);
  await act(() => radios[0].click());
  expect(select).not.toHaveBeenCalled();
  await act(() => radios[1].click());
  expect(radios.map((input) => input.checked)).toEqual([false, true, false]);
  await act(() => radios[1].click());
  await act(() => radios[2].click());
  expect(select.mock.calls).toEqual([['B']]);
});

it('keeps disabled selected cards checked and prevents label activation', async () => {
  const change = jest.fn();
  await act(() =>
    root.render(
      <SelectionCard
        title="Fixture selection"
        description="Synthetic explanation"
        selected
        disabled
        onSelectedChange={change}
      />,
    ),
  );
  const input = container.querySelector('input');
  expect(input.checked).toBe(true);
  expect(input.disabled).toBe(true);
  expect(input.getAttribute('aria-label')).toBe('Fixture selection, Synthetic explanation');
  await act(() => container.querySelector('label').click());
  expect(change).not.toHaveBeenCalled();
});

it('exposes exactly one named switch, supports reversible changes, and honors disabled state', async () => {
  const change = jest.fn();
  function Example({ disabled = false }) {
    const [value, setValue] = useState(false);
    return (
      <SwitchRow
        title="Fixture reminder"
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  await act(() => root.render(<Example />));
  expect(container.querySelectorAll('[role="switch"]')).toHaveLength(1);
  const input = container.querySelector('input[role="switch"]');
  expect(input.getAttribute('aria-label')).toBe('Fixture reminder');
  await act(() => input.click());
  expect(input.checked).toBe(true);
  await act(() => input.click());
  expect(input.checked).toBe(false);
  await act(() => root.render(<Example disabled />));
  expect(input.disabled).toBe(true);
  await act(() => input.click());
  expect(change.mock.calls).toEqual([[true], [false]]);
});
