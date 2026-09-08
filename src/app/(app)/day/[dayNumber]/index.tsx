import { Link } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { NavigationRow } from '@/components/navigation-row';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { useDayNumber } from '@/navigation/day-number-context';

export default function DayDetailScreen() {
  const dayNumber = useDayNumber();

  return (
    <ScreenScrollView>
      <ScreenHeading
        title={`Day ${dayNumber}`}
        description="Review this day’s practices and reflection."
      />
      <EmptyState
        title="Day records are not available yet"
        description="The day number identifies this preview route. No journey record, assigned passage, or day status has been loaded."
      />
      <ScreenSection>
        <InlineNotice message="These links preview the reading and reflection screens. They do not open assigned content or record participation." />
        <Link href={{ pathname: '/day/[dayNumber]/scripture', params: { dayNumber } }} push asChild>
          <NavigationRow label="Open Scripture" appearance="card" />
        </Link>
        <Link
          href={{ pathname: '/day/[dayNumber]/reflection', params: { dayNumber } }}
          push
          asChild>
          <NavigationRow label="Open Reflection" />
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
