import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { useDayNumber } from '@/navigation/day-number-context';

export default function ScriptureScreen() {
  const dayNumber = useDayNumber();

  return (
    <ScreenScrollView>
      <ScreenHeading
        title={`Day ${dayNumber} · Scripture`}
        description="Read the day’s assigned passage."
      />
      <EmptyState
        title="Scripture is not available for this day yet"
        description="The assigned passage, translation, and text will appear here when the reading plan and your journey are connected."
      />
      <InlineNotice message="No assigned reference or practice record is available. Reading and completion cannot be recorded in this preview." />
    </ScreenScrollView>
  );
}
