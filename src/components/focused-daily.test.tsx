import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { ReflectionEditor, type ReflectionEditorProps } from './reflection-editor';
import { ScriptureReader, type ScriptureReaderProps } from './scripture-reader';

import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ScriptureResult } from '@/services/scripture';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

const ready: ScriptureResult = {
  status: 'ready',
  translation: {
    id: 'bsb',
    abbreviation: 'TEST',
    displayName: 'Synthetic translation fixture — not Scripture',
    attribution: 'Synthetic verified attribution fixture',
  },
  verses: [
    { chapter: 1, verse: 2, text: 'Synthetic reading fixture, not Bible text.\nSecond paragraph.' },
    { chapter: 2, verse: 1, text: 'Synthetic next-chapter fixture, not Bible text.' },
  ],
};

function Insets({ children }: { children: ReactNode }) {
  return (
    <SafeAreaInsetsContext value={{ top: 47, bottom: 34, left: 0, right: 0 }}>
      {children}
    </SafeAreaInsetsContext>
  );
}

function readerProps(): ScriptureReaderProps {
  return {
    passageReference: 'Synthetic passage reference 1:2–2:1',
    scripture: ready,
    completion: { checked: false, onCheckedChange: jest.fn() },
  };
}

function reflectionProps(): ReflectionEditorProps {
  return {
    question: 'Synthetic reflection question?',
    privateResponse: '',
    onPrivateResponseChange: jest.fn(),
    draftStatus: { status: 'unsaved' },
    onSaveAndComplete: jest.fn(),
    onSavePrivateResponse: jest.fn(),
    completion: { checked: false, onCheckedChange: jest.fn() },
  };
}

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['light', 'dark'] as const)(
  'presents service text, verse coordinates and attribution with readable %s typography',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const props = readerProps();
    await render(<ScriptureReader {...props} />, { wrapper: Insets });
    expect(screen.getByRole('header', { name: props.passageReference })).toBeOnTheScreen();
    expect(screen.getByText(ready.translation.displayName)).toBeOnTheScreen();
    expect(screen.getByText('Synthetic verified attribution fixture')).toBeOnTheScreen();
    for (const verse of ready.verses) {
      const text = screen.getByText(`${verse.chapter}:${verse.verse}  ${verse.text}`);
      expect(text).toHaveStyle({ ...Typography.body, color: Colors[scheme].text });
      expect(text.props.selectable).toBe(true);
      expect(text.props.allowFontScaling).not.toBe(false);
      expect(text.props.maxFontSizeMultiplier).toBeUndefined();
      expect(text.props.numberOfLines).toBeUndefined();
    }
    await fireEvent.scroll(screen.getByTestId('scripture-reader-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y: 5000 } },
    });
    expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
    await userEvent.press(screen.getByRole('checkbox', { name: 'Mark Scripture complete' }));
    expect(props.completion.onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox', { checked: false })).toBeOnTheScreen();
  },
);

it.each(['passage', 'translation', 'text'] as const)(
  'retains the reference and explicit manual completion for unavailable %s',
  async (reason) => {
    const props = readerProps();
    await render(<ScriptureReader {...props} scripture={{ status: 'unavailable', reason }} />, {
      wrapper: Insets,
    });
    expect(screen.getByRole('header', { name: props.passageReference })).toBeOnTheScreen();
    expect(screen.getByText(/Scripture text is unavailable/)).toBeOnTheScreen();
    expect(screen.queryByText(/Synthetic reading fixture/)).toBeNull();
    expect(screen.queryByText(/TODO|licens|Retry/)).toBeNull();
    expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
    await userEvent.press(screen.getByRole('button', { name: 'I read this passage elsewhere' }));
    expect(props.completion.onCheckedChange).toHaveBeenCalledWith(true);
  },
);

it('uses the actual result translation and never changes completion on a translation update', async () => {
  const props = readerProps();
  const { rerender } = await render(
    <ScriptureReader
      {...props}
      unavailableTranslation={{ ...ready.translation, displayName: 'Old preference' }}
    />,
    { wrapper: Insets },
  );
  expect(screen.queryByText('Old preference')).toBeNull();
  await userEvent.press(screen.getByRole('button', { name: 'I read this passage elsewhere' }));
  expect(props.completion.onCheckedChange).toHaveBeenCalledTimes(1);
  await rerender(
    <ScriptureReader
      {...props}
      scripture={{
        ...ready,
        translation: {
          ...ready.translation,
          displayName: 'Second synthetic edition',
          attribution: null,
        },
      }}
      completion={{ ...props.completion, checked: true }}
    />,
  );
  expect(screen.getByText('Second synthetic edition')).toBeOnTheScreen();
  expect(screen.queryByText('Synthetic verified attribution fixture')).toBeNull();
  expect(props.completion.onCheckedChange).toHaveBeenCalledTimes(1);
  await userEvent.press(
    screen.getByRole('checkbox', { name: 'Scripture complete', checked: true }),
  );
  expect(props.completion.onCheckedChange).toHaveBeenLastCalledWith(false);
});

