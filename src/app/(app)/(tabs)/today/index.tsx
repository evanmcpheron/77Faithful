import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { ThemedText } from '@/components/themed-text';

export default function TodayScreen() {
  return (
    <ScreenScrollView bottomInsetHandled>
      <ScreenHeading title="Today" description="Scripture, prayer, and reflection for your day." />
      <EmptyState
        title="Your daily reading is not available yet"
        description="Your journey and assigned passage are not connected in this preview."
      />
      <ScreenSection>
        <ThemedText>
          Prayer and your two chosen practices belong here, alongside your Scripture reading and
          reflection.
        </ThemedText>
        <InlineNotice message="Daily records are not available. No current day, practice progress, or saved intention is shown." />
      </ScreenSection>
    </ScreenScrollView>
  );
}
