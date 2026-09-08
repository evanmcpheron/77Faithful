import { render, screen } from '@testing-library/react-native';

import { DayProgress, DayStatus, JourneyProgress, PracticeProgress } from './progress';

import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each([1, 12, 77])(
  'shows Day %s as calendar position without a completion score',
  async (day) => {
    await render(<DayProgress dayNumber={day} />);
    expect(screen.getByText(`Day ${day} of 77`)).toBeOnTheScreen();
    expect(screen.queryByText(/streak|%|complete/i)).toBeNull();
  },
);

it.each([0, 1, 2, 3, 4, 5] as const)('labels %s recorded practices factually', async (count) => {
  await render(<PracticeProgress recordedCount={count} />);
  expect(screen.getByText(`${count} of 5 recorded`)).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
});

it.each([
  [0, 'Not recorded', 'Not recorded'],
  [1, '1 of 5', '1 of 5 recorded'],
  [2, '2 of 5', '2 of 5 recorded'],
  [3, '3 of 5', '3 of 5 recorded'],
  [4, '4 of 5', '4 of 5 recorded'],
  [5, 'Complete', 'Complete, 5 of 5 recorded'],
] as const)(
  'names historical participation with %s practices for screen readers',
  async (count, visible, spoken) => {
    await render(<DayStatus dayNumber={12} state="historical" recordedCount={count} />);
    const status = screen.getByLabelText(`Day 12, ${spoken}`);
    expect(status).toHaveTextContent(visible);
    expect(status).toHaveProp('accessibilityState', { disabled: false });
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  },
);

it.each([
  [0, 'Not recorded', 'Not recorded'],
  [3, '3 of 5', '3 of 5 recorded'],
  [5, 'Complete', 'Complete, 5 of 5 recorded'],
] as const)('retains Today alongside %s recorded practices', async (count, visible, spoken) => {
  await render(<DayStatus dayNumber={13} state="today" recordedCount={count} />);
  expect(screen.getByLabelText(`Day 13, Today, ${spoken}`)).toHaveTextContent(`Today · ${visible}`);
});

it('exposes Upcoming as unavailable text without a navigation or completion control', async () => {
  await render(<DayStatus dayNumber={28} state="upcoming" />);
  const upcoming = screen.getByLabelText('Day 28, Upcoming');
  expect(upcoming).toHaveTextContent('Upcoming');
  expect(upcoming).toHaveProp('accessibilityState', { disabled: true });
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByText(/recorded|of 5|complete/i)).toBeNull();
});

it('updates supplied participation counts after a correction without changing calendar position', async () => {
  const period = { state: 'active', dayNumber: 13 } as const;
  const { rerender } = await render(
    <JourneyProgress
      period={period}
      fullyRecordedDays={0}
      partiallyRecordedDays={1}
      completeDayStreak={0}
    />,
  );
  expect(screen.getByText('0 fully recorded days')).toBeOnTheScreen();
  expect(screen.getByText('1 partially recorded day')).toBeOnTheScreen();
  expect(screen.getByText('Complete-day streak: 0 days')).toBeOnTheScreen();

  await rerender(
    <JourneyProgress
      period={period}
      fullyRecordedDays={1}
      partiallyRecordedDays={0}
      completeDayStreak={1}
    />,
  );
  expect(screen.getByText('Day 13 of 77')).toBeOnTheScreen();
  expect(screen.getByText('1 fully recorded day')).toBeOnTheScreen();
  expect(screen.getByText('0 partially recorded days')).toBeOnTheScreen();
  expect(screen.getByText('Complete-day streak: 1 day')).toBeOnTheScreen();
  expect(screen.queryByText('Complete-day streak: 0 days')).toBeNull();
});

it('distinguishes an ended period from completing every practice', async () => {
  await render(
    <JourneyProgress
      period={{ state: 'ended' }}
      fullyRecordedDays={40}
      partiallyRecordedDays={12}
      completeDayStreak={2}
    />,
  );
  expect(screen.getByText('77-day period ended')).toBeOnTheScreen();
  expect(screen.getByText('40 fully recorded days')).toBeOnTheScreen();
  expect(screen.getByText('12 partially recorded days')).toBeOnTheScreen();
  expect(screen.getByText('Complete-day streak: 2 days')).toBeOnTheScreen();
  expect(screen.queryByText(/Day 78|Day 77 of 77|journey complete/i)).toBeNull();
});

it.each(['light', 'dark'] as const)(
  'keeps %s status readable, calm, and free to scale and wrap',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    await render(
      <>
        <JourneyProgress
          period={{ state: 'active', dayNumber: 77 }}
          fullyRecordedDays={50}
          partiallyRecordedDays={20}
          completeDayStreak={4}
        />
        <PracticeProgress recordedCount={3} />
        <DayStatus dayNumber={12} state="historical" recordedCount={3} />
        <DayStatus dayNumber={77} state="today" recordedCount={5} />
        <DayStatus dayNumber={28} state="upcoming" />
      </>,
    );
    for (const label of [
      'Day 77 of 77',
      '50 fully recorded days',
      '20 partially recorded days',
      'Complete-day streak: 4 days',
      '3 of 5 recorded',
      '3 of 5',
      'Today · Complete',
      'Upcoming',
    ]) {
      const text = screen.getByText(label);
      expect(text.props.allowFontScaling).not.toBe(false);
      expect(text.props.maxFontSizeMultiplier).toBeUndefined();
      expect(text.props.numberOfLines).toBeUndefined();
      expect(text.props.adjustsFontSizeToFit).not.toBe(true);
    }
    for (const label of ['Complete-day streak: 4 days', '3 of 5', 'Upcoming']) {
      expect(screen.getByText(label)).toHaveStyle({
        color: Colors[scheme].textSecondary,
        ...Typography.supporting,
      });
    }
    expect(screen.queryByRole('alert')).toBeNull();
  },
);
