import type { IJourneyDayDocument } from '../../types/journey/journey-day.types';

export type TReflectionEntry = Pick<
	IJourneyDayDocument,
	'userId' | 'journeyId' | 'dayNumber' | 'calendarDate' | 'reflection'
>;

export const REFLECTION_PAGE_SIZE = 4;

export interface IReflectionCursor {
	journeyId: TReflectionEntry['journeyId'];
	beforeDayNumber: number;
}

export interface IReflectionPage {
	entries: TReflectionEntry[];
	nextCursor: IReflectionCursor | null;
}

export interface IListReflectionsRequest {
	observedPhoneTimeZoneId: string;
	paginated: true;
	cursor: IReflectionCursor | null;
}
