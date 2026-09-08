import { Link } from 'expo-router';

import { BrandWordmark } from '@/components/brand-wordmark';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';

export default function JourneyCompleteScreen() {
  return (
    <ScreenScrollView>
      <ScreenSection>
        <BrandWordmark />
        <ScreenHeading
          title="Journey Completion"
          description="A place to look back over the 77-day period."
        />
      </ScreenSection>
      <EmptyState
        title="Journey review is not available yet"
        description="Journey dates and participation are not connected. This preview does not indicate that your journey has ended or that practices are complete."
      />
      <ScreenSection>
        <Link href="/journey" dismissTo asChild>
          <Button>Review your journey</Button>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
