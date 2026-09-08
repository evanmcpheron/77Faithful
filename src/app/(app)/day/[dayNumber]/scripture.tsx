import { NavigationPlaceholder } from '@/components/navigation-placeholder';
import { useDayNumber } from '@/navigation/day-number-context';

export default function ScriptureScreen() {
  const dayNumber = useDayNumber();

  return (
    <NavigationPlaceholder
      title={`Day ${dayNumber} · Scripture`}
      description="Scripture is not available for this day yet. The assigned passage, translation, and text will appear here when the reading plan is ready. No practice is marked complete."
    />
  );
}
