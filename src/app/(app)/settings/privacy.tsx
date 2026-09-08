import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { ThemedText } from '@/components/themed-text';

export default function PrivacyScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Privacy &amp; Data"
        description="Your personal writing is private by default."
      />
      <ScreenSection>
        <ThemedText>
          Reflections, intentions, prayer content, and journals are private by default. This preview
          does not collect personal writing.
        </ThemedText>
      </ScreenSection>
      <EmptyState
        title="Privacy Policy is not available yet"
        description="The approved Privacy Policy and data controls are not available in this preview."
      />
    </ScreenScrollView>
  );
}
