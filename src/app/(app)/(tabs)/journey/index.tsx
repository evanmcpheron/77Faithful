import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function JourneyScreen() {
  return (
    <ScreenScrollView bottomInsetHandled>
      <ScreenHeading title="Journey" description="Your 77 days, with room to return and reflect." />
      <EmptyState
        title="Journey records are not available yet"
        description="Your days, weekly themes, and participation will appear here when your journey is connected. This preview does not show a current day or progress totals."
      />
    </ScreenScrollView>
  );
}
