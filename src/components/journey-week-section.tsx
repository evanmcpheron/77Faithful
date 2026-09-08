import { Fragment } from 'react';
import { View } from 'react-native';

import { JourneyDayRow, type JourneyDayRowProps } from './journey-day-row';
import { ScreenSection } from './screen-section';
import { Separator } from './separator';

export type JourneyWeekSectionProps = {
  weekNumber: number;
  theme: string;
  // Supply this week's seven days in order from the journey's pinned content version.
  days: readonly JourneyDayRowProps[];
};

export function JourneyWeekSection({ weekNumber, theme, days }: JourneyWeekSectionProps) {
  return (
    <ScreenSection title={`Week ${weekNumber} · ${theme}`}>
      <View>
        {days.map((day, index) => (
          <Fragment key={day.dayNumber}>
            {index > 0 ? <Separator /> : null}
            <JourneyDayRow {...day} />
          </Fragment>
        ))}
      </View>
    </ScreenSection>
  );
}
