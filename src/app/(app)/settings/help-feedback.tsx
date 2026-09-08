import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function HelpFeedbackScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Help / Feedback"
        description="Get help or share feedback about 77Faithful."
      />
      <EmptyState
        title="Support is not available yet"
        description="A support destination has not been configured. No feedback or diagnostics are sent from this preview."
      />
    </ScreenScrollView>
  );
}
