import {
	parsePracticeSelection,
	parsePracticeSettings,
} from './practice-settings.service';
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));
const selection = {
	journeyId: 'current',
	currentOptionalPracticeIds: ['Movement', 'Gratitude'],
	scheduleRevision: 0,
	pendingChange: null,
};
const ready = {
	status: 'Ready',
	selection,
	dayNumber: 1,
	calendarDate: '2026-09-11',
	nextDay: { dayNumber: 2, calendarDate: '2026-09-12' },
};
it('accepts a complete server selection and exact next-day review', () =>
	expect(parsePracticeSettings(ready)).toEqual(ready));
it.each([
	{ currentOptionalPracticeIds: ['Movement'] },
	{ currentOptionalPracticeIds: ['Movement', 'Movement'] },
	{ currentOptionalPracticeIds: ['ReadScripture', 'Worship'] },
	{ currentOptionalPracticeIds: ['Unknown', 'Worship'] },
	{
		currentOptionalPracticeIds: [
			'Movement',
			'Gratitude',
			'Generosity',
			'Worship',
			'ChristianReading',
		],
	},
	{ scheduleRevision: -1 },
	{
		pendingChange: {
			practiceChangeId: 'x',
			optionalPracticeIds: ['Movement', 'Worship'],
			effectiveDayNumber: 78,
			effectiveDate: '2026-11-28',
		},
	},
])('rejects an invalid server selection %p', (patch) =>
	expect(() => parsePracticeSelection({ ...selection, ...patch })).toThrow(),
);
it.each([
	{ nextDay: { dayNumber: 3, calendarDate: '2026-09-13' } },
	{ nextDay: { dayNumber: 2, calendarDate: '2026-09-13' } },
	{ calendarDate: '2026-02-30' },
	{ status: 'Unexpected' },
])('rejects an inconsistent calendar review %p', (patch) =>
	expect(() => parsePracticeSettings({ ...ready, ...patch })).toThrow(),
);
