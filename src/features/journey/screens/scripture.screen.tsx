import { FoundationalPracticeId } from '@td/types/formation/practice.types';
import { JourneyPracticeScreen } from './journey-practice.screen';
export const ScriptureScreen = () => (
	<JourneyPracticeScreen
		foundationalPractice={FoundationalPracticeId.ReadScripture}
	/>
);
