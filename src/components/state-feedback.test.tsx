import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { Button } from './button';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { InlineNotice } from './inline-notice';
import { LoadingPlaceholder } from './loading-placeholder';
import { SyncStatus, type SyncStatusProps } from './sync-status';
import { TextField } from './text-field';
import { ThemedText } from './themed-text';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it('offers Retry only with an operation and blocks repeated attempts while it is pending', async () => {
  const onRetry = jest.fn();
  const { rerender } = await render(<ErrorState message="Text is unavailable." />);
  expect(screen.getByRole('alert')).toHaveTextContent('Error: Text is unavailable.');
  expect(screen.queryByRole('button')).toBeNull();

  await rerender(<ErrorState message="Text could not load." onRetry={onRetry} />);
  await userEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetry).toHaveBeenCalledTimes(1);

  await rerender(<ErrorState message="Text could not load." onRetry={onRetry} retrying />);
  const retry = screen.getByRole('button', { name: 'Retrying…', disabled: true });
  expect(retry).toHaveProp('accessibilityState', { busy: true, disabled: true });
  await userEvent.press(retry);
  expect(onRetry).toHaveBeenCalledTimes(1);

  await rerender(<ErrorState message="Text could not load." onRetry={onRetry} />);
  await userEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetry).toHaveBeenCalledTimes(2);
});

it.each([
  ['synced', 'Saved and synced'],
  ['pending', 'Saved locally · Pending sync'],
  ['sync-failed', 'Failed to sync · Saved locally'],
  ['save-failed', 'Failed to save · Changes are not saved'],
  ['offline', 'Offline'],
] as const)(
  'communicates %s without inferring another persistence outcome',
  async (status, label) => {
    await render(<SyncStatus status={status} />);
    expect(screen.getByText(label)).toBeOnTheScreen();
    if (status !== 'synced') {
      expect(screen.queryByText('Saved and synced')).toBeNull();
    }
  },
);

it('keeps pending and failed outcomes visible when offline is material', async () => {
  const { rerender } = await render(<SyncStatus status="pending" offline />);
  expect(screen.getByText('Saved locally · Pending sync · Offline')).toBeOnTheScreen();
  await rerender(<SyncStatus status="sync-failed" offline />);
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to sync · Saved locally · Offline');
  await rerender(<SyncStatus status="offline" offline />);
  expect(screen.getByText('Offline')).toBeOnTheScreen();
});

