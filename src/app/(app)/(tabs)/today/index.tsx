import { NavigationPlaceholder } from '@/components/navigation-placeholder';

export default function TodayScreen() {
  return (
    <NavigationPlaceholder
      bottomInsetHandled
      title="Today"
      description="Current-day navigation scaffold. Scripture and Reflection will open from here once a journey is available. Prayer and the two chosen practices will stay on this screen."
    />
  );
}
