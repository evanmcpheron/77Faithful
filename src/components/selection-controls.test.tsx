import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CompletionControl } from './completion-control';
import { NavigationRow } from './navigation-row';
import { RadioRow } from './radio-row';
import { SelectionCard } from './selection-card';
import { Surface } from './surface';
import { SwitchRow } from './switch-row';
import { TextField } from './text-field';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => jest.mocked(useColorScheme).mockReturnValue('light'));

it('records and reverses completion only on explicit activation, including during pending sync', async () => {
  const onChange = jest.fn();
  function Example() {
    const [checked, setChecked] = useState(false);
    return (
      <CompletionControl
        title="Fixture practice"
        checked={checked}
        pending="sync"
        onCheckedChange={(next) => {
          onChange(next);
          setChecked(next);
        }}
      />
    );
  }
  await render(<Example />);
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByText('Not complete')).toBeOnTheScreen();
  const control = screen.getByRole('checkbox', { checked: false, name: 'Fixture practice' });
  expect(control).toHaveStyle({ minHeight: 48, minWidth: 48 });
  expect(control).toHaveAccessibilityValue({ text: 'Not complete. Pending sync' });
  await userEvent.press(control);
  expect(onChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByText('Complete')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('checkbox', { checked: true }));
  expect(onChange.mock.calls).toEqual([[true], [false]]);
  expect(screen.getByRole('checkbox', { checked: false })).toBeEnabled();
});

it('keeps caller state authoritative and distinguishes local pending from background sync', async () => {
  const onChange = jest.fn();
  const { rerender } = await render(
    <CompletionControl title="Fixture practice" checked={false} onCheckedChange={onChange} />,
  );
  await userEvent.press(screen.getByRole('checkbox'));
  expect(screen.getByRole('checkbox', { checked: false })).toBeOnTheScreen();
  await rerender(
    <CompletionControl
      title="Fixture practice"
      checked
      onCheckedChange={onChange}
      pending="local"
    />,
  );
  expect(screen.getByRole('checkbox', { checked: true, busy: true })).toHaveAccessibilityValue({
    text: 'Complete. Saving on this device…',
  });
  await rerender(
    <CompletionControl
      title="Fixture practice"
      checked
      onCheckedChange={onChange}
      pending="sync"
    />,
  );
  expect(screen.getByRole('checkbox', { checked: true, busy: false })).toBeEnabled();
  expect(screen.queryByText('Saving on this device…')).toBeNull();
  await rerender(<CompletionControl title="Fixture practice" checked onCheckedChange={onChange} />);
  expect(screen.queryByText('Pending sync')).toBeNull();
});

it.each([false, true])(
  'blocks disabled completion and selection while retaining checked=%s',
  async (checked) => {
    const onChange = jest.fn();
    await render(
      <View>
        <CompletionControl
          title="Fixture completion"
          checked={checked}
          disabled
          onCheckedChange={onChange}
        />
        <SelectionCard
          title="Fixture option"
          description="Temporarily unavailable"
          selected={checked}
          disabled
          onSelectedChange={onChange}
        />
        <RadioRow
          title="Fixture translation"
          groupName="fixture-translations"
          selected={checked}
          disabled
          onSelect={onChange}
        />
      </View>,
    );
    const controls = [
      ...screen.getAllByRole('checkbox', { checked, disabled: true }),
      screen.getByRole('radio', { checked, disabled: true }),
    ];
    for (const control of controls) await userEvent.press(control);
    expect(onChange).not.toHaveBeenCalled();
  },
);

it('allows generic cards to select and deselect independently without a two-choice rule', async () => {
  function Example() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <View>
        {['A', 'B', 'C'].map((id) => (
          <SelectionCard
            key={id}
            title={`Fixture ${id}`}
            description="Synthetic option"
            selected={selected.includes(id)}
            onSelectedChange={(next) =>
              setSelected(next ? [...selected, id] : selected.filter((item) => item !== id))
            }
          />
        ))}
      </View>
    );
  }
  await render(<Example />);
  for (const control of screen.getAllByRole('checkbox')) await userEvent.press(control);
  expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(3);
  await userEvent.press(screen.getByRole('checkbox', { name: 'Fixture B, Synthetic option' }));
  expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
  expect(
    screen.getByRole('checkbox', { name: 'Fixture B, Synthetic option', checked: false }),
  ).toBeOnTheScreen();
});

