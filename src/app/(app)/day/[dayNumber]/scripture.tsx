import { NavigationPlaceholder } from '@/components/navigation-placeholder';
import { useDayNumber } from '@/navigation/day-number-context';

export default function ScriptureScreen() {
  const dayNumber = useDayNumber();

  return (
    <NavigationPlaceholder
      title={`Day ${dayNumber} · Scripture`}
      description="Focused Scripture navigation scaffold. The assigned passage and translation will appear here when content is connected. No Scripture is loaded or marked complete."
    />
  );
}
