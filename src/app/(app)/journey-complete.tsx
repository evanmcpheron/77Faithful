import { BrandWordmark } from '@/components/brand-wordmark';
import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function JourneyCompleteScreen() {
  return (
    <NavigationPlaceholder
      leadingContent={<BrandWordmark />}
      title="Journey Completion"
      description="The end-of-journey review will be implemented here. This preview does not indicate a completed journey.">
      <PlaceholderLink href="/journey" dismissTo>
        Review your journey
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
