import { NavigationPlaceholder } from '@/components/navigation-placeholder';
import { useDayNumber } from '@/navigation/day-number-context';

export default function ReflectionScreen() {
  const dayNumber = useDayNumber();

  return (
    <NavigationPlaceholder
      title={`Day ${dayNumber} · Reflection`}
      description="Focused reflection navigation scaffold. A private reflection experience will be implemented here. No response is collected, saved, or marked complete."
    />
  );
}