it('blocks Scripture writes while saving and keeps failed completion retryable', async () => {
  const props = readerProps();
  const { rerender } = await render(
    <ScriptureReader {...props} completion={{ ...props.completion, pending: 'local' }} />,
    { wrapper: Insets },
  );
  await userEvent.press(screen.getByRole('checkbox', { disabled: true }));
  await userEvent.press(screen.getByRole('button', { disabled: true }));
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  await rerender(<ScriptureReader {...props} completionFailed />);
  expect(screen.getByRole('alert')).toHaveTextContent(/Scripture completion could not be saved/);
  await userEvent.press(screen.getByRole('checkbox', { checked: false }));
  expect(props.completion.onCheckedChange).toHaveBeenCalledWith(true);
});

it('preserves unavailable Scripture completion and service metadata through pending sync', async () => {
  const props = readerProps();
  await render(
    <ScriptureReader
      {...props}
      scripture={{ status: 'unavailable', reason: 'text' }}
      unavailableTranslation={ready.translation}
      completion={{ ...props.completion, checked: true, pending: 'sync' }}
    />,
    { wrapper: Insets },
  );
  expect(screen.getByText(ready.translation.displayName)).toBeOnTheScreen();
  const control = screen.getByRole('checkbox', { checked: true });
  expect(control).toBeEnabled();
  expect(control).toHaveAccessibilityValue({ text: 'Complete. Pending sync' });
  await userEvent.press(control);
  expect(props.completion.onCheckedChange).toHaveBeenCalledWith(false);
});

it('keeps typing and confirmed draft autosaves separate from explicit completion', async () => {
  const props = reflectionProps();
  function Example({ synced = false }: { synced?: boolean }) {
    const [privateResponse, setPrivateResponse] = useState('');
    return (
      <ReflectionEditor
        {...props}
        privateResponse={privateResponse}
        onPrivateResponseChange={setPrivateResponse}
        draftStatus={{ status: synced ? 'synced' : 'unsaved' }}
      />
    );
  }
  const { rerender } = await render(<Example />, { wrapper: Insets });
  expect(screen.getByRole('button', { name: 'Save & mark reflection complete' })).toBeDisabled();
  await userEvent.type(
    screen.getByLabelText('Private response (optional)'),
    'Synthetic private response',
  );
  await rerender(<Example synced />);
  expect(screen.getByText('Saved and synced')).toBeOnTheScreen();
  expect(props.onSaveAndComplete).not.toHaveBeenCalled();
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Save & mark reflection complete' }));
  expect(props.onSaveAndComplete).toHaveBeenCalledWith('Synthetic private response');
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  expect(screen.queryByRole('checkbox')).toBeNull();
});

it('allows reflection without writing and does not discard an existing private draft', async () => {
  const props = reflectionProps();
  await render(<ReflectionEditor {...props} privateResponse="Synthetic private draft" />, {
    wrapper: Insets,
  });
  await userEvent.press(screen.getByRole('button', { name: 'I reflected without writing' }));
  expect(props.completion.onCheckedChange).toHaveBeenCalledWith(true);
  expect(props.onPrivateResponseChange).not.toHaveBeenCalled();
  expect(props.onSaveAndComplete).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Private response (optional)')).toHaveDisplayValue(
    'Synthetic private draft',
  );
});

it('retains recorded completion while editing, clearing and saving a historical response', async () => {
  const props = reflectionProps();
  function Example() {
    const [privateResponse, setPrivateResponse] = useState('Synthetic historical private response');
    return (
      <ReflectionEditor
        {...props}
        privateResponse={privateResponse}
        onPrivateResponseChange={setPrivateResponse}
        completion={{ ...props.completion, checked: true }}
      />
    );
  }
  await render(<Example />, { wrapper: Insets });
  const editor = screen.getByLabelText('Private response (optional)');
  await userEvent.type(editor, ' edited');
  await userEvent.press(screen.getByRole('button', { name: 'Save response' }));
  expect(props.onSavePrivateResponse).toHaveBeenLastCalledWith(
    'Synthetic historical private response edited',
  );
  await userEvent.clear(editor);
  await userEvent.press(screen.getByRole('button', { name: 'Save response' }));
  expect(props.onSavePrivateResponse).toHaveBeenLastCalledWith('');
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('checkbox', { checked: true }));
  expect(props.completion.onCheckedChange).toHaveBeenCalledWith(false);
});

it.each(['', ' \n  '])(
  'requires non-whitespace writing for the save-and-complete action',
  async (privateResponse) => {
    const props = reflectionProps();
    await render(<ReflectionEditor {...props} privateResponse={privateResponse} />, {
      wrapper: Insets,
    });
    await userEvent.press(
      screen.getByRole('button', { name: 'Save & mark reflection complete', disabled: true }),
    );
    expect(props.onSaveAndComplete).not.toHaveBeenCalled();
    await userEvent.press(screen.getByRole('button', { name: 'I reflected without writing' }));
    expect(props.completion.onCheckedChange).toHaveBeenCalledWith(true);
  },
);