it('keeps synthetic local text pending until confirmation and retains it after rejected sync', async () => {
  let rejectSync: (error: Error) => void = () => {};
  let confirmSync: () => void = () => {};
  const sync = jest
    .fn<Promise<void>, []>()
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSync = reject;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          confirmSync = resolve;
        }),
    );

  function Fixture() {
    const [status, setStatus] = useState<SyncStatusProps['status']>('pending');
    const [text, setText] = useState('Synthetic retained draft');
    const [retrying, setRetrying] = useState(false);
    async function submit() {
      setRetrying(true);
      try {
        await sync();
        setStatus('synced');
      } catch {
        setStatus('sync-failed');
      } finally {
        setRetrying(false);
      }
    }
    return (
      <>
        <TextField label="Fixture draft" value={text} onChangeText={setText} />
        <SyncStatus status={status} />
        <Button onPress={submit} loading={retrying}>
          Sync fixture
        </Button>
      </>
    );
  }

  await render(<Fixture />);
  await userEvent.press(screen.getByRole('button', { name: 'Sync fixture' }));
  expect(screen.getByText('Saved locally · Pending sync')).toBeOnTheScreen();
  expect(screen.queryByText('Saved and synced')).toBeNull();
  await act(() => rejectSync(new Error('Synthetic rejected write')));
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to sync · Saved locally');
  expect(screen.getByDisplayValue('Synthetic retained draft')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Sync fixture' }));
  expect(screen.queryByText('Saved and synced')).toBeNull();
  await act(() => confirmSync());
  expect(screen.getByText('Saved and synced')).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('leaves known references, retained content, and unrelated actions usable during text failure or refresh', async () => {
  const onPrayer = jest.fn();
  function Fixture({ failed }: { failed: boolean }) {
    return (
      <>
        <ThemedText accessibilityRole="header">Fixture day</ThemedText>
        <ThemedText>Known fixture passage reference</ThemedText>
        <TextField label="Fixture intention" defaultValue="Synthetic local text" />
        {failed ? (
          <ErrorState message="Scripture text is unavailable. You can use your own Bible." />
        ) : (
          <LoadingPlaceholder label="Refreshing day…" presentation="refresh" />
        )}
        <Button onPress={onPrayer}>Open prayer</Button>
      </>
    );
  }
  const { rerender } = await render(<Fixture failed={false} />);
  await fireEvent.changeText(screen.getByLabelText('Fixture intention'), 'Edited synthetic text');
  await userEvent.press(screen.getByRole('button', { name: 'Open prayer' }));
  await rerender(<Fixture failed />);
  expect(screen.getByRole('header', { name: 'Fixture day' })).toBeOnTheScreen();
  expect(screen.getByText('Known fixture passage reference')).toBeOnTheScreen();
  expect(screen.getByDisplayValue('Edited synthetic text')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Open prayer' }));
  expect(onPrayer).toHaveBeenCalledTimes(2);
});

it('announces new iOS errors once per message change and keeps normal sync status quiet', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
  const { rerender } = await render(<InlineNotice message="Available local content is shown." />);
  expect(announce).not.toHaveBeenCalled();
  await rerender(<InlineNotice tone="error" message="Could not refresh." />);
  expect(announce).toHaveBeenLastCalledWith('Error: Could not refresh.', { queue: true });
  jest.mocked(useColorScheme).mockReturnValue('dark');
  await rerender(<InlineNotice tone="error" message="Could not refresh." />);
  expect(announce).toHaveBeenCalledTimes(1);
  await rerender(<SyncStatus status="pending" />);
  await rerender(<SyncStatus status="synced" />);
  expect(announce).toHaveBeenCalledTimes(1);
  await rerender(<SyncStatus status="sync-failed" />);
  expect(announce).toHaveBeenLastCalledWith('Failed to sync · Saved locally', { queue: true });
  await rerender(<SyncStatus status="pending" />);
  await rerender(<SyncStatus status="sync-failed" />);
  expect(announce).toHaveBeenCalledTimes(3);
});

it.each(['android', 'web'] as const)(
  'exposes new errors through a polite live region on %s',
  async (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    await render(<ErrorState message="Could not load journey data." onRetry={jest.fn()} />);
    expect(screen.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(announce).not.toHaveBeenCalled();
  },
);

it.each(['light', 'dark'] as const)(
  'uses readable %s theme feedback with uncapped text',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    await render(
      <>
        <InlineNotice tone="error" message="Could not refresh." />
        <SyncStatus status="pending" />
      </>,
    );
    expect(screen.getByRole('alert')).toHaveStyle({ color: Colors[scheme].error });
    const pending = screen.getByText('Saved locally · Pending sync');
    expect(pending).toHaveStyle({ color: Colors[scheme].textSecondary });
    expect(pending.props.allowFontScaling).not.toBe(false);
    expect(pending.props.maxFontSizeMultiplier).toBeUndefined();
    expect(pending.props.numberOfLines).toBeUndefined();
  },
);

it('provides named indeterminate loading without exposing skeleton shapes as content', async () => {
  await render(<LoadingPlaceholder label="Loading journey…" />);
  const loading = screen.getByRole('progressbar', { name: 'Loading journey…' });
  expect(loading).toHaveProp('accessibilityState', { busy: true });
  expect(loading.props.accessibilityValue).toBeUndefined();
  expect(screen.queryByRole('button')).toBeNull();
});

it('requires explanatory empty copy and does not invent an action or journey state', async () => {
  await render(
    <EmptyState
      title="No matching fixture items"
      description="Change the fixture filter to see more items."
    />,
  );
  expect(screen.getByRole('header', { name: 'No matching fixture items' })).toBeOnTheScreen();
  expect(screen.getByText('Change the fixture filter to see more items.')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});
