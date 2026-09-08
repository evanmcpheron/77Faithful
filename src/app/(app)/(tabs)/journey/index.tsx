import { NavigationPlaceholder } from '@/components/navigation-placeholder';

export default function JourneyScreen() {
  return (
    <NavigationPlaceholder
      bottomInsetHandled
      title="Journey"
      description="Journey overview navigation scaffold. Previous-day entries will open day details when journey records are available. Today remains the current-day destination."
    />
  );
}
