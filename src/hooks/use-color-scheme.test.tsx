import { act, renderHook } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { useColorScheme } from './use-color-scheme.web';

it('reads system appearance changes and unsubscribes on unmount', async () => {
  const getColorScheme = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
  const remove = jest.fn();
  const addChangeListener = jest.spyOn(Appearance, 'addChangeListener').mockReturnValue({ remove });

  const { result, unmount } = await renderHook(useColorScheme);

  expect(result.current).toBe('dark');

  await act(() => {
    getColorScheme.mockReturnValue('light');
    addChangeListener.mock.calls[0][0]({ colorScheme: 'light' });
  });

  expect(result.current).toBe('light');

  await unmount();

  expect(remove).toHaveBeenCalledTimes(1);
});
