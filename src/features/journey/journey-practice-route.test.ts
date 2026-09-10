import { getPracticeHref, parsePracticeRoute } from './journey-practice-route';

it.each([
	['ReadScripture', 'scripture'],
	['Pray', 'prayer'],
	['Reflect', 'reflection'],
] as const)('links %s to its own content screen', (practice, screen) => {
	expect(getPracticeHref('journey', 12, practice)).toEqual({
		pathname: `/journeys/[journeyId]/days/[dayNumber]/${screen}`,
		params: { journeyId: 'journey', dayNumber: '12' },
	});
});
it('includes the chosen practice ID in the link', () => {
	expect(getPracticeHref('journey', 1, 'Worship')).toEqual({
		pathname:
			'/journeys/[journeyId]/days/[dayNumber]/practices/[practiceId]',
		params: { journeyId: 'journey', dayNumber: '1', practiceId: 'Worship' },
	});
});
it.each(['0', '78', '-1', '1.5', '1abc', ['1']])(
	'rejects invalid day %s',
	(day) => {
		expect(parsePracticeRoute('journey', day, 'Pray')).toBeNull();
	},
);
it('rejects unknown practices and malformed journey IDs', () => {
	expect(parsePracticeRoute('journey', '1', 'Unknown')).toBeNull();
	expect(parsePracticeRoute('../owner', '1', 'Pray')).toBeNull();
	expect(parsePracticeRoute('journey', '77', 'Gratitude')).toEqual({
		journeyId: 'journey',
		dayNumber: 77,
		practiceId: 'Gratitude',
	});
});
