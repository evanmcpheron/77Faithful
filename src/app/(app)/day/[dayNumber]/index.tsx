import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';
import { useDayNumber } from '@/navigation/day-number-context';

export default function DayDetailScreen() {
  const dayNumber = useDayNumber();

  return (
    <NavigationPlaceholder
      title={`Day ${dayNumber}`}
      description="Day detail navigation scaffold. The number identifies this route; no journey record or day status has been loaded.">
      <PlaceholderLink
        href={{ pathname: '/day/[dayNumber]/scripture', params: { dayNumber } }}
        push>
        Open Scripture
      </PlaceholderLink>
      <PlaceholderLink
        href={{ pathname: '/day/[dayNumber]/reflection', params: { dayNumber } }}
        push>
        Open Reflection
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
