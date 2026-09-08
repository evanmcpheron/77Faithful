import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { useDayNumber } from '@/navigation/day-number-context';

export default function ReflectionScreen() {
  const dayNumber = useDayNumber();

  return (
    <ScreenScrollView>
      <ScreenHeading
        title={`Day ${dayNumber} · Reflection`}
        description="Space to reflect, with writing always optional."
      />
      <EmptyState
        title="Reflection is not available yet"
        description="The day’s reflection question and your private response are not connected."
      />
      <InlineNotice message="This preview does not collect or save a response, or mark reflection complete." />
    </ScreenScrollView>
  );
}
