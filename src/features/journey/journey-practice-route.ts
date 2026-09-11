import { FormationStructure } from '@td/types/formation/formation-course.types';
import {
	FoundationalPracticeId,
	OptionalPracticeId,
	type TPracticeId,
} from '@td/types/formation/practice.types';
import type { Href } from 'expo-router';

export const getPracticeHref = (
	journeyId: string,
	dayNumber: number,
	practiceId: TPracticeId,
): Href => {
	const params = { journeyId, dayNumber: String(dayNumber) };
	switch (practiceId) {
		case FoundationalPracticeId.ReadScripture:
			return {
				pathname: '/journeys/[journeyId]/days/[dayNumber]/scripture',
				params,
			};
		case FoundationalPracticeId.Pray:
			return {
				pathname: '/journeys/[journeyId]/days/[dayNumber]/prayer',
				params,
			};
		case FoundationalPracticeId.Reflect:
			return {
				pathname: '/journeys/[journeyId]/days/[dayNumber]/reflection',
				params,
			};
		default:
			return {
				pathname:
					'/journeys/[journeyId]/days/[dayNumber]/practices/[practiceId]',
				params: { ...params, practiceId },
			};
	}
};

export const parsePracticeRoute = (
	journeyId: unknown,
	dayNumber: unknown,
	practiceId: unknown,
) => {
	if (
		typeof journeyId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(journeyId) ||
		typeof dayNumber !== 'string' ||
		!/^[1-9]\d?$/.test(dayNumber) ||
		Number(dayNumber) > FormationStructure.DayCount
	)
		return null;
	const id = [
		...Object.values(FoundationalPracticeId),
		...Object.values(OptionalPracticeId),
	].find((value) => value === practiceId);
	return id
		? { journeyId, dayNumber: Number(dayNumber), practiceId: id }
		: null;
};
