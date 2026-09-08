import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { ThemedText } from '@/components/themed-text';
import appConfig from '../../../../app.json';

export default function AboutScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="About 77Faithful"
        description="A free 77-day Christian spiritual formation app."
      />
      <ScreenSection>
        <ThemedText>
          Centered on Scripture, prayer, and reflection, with two additional practices you choose.
          Faithfulness over perfection.
        </ThemedText>
        <ThemedText type="supporting" themeColor="textSecondary">
          Preview version {appConfig.expo.version}
        </ThemedText>
      </ScreenSection>
      <EmptyState
        title="Privacy Policy &amp; Terms"
        description="Privacy Policy and Terms of Service are not available in this preview."
      />
    </ScreenScrollView>
  );
}
