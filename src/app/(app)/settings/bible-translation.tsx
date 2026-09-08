import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function BibleTranslationSettingsScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Bible Translation"
        description="The translation used for current and historical Scripture reading."
      />
      <EmptyState
        title="Translations are not available yet"
        description="An available translation and your saved preference are not connected. No translation change can be saved in this preview."
      />
    </ScreenScrollView>
  );
}