it('selects one radio and never toggles the selected option off', async () => {
  const onSelect = jest.fn();
  function Example() {
    const [selected, setSelected] = useState('A');
    return (
      <View accessibilityRole="radiogroup" accessibilityLabel="Fixture translations">
        {['A', 'B'].map((id) => (
          <RadioRow
            key={id}
            title={`Fixture ${id}`}
            groupName="fixture-translations"
            selected={selected === id}
            onSelect={() => {
              onSelect(id);
              setSelected(id);
            }}
          />
        ))}
      </View>
    );
  }
  await render(<Example />);
  await userEvent.press(screen.getByRole('radio', { name: 'Fixture A' }));
  expect(onSelect).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('radio', { name: 'Fixture B' }));
  expect(screen.getByRole('radio', { name: 'Fixture A', checked: false })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'Fixture B', checked: true })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('radio', { name: 'Fixture B' }));
  expect(onSelect.mock.calls).toEqual([['B']]);
});

it('isolates completion, navigation, scrolling, and private draft editing', async () => {
  const navigate = jest.fn();
  const complete = jest.fn();
  const saveDraft = jest.fn();
  await render(
    <ScrollView testID="fixture-scroll">
      <Surface>
        <NavigationRow label="Open fixture reader" onPress={navigate} />
        <CompletionControl
          title="Fixture Scripture completion"
          checked={false}
          onCheckedChange={complete}
        />
        <TextField label="Fixture reflection draft" multiline onChangeText={saveDraft} />
        <CompletionControl
          title="Fixture Reflection completion"
          checked={false}
          onCheckedChange={complete}
        />
      </Surface>
    </ScrollView>,
  );
  await userEvent.press(screen.getByRole('link'));
  await fireEvent.scroll(screen.getByTestId('fixture-scroll'), {
    nativeEvent: { contentOffset: { x: 0, y: 1000 } },
  });
  await userEvent.type(
    screen.getByLabelText('Fixture reflection draft'),
    'Synthetic private draft',
  );
  expect(saveDraft).toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('checkbox', { name: 'Fixture Scripture completion' }));
  expect(complete.mock.calls).toEqual([[true]]);
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('uses one native switch whose changes stay separate from Settings navigation', async () => {
  const navigate = jest.fn();
  const onChange = jest.fn();
  function Example() {
    const [value, setValue] = useState(false);
    return (
      <View>
        <NavigationRow label="Notifications" onPress={navigate} />
        <SwitchRow
          title="Fixture reminder"
          description="On this device"
          value={value}
          onValueChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      </View>
    );
  }
  await render(<Example />);
  await userEvent.press(screen.getByRole('link'));
  expect(onChange).not.toHaveBeenCalled();
  await fireEvent(
    screen.getByRole('switch', { name: 'Fixture reminder, On this device', checked: false }),
    'valueChange',
    true,
  );
  expect(screen.getByRole('switch', { checked: true })).toBeOnTheScreen();
  await fireEvent(screen.getByRole('switch'), 'valueChange', false);
  expect(onChange.mock.calls).toEqual([[true], [false]]);
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button')).toBeNull();
});

it.each([false, true])('preserves disabled switch value=%s and blocks changes', async (value) => {
  const onChange = jest.fn();
  await render(
    <SwitchRow title="Fixture reminder" value={value} disabled onValueChange={onChange} />,
  );
  const control = screen.getByRole('switch', { checked: value, disabled: true });
  await fireEvent(control, 'valueChange', !value);
  expect(onChange).not.toHaveBeenCalled();
});

it.each(['light', 'dark'] as const)(
  'preserves readable %s states, focus, and unrestricted label growth',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const title = 'A long synthetic option title that must wrap at large text sizes';
    await render(
      <SelectionCard
        title={title}
        description="Synthetic supporting description"
        selected
        onSelectedChange={jest.fn()}
      />,
    );
    const control = screen.getByRole('checkbox', { checked: true });
    expect(control).toHaveStyle({ backgroundColor: Colors[scheme].backgroundSelected });
    const text = screen.getByText(title);
    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.allowFontScaling).not.toBe(false);
    expect(text.props.maxFontSizeMultiplier).toBeUndefined();
    await fireEvent(control, 'focus');
    expect(control).toHaveStyle({ outlineColor: Colors[scheme].focus, outlineWidth: 2 });
    await fireEvent(control, 'blur');
    expect(control).not.toHaveStyle({ outlineWidth: 2 });
  },
);
