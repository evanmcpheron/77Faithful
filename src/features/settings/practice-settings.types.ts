import type {
	ICancelOptionalPracticeReplacementRequest,
	IConfirmOptionalPracticeReplacementRequest,
} from '../../types/journey/journey-function.types';
import type { IJourneyPracticeSelection } from '../../types/journey/practice-change.types';
import type { TCalendarDate } from '../../types/shared/persistence.types';

export interface IPracticeSettingsRequest {
	observedPhoneTimeZoneId: string;
}

export interface IConfirmPracticeSettingsRequest
	extends
		IConfirmOptionalPracticeReplacementRequest,
		IPracticeSettingsRequest {}

export interface ICancelPracticeSettingsRequest
	extends
		ICancelOptionalPracticeReplacementRequest,
		IPracticeSettingsRequest {}

export type TPracticeSettingsResult =
	| { status: 'NoActiveJourney' | 'Completed' | 'NotStarted' }
	| {
			status: 'Ready';
			selection: IJourneyPracticeSelection;
			dayNumber: number;
			calendarDate: TCalendarDate;
			nextDay: { dayNumber: number; calendarDate: TCalendarDate } | null;
	  };
