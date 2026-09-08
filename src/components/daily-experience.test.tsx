import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { MorningIntention } from './morning-intention';
import { PracticeCard } from './practice-card';
import { PrayerPrompt } from './prayer-prompt';
import { PracticeProgress } from './progress';

it('isolates navigation, inline content, scrolling, and explicit completion', async () => {
  const navigate = jest.fn();
  const complete = jest.fn();
  await render(
    <ScrollView testID="day-scroll">
      <PracticeCard
        title="Scripture"
        supportingText="Synthetic passage reference"
        complete={false}
        navigation={{ onPress: navigate }}
        completion={{ onCheckedChange: complete }}>
        <PrayerPrompt prompt="Synthetic prayer prompt for interaction testing." />
      </PracticeCard>
    </ScrollView>,
  );
  expect(complete).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('link'));
  await userEvent.press(screen.getByText('Synthetic prayer prompt for interaction testing.'));
  await fireEvent.scroll(screen.getByTestId('day-scroll'), {
    nativeEvent: { contentOffset: { x: 0, y: 200 } },
  });
  expect(complete).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('checkbox', { name: 'Scripture completion' }));
  expect(complete.mock.calls).toEqual([[true]]);
  expect(navigate).toHaveBeenCalledTimes(1);
});

it.each(['Scripture', 'Reflection'])(
  '%s opens a focused screen without inline completion',
  async (title) => {
    const navigate = jest.fn();
    const { rerender } = await render(
      <PracticeCard title={title} complete={false} navigation={{ onPress: navigate }} />,
    );
    await userEvent.press(screen.getByRole('link', { name: `${title}, Not complete` }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByText('Not complete')).toBeOnTheScreen();
    await rerender(<PracticeCard title={title} complete navigation={{ onPress: navigate }} />);
    expect(screen.getByRole('link', { name: `${title}, Complete` })).toBeEnabled();
    expect(screen.getByText('Complete')).toBeOnTheScreen();
  },
);

it.each(['Prayer', 'Stored optional practice A', 'Stored optional practice B'])(
  'records and unrecords %s inline using the supplied day definition',
  async (title) => {
    const change = jest.fn();
    function Example() {
      const [complete, setComplete] = useState(false);
      return (
        <PracticeCard
          title={title}
          supportingText="Synthetic historical day instructions"
          complete={complete}
          completion={{
            onCheckedChange: (next) => {
              change(next);
              setComplete(next);
            },
          }}
        />
      );
    }
    await render(<Example />);
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.queryByRole('link')).toBeNull();
    await userEvent.press(
      screen.getByRole('checkbox', { name: `${title} completion`, checked: false }),
    );
    expect(screen.getByText('Complete')).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('checkbox', { checked: true }));
    expect(change.mock.calls).toEqual([[true], [false]]);
  },
);

it.each([false, true])('preserves completion=%s while blocked or pending', async (complete) => {
  const change = jest.fn();
  const navigate = jest.fn();
  const { rerender } = await render(
    <PracticeCard
      title="Scripture"
      supportingText="Synthetic local save in progress"
      complete={complete}
      navigation={{ onPress: navigate }}
      completion={{ onCheckedChange: change, disabled: true, pending: 'local' }}
    />,
  );
  const checkbox = screen.getByRole('checkbox', { checked: complete, disabled: true, busy: true });
  expect(checkbox).toHaveAccessibilityValue({
    text: `${complete ? 'Complete' : 'Not complete'}. Saving on this device…`,
  });
  await userEvent.press(checkbox);
  expect(change).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('link'));
  expect(navigate).toHaveBeenCalledTimes(1);

  await rerender(
    <PracticeCard
      title="Scripture"
      complete={complete}
      navigation={{ onPress: navigate, disabled: true }}
      completion={{ onCheckedChange: change, pending: 'sync' }}
    />,
  );
  const pending = screen.getByRole('checkbox', { checked: complete, busy: false });
  expect(pending).toBeEnabled();
  expect(pending).toHaveAccessibilityValue({
    text: `${complete ? 'Complete' : 'Not complete'}. Pending sync`,
  });
  await userEvent.press(pending);
  expect(change.mock.calls).toEqual([[!complete]]);
  expect(screen.getByRole('checkbox', { checked: complete })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('link', { disabled: true }));
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('keeps prayer readable without a timer, editor, or collapse control', async () => {
  const prompt = 'Synthetic prayer guidance.\nA second paragraph remains visible.';
  await render(<PrayerPrompt prompt={prompt} />);
  expect(screen.getByRole('header', { name: 'Prayer prompt' })).toBeOnTheScreen();
  const text = screen.getByText(prompt);
  expect(text.props.numberOfLines).toBeUndefined();
  expect(text.props.allowFontScaling).not.toBe(false);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('timer')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
});

it('keeps optional intention edits separate from practice progress and shows only supplied sync outcomes', async () => {
  const change = jest.fn();
  function Example({ status }: { status?: 'pending' | 'sync-failed' }) {
    const [value, setValue] = useState('Synthetic historical intention');
    return (
      <ScrollView>
        <MorningIntention
          prompt="Synthetic stable intention prompt"
          value={value}
          onChangeText={(next) => {
            change(next);
            setValue(next);
          }}
          syncStatus={status ? { status } : undefined}
        />
        <PracticeProgress recordedCount={2} />
      </ScrollView>
    );
  }
  const { rerender } = await render(<Example />);
  expect(screen.queryByText(/Saved/)).toBeNull();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(
    screen.getByText('Your intention is private and is not one of the five required practices.'),
  ).toBeOnTheScreen();
  const editor = screen.getByLabelText('Morning intention (optional)');
  expect(editor).toHaveDisplayValue('Synthetic historical intention');
  expect(editor.props.multiline).toBe(true);
  expect(editor.props.scrollEnabled).toBe(false);
  await userEvent.type(editor, ' edited');
  expect(change).toHaveBeenLastCalledWith('Synthetic historical intention edited');
  expect(screen.getByText('2 of 5 recorded')).toBeOnTheScreen();
  await rerender(<Example status="pending" />);
  expect(screen.getByText('Saved locally · Pending sync')).toBeOnTheScreen();
  await rerender(<Example status="sync-failed" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to sync · Saved locally');
  expect(screen.getByLabelText('Morning intention (optional)')).toHaveDisplayValue(
    'Synthetic historical intention edited',
  );
});

it('preserves a disabled intention draft and exposes save failure without claiming completion', async () => {
  const change = jest.fn();
  await render(
    <MorningIntention
      prompt="Synthetic stable intention prompt"
      value="Synthetic unsaved draft"
      onChangeText={change}
      disabled
      syncStatus={{ status: 'save-failed', offline: true }}
    />,
  );
  const editor = screen.getByLabelText('Morning intention (optional)');
  expect(editor).toBeDisabled();
  await userEvent.type(editor, ' ignored');
  expect(change).not.toHaveBeenCalled();
  expect(editor).toHaveDisplayValue('Synthetic unsaved draft');
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Failed to save · Changes are not saved · Offline',
  );
  expect(screen.queryByRole('checkbox')).toBeNull();
});
