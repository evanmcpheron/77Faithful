import { isReflectionEntry } from './reflections.service';
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({}));
const entry = {
	userId: 'owner',
	journeyId: 'journey',
	dayNumber: 1,
	calendarDate: '2026-09-01',
	reflection: {
		revisionId: 'saved',
		text: 'Private writing',
		updatedAt: { seconds: 1, nanoseconds: 0 },
	},
};
it('accepts a valid reflection for the signed-in owner', () => {
	expect(isReflectionEntry(entry, 'owner')).toBe(true);
});
it('rejects another account’s reflection', () => {
	expect(isReflectionEntry(entry, 'other')).toBe(false);
});
it.each(['2026-99-01', '2026-02-30', 'invalid'])(
	'rejects malformed calendar date %s without throwing',
	(calendarDate) => {
		expect(isReflectionEntry({ ...entry, calendarDate }, 'owner')).toBe(
			false,
		);
	},
);
it.each([0, 78, 1.5])('rejects invalid journey day %s', (dayNumber) => {
	expect(isReflectionEntry({ ...entry, dayNumber }, 'owner')).toBe(false);
});
it.each([
	null,
	{ ...entry.reflection, text: null },
	{ ...entry.reflection, text: '  ' },
])('rejects absent or deleted writing', (reflection) => {
	expect(isReflectionEntry({ ...entry, reflection }, 'owner')).toBe(false);
});
