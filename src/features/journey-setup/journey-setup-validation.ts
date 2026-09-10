import type { TReminderPreference } from '@td/types/account/device-preferences.types';
import type {
	TJourneySetupChoices,
	TSetupOptionalPracticeSelection,
} from '@td/types/account/journey-setup.types';
import { JourneySetupReadiness } from '@td/types/account/journey-setup.types';
import type { TBibleVersionId } from '@td/types/formation/bible-version.types';
import type { TOptionalPracticeId } from '@td/types/formation/practice.types';
import { OptionalPracticeId } from '@td/types/formation/practice.types';
import type { TLocalClockTime } from '@td/types/shared/persistence.types';

export const isValidReminderTime = (time: string): time is TLocalClockTime =>
	/^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export const getReminderPreference = (
	isEnabled: boolean,
	localTime: string,
): TReminderPreference => {
	if (!isValidReminderTime(localTime)) {
		if (!isEnabled) return { isEnabled: false, localTime: null };
		throw new Error('Choose a valid reminder time.');
	}
	return { isEnabled, localTime };
};

export const getSetupChoices = (
	selectedPractices: readonly TOptionalPracticeId[],
	bibleVersionId: TBibleVersionId | null,
): TJourneySetupChoices => {
	if (
		new Set(selectedPractices).size !== selectedPractices.length ||
		!selectedPractices.every((practiceId) =>
			Object.values(OptionalPracticeId).includes(practiceId),
		)
	) {
		throw new Error(
			'Choose different practices from the available choices.',
		);
	}

	// The length branches below establish that each tuple index exists.
	let optionalPracticeIds: TSetupOptionalPracticeSelection;
	switch (selectedPractices.length) {
		case 0:
			optionalPracticeIds = [];
			break;
		case 1:
			optionalPracticeIds = [selectedPractices[0]!];
			break;
		case 2:
			optionalPracticeIds = [
				selectedPractices[0]!,
				selectedPractices[1]!,
			];
			break;
		case 3:
			optionalPracticeIds = [
				selectedPractices[0]!,
				selectedPractices[1]!,
				selectedPractices[2]!,
			];
			break;
		case 4:
			optionalPracticeIds = [
				selectedPractices[0]!,
				selectedPractices[1]!,
				selectedPractices[2]!,
				selectedPractices[3]!,
			];
			break;
		default:
			throw new Error('Choose up to four Chosen Practices.');
	}

	if (
		optionalPracticeIds.length !== 0 &&
		optionalPracticeIds.length !== 1 &&
		bibleVersionId
	) {
		return {
			readiness: JourneySetupReadiness.ReadyForReview,
			optionalPracticeIds,
			bibleVersionId,
		};
	}
	return {
		readiness: JourneySetupReadiness.Incomplete,
		optionalPracticeIds,
		bibleVersionId,
	};
};
