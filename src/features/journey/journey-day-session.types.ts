import type { IUserProfileDocument } from '../../types/account/user.types';
import type { IBibleVersionDefinition } from '../../types/formation/bible-version.types';
import type {
	IFormationDayContentDocument,
	IFormationWeekIntroductionDocument,
	IFormationWeekOverviewDocument,
} from '../../types/formation/formation-course.types';
import type { IScriptureAssignmentTextDocument } from '../../types/formation/scripture.types';
import type { ITodayVerses } from '../../types/formation/today-verse.types';
import type {
	IJourneyDayDocument,
	ISetPracticeCompletionRequest,
} from '../../types/journey/journey-day.types';
import type {
	IDailyReflectionTarget,
	ISaveWritingRequest,
} from '../../types/journey/journey-writing.types';

export interface IGetJourneyDayRequest {
	journeyId: string;
	dayNumber: number;
	observedPhoneTimeZoneId: string;
}

export interface IJourneyDaySession {
	todayVerses?: ITodayVerses | null;
	day: IJourneyDayDocument;
	content: IFormationDayContentDocument;
	scripture: IScriptureAssignmentTextDocument | null;
	scriptureReference: string;
	scriptureAvailabilityMessage: string | null;
	translation: IBibleVersionDefinition;
	acknowledgments: readonly string[];
	week: IFormationWeekOverviewDocument & IFormationWeekIntroductionDocument;
	preferredName: IUserProfileDocument['preferredName'];
}

export interface ICompleteJourneyPracticeRequest extends ISetPracticeCompletionRequest {
	observedPhoneTimeZoneId: string;
}

export interface ISaveJourneyReflectionRequest extends ISaveWritingRequest {
	target: IDailyReflectionTarget;
	observedPhoneTimeZoneId: string;
}
