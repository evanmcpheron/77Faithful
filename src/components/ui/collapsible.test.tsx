import { render, screen, userEvent } from '@testing-library/react-native';

import { Collapsible } from './collapsible';

import { ThemedText } from '@/components/themed-text';

it('exposes its label and expansion state and toggles the content', async () => {
  const user = userEvent.setup();
  await render(
    <Collapsible title="Reflection prompt">
      <ThemedText>What are you grateful for today?</ThemedText>
    </Collapsible>,
  );

  expect(
    screen.getByRole('button', { name: 'Reflection prompt', expanded: false }),
  ).toBeOnTheScreen();
  expect(screen.queryByText('What are you grateful for today?')).not.toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Reflection prompt' }));

  expect(
    screen.getByRole('button', { name: 'Reflection prompt', expanded: true }),
  ).toBeOnTheScreen();
  expect(screen.getByText('What are you grateful for today?')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Reflection prompt' }));

  expect(
    screen.getByRole('button', { name: 'Reflection prompt', expanded: false }),
  ).toBeOnTheScreen();
  expect(screen.queryByText('What are you grateful for today?')).not.toBeOnTheScreen();
});
