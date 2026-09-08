import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function NotificationSettingsScreen() {
  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Notifications"
        description="An optional daily reminder, at a time you choose."
      />
      <EmptyState
        title="Reminder settings are not available yet"
        description="Reminder settings are not connected. This preview does not request permission, choose a time, enable a reminder, or schedule a notification."
      />
    </ScreenScrollView>
  );
}
