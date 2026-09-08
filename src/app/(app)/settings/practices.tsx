import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function PracticeSettingsScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Optional Practices"
        description="Manage the two practices you choose alongside Scripture, Prayer, and Reflection."
      />
      <EmptyState
        title="Practice settings are not available yet"
        description="Your current practices and journey day are not connected. No selections or changes are saved."
      />
    </ScreenScrollView>
  );
}
