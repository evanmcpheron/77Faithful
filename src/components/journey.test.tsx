import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import { JourneyDayRow, type JourneyDayRowProps } from './journey-day-row';
import { JourneyWeekSection } from './journey-week-section';
import { JourneyProgress } from './progress';

import { Colors, ControlSize, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each([
  ['today', 1, '/today'],
  ['today', 77, '/today'],
  ['historical', 12, '/day/12'],
  ['historical', 77, '/day/77'],
] as const)('lets the caller open %s Day %s at %s', async (state, dayNumber, destination) => {
  function Overview() {
    const router = useRouter();
    return (
      <JourneyDayRow
        dayNumber={dayNumber}
        state={state}
        recordedCount={3}
        dateLabel="September 8, 2026"
        onPress={() => {
          if (state === 'today') router.replace('/today');
          else router.push({ pathname: '/day/[dayNumber]', params: { dayNumber } });
        }}
      />
    );
  }
  const navigation = renderRouter(
    {
      journey: Overview,
      today: () => <Text>Today fixture</Text>,
      'day/[dayNumber]': () => <Text>Historical detail fixture</Text>,
    },
    { initialUrl: '/journey' },
  );
  await navigation;
  const row = screen.getByRole('link', {
    name: `Day ${dayNumber}, ${state === 'today' ? 'Today, ' : ''}3 of 5 recorded, September 8, 2026`,
  });
  expect(row).toHaveProp(
    'accessibilityHint',
    state === 'today' ? 'Opens Today' : 'Opens Historical Day Detail',
  );
  await userEvent.press(row);
  expect(navigation.getPathname()).toBe(destination);
});

it('keeps Upcoming passive and excludes content or actions from a richer caller record', async () => {
  const onPress = jest.fn();
  const extraData = {
    onPress,
    href: '/day/28',
    recordedCount: 5,
    scripture: 'Synthetic future Scripture fixture',
    prompt: 'Synthetic future prompt fixture',
    children: <Text>Synthetic future child</Text>,
  };
  await render(
    // @ts-expect-error Upcoming deliberately rejects navigation and participation props.
    <JourneyDayRow {...extraData} dayNumber={28} state="upcoming" dateLabel="October 5, 2026" />,
  );
  const row = screen.getByLabelText('Day 28, Upcoming, October 5, 2026');
  expect(row).toHaveProp('accessibilityState', { disabled: true });
  expect(row.props.href).toBeUndefined();
  await userEvent.press(row);
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(
    screen.queryByText(/Synthetic future|Complete|5 of 5/, { includeHiddenElements: true }),
  ).toBeNull();
  expect(screen.getByText('Upcoming', { includeHiddenElements: true })).toBeOnTheScreen();
});

it.each(['light', 'dark'] as const)(
  'keeps incomplete history readable and navigable in %s mode',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const onPress = jest.fn();
    const { rerender } = await render(
      <JourneyDayRow dayNumber={12} state="historical" recordedCount={0} onPress={onPress} />,
    );
    const row = screen.getByRole('link', { name: 'Day 12, Not recorded' });
    expect(row).toHaveStyle({ minHeight: ControlSize.minTouchTarget });
    await userEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
    await fireEvent(row, 'focus', { nativeEvent: {} });
    expect(row).toHaveStyle({ outlineColor: Colors[scheme].focus, outlineWidth: 2 });
    for (const label of ['Day 12', 'Not recorded']) {
      const text = screen.getByText(label, { includeHiddenElements: true });
      expect(text.props.numberOfLines).toBeUndefined();
      expect(text.props.allowFontScaling).not.toBe(false);
      expect(text.props.maxFontSizeMultiplier).toBeUndefined();
    }
    expect(screen.getByText('Not recorded', { includeHiddenElements: true })).toHaveStyle({
      color: Colors[scheme].textSecondary,
    });
    await rerender(
      <JourneyDayRow dayNumber={12} state="historical" recordedCount={5} onPress={onPress} />,
    );
    expect(
      screen.getByRole('link', { name: 'Day 12, Complete, 5 of 5 recorded' }),
    ).toBeOnTheScreen();
  },
);

it('composes all eleven weeks and updates Day 77 from Today to history when the period ends', async () => {
  const onPress = jest.fn();
  function Overview({ ended }: { ended: boolean }) {
    return (
      <View>
        <JourneyProgress
          period={ended ? { state: 'ended' } : { state: 'active', dayNumber: 77 }}
          fullyRecordedDays={40}
          partiallyRecordedDays={12}
          completeDayStreak={0}
        />
        {Array.from({ length: 11 }, (_, week) => (
          <JourneyWeekSection
            key={week}
            weekNumber={week + 1}
            theme={`Synthetic theme ${week + 1}`}
            days={Array.from({ length: 7 }, (_, index): JourneyDayRowProps => {
              const dayNumber = week * 7 + index + 1;
              return {
                dayNumber,
                state: !ended && dayNumber === 77 ? 'today' : 'historical',
                recordedCount: 0,
                onPress,
              };
            })}
          />
        ))}
      </View>
    );
  }
  const { rerender } = await render(<Overview ended={false} />);
  expect(screen.getAllByRole('header')).toHaveLength(11);
  expect(screen.getByRole('header', { name: 'Week 11 · Synthetic theme 11' })).toBeOnTheScreen();
  const rows = screen.getAllByRole('link');
  expect(rows).toHaveLength(77);
  rows.forEach((row, index) => {
    expect(row.props.accessibilityLabel).toMatch(new RegExp(`^Day ${index + 1},`));
  });
  expect(screen.getByRole('link', { name: 'Day 77, Today, Not recorded' })).toBeOnTheScreen();
  await rerender(<Overview ended />);
  expect(screen.getByText('77-day period ended')).toBeOnTheScreen();
  expect(screen.getByText('40 fully recorded days')).toBeOnTheScreen();
  expect(screen.getByText('12 partially recorded days')).toBeOnTheScreen();
  expect(screen.getByText('Complete-day streak: 0 days')).toHaveStyle(Typography.supporting);
  expect(screen.queryByText(/Day 78|Day 77 of 77|journey complete/i)).toBeNull();
  expect(screen.getAllByRole('link')).toHaveLength(77);
  await userEvent.press(screen.getByRole('link', { name: 'Day 77, Not recorded' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('shows a new week with its current day and six upcoming rows without an empty-history screen', async () => {
  await render(
    <JourneyWeekSection
      weekNumber={1}
      theme="Synthetic first weekly theme with a long heading that must wrap"
      days={Array.from({ length: 7 }, (_, index): JourneyDayRowProps =>
        index === 0
          ? { dayNumber: 1, state: 'today', recordedCount: 0, onPress: jest.fn() }
          : { dayNumber: index + 1, state: 'upcoming' },
      )}
    />,
  );
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getAllByLabelText(/^Day \d+, Upcoming$/)).toHaveLength(6);
  expect(screen.getByRole('header').props.numberOfLines).toBeUndefined();
  expect(screen.queryByText(/No history|Scripture|prompt/i)).toBeNull();
});