it.each([
  [{ status: 'unsaved' }, 'Draft not saved'],
  [{ status: 'saving' }, 'Saving draft…'],
  [{ status: 'pending' }, 'Saved locally · Pending sync'],
  [{ status: 'sync-failed' }, 'Failed to sync · Saved locally'],
  [{ status: 'save-failed', offline: true }, 'Failed to save · Changes are not saved · Offline'],
  [{ status: 'offline' }, 'Offline'],
] satisfies [ReflectionEditorProps['draftStatus'], string][])(
  'shows only the supplied draft outcome: %j',
  async (draftStatus, label) => {
    const props = reflectionProps();
    await render(
      <ReflectionEditor
        {...props}
        privateResponse="Synthetic private unsaved text"
        draftStatus={draftStatus}
      />,
      { wrapper: Insets },
    );
    expect(screen.getByText(label)).toBeOnTheScreen();
    expect(screen.queryByText('Saved and synced')).toBeNull();
    expect(screen.getByLabelText('Private response (optional)')).toHaveDisplayValue(
      'Synthetic private unsaved text',
    );
    expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  },
);

it('blocks conflicting reflection edits during submission and retains the draft after failure', async () => {
  const props = { ...reflectionProps(), privateResponse: 'Synthetic private retry draft' };
  const { rerender } = await render(<ReflectionEditor {...props} saving />, { wrapper: Insets });
  expect(screen.getByLabelText('Private response (optional)')).toBeDisabled();
  for (const action of screen.getAllByRole('button')) {
    expect(action).toBeDisabled();
    await userEvent.press(action);
  }
  expect(props.onSaveAndComplete).not.toHaveBeenCalled();
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  await rerender(<ReflectionEditor {...props} completionFailed />);
  expect(screen.getByRole('alert')).toHaveTextContent(/Reflection completion could not be saved/);
  expect(screen.getByRole('alert')).not.toHaveTextContent(props.privateResponse);
  expect(screen.getByLabelText('Private response (optional)')).toHaveDisplayValue(
    props.privateResponse,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Save & mark reflection complete' }));
  expect(props.onSaveAndComplete).toHaveBeenCalledWith(props.privateResponse);
});

it('keeps long private text and wrapping actions in the keyboard-aware page scroll', async () => {
  const props = {
    ...reflectionProps(),
    privateResponse: 'Synthetic private long response.\n'.repeat(100),
  };
  await render(<ReflectionEditor {...props} />, { wrapper: Insets });
  const scroll = screen.getByTestId('reflection-editor-scroll');
  expect(scroll).toHaveProp('automaticallyAdjustKeyboardInsets', true);
  expect(scroll).toHaveProp('keyboardShouldPersistTaps', 'handled');
  const editor = screen.getByLabelText('Private response (optional)');
  expect(editor).toHaveProp('multiline', true);
  expect(editor).toHaveProp('scrollEnabled', false);
  expect(editor).toHaveProp('autoComplete', 'off');
  expect(editor).toHaveProp('importantForAutofill', 'no');
  expect(editor.props.accessibilityLabel).not.toContain(props.privateResponse);
  expect(editor.props.accessibilityHint).not.toContain(props.privateResponse);
  for (const node of [
    editor,
    screen.getByText(props.question),
    screen.getByText('Save & mark reflection complete'),
  ]) {
    expect(node.props.allowFontScaling).not.toBe(false);
    expect(node.props.maxFontSizeMultiplier).toBeUndefined();
    expect(node.props.numberOfLines).toBeUndefined();
  }
  expect(screen.queryByRole('button', { name: /share/i })).toBeNull();
});

it('keeps a completed private response editable in dark mode while sync is pending', async () => {
  jest.mocked(useColorScheme).mockReturnValue('dark');
  const props = reflectionProps();
  const { rerender } = await render(
    <ReflectionEditor
      {...props}
      completion={{ ...props.completion, checked: true, pending: 'sync' }}
    />,
    { wrapper: Insets },
  );
  const editor = screen.getByLabelText('Private response (optional)');
  expect(editor).toHaveStyle({ color: Colors.dark.text, backgroundColor: Colors.dark.surface });
  expect(editor).toBeEnabled();
  await userEvent.type(editor, 'Synthetic private edit');
  expect(props.onPrivateResponseChange).toHaveBeenCalled();
  expect(props.completion.onCheckedChange).not.toHaveBeenCalled();
  await rerender(
    <ReflectionEditor
      {...props}
      completion={{ ...props.completion, checked: true, pending: 'local' }}
    />,
  );
  expect(screen.getByLabelText('Private response (optional)')).toBeDisabled();
  expect(screen.getByRole('checkbox', { checked: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save response' })).toBeDisabled();
});
