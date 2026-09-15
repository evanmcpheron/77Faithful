import type { IJourneySetupDraftDocument } from '@td/types/account/journey-setup.types';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import {
	CommunityJourneyEnrollmentScreen,
	enrollmentBlocker,
} from './community-journey-enrollment.screen';

jest.mock('@td/features/account/device-id.service', () => ({
	getDeviceId: jest.fn().mockResolvedValue('device-1'),
}));
jest.mock('@td/features/journey-setup/journey-setup.service', () => ({
	loadJourneySetup: jest.fn(),
	saveJourneySetupChoicesOnly: jest.fn(),
}));
jest.mock('@td/providers/auth/auth.hook', () => ({ useAuth: jest.fn() }));
jest.mock('@td/providers/journey/journey-access.provider', () => ({
	useJourneyAccess: jest.fn(),
}));
jest.mock('expo-router', () => ({
	useFocusEffect: jest.fn(),
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: jest.fn(),
}));
jest.mock('../community-journey-schedule.service', () => ({
	getCommunityJourneySchedule: jest.fn(),
}));
jest.mock('../community-journey-detail.service', () => ({
	getOwnCommunityJourneyEnrollment: jest.fn(),
	communityJourneyDetailOperationId: jest.fn().mockReturnValue('operation-1'),
	communityJourneyDetailReason: jest.fn().mockReturnValue(null),
}));
jest.mock('../community-journey-enrollment.service', () => ({
	enrollInCommunityJourney: jest.fn(),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'Screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('@td/features/journey-setup/setup-practice-choice.component', () => ({
	SetupPracticeChoice: 'Practice',
}));
jest.mock('@td/features/journey-setup/setup-checkbox-choice.component', () => ({
	SetupCheckboxChoice: 'Checkbox',
}));
jest.mock('react-native', () => ({ View: 'View' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const stamp = { seconds: 1, nanoseconds: 0 };
const schedule: ICommunityJourneyPreview = {
	communityJourneyId: 'schedule-1',
	communityId: 'community-1',
	revision: 3,
	course: { courseId: 'course-1', courseVersionId: 'version-1' },
	startDate: '2026-10-01',
	timeZoneId: 'America/New_York',
	status: 'Scheduled',
	canEnroll: true,
	canRevise: false,
};
const draft: IJourneySetupDraftDocument = {
	schemaVersion: 1,
	userId: 'owner',
	revision: 8,
	currentStep: 'Review',
	choices: {
		readiness: 'ReadyForReview',
		optionalPracticeIds: ['Movement', 'Gratitude'],
		bibleVersionId: 'Web',
	},
	startingMotivation: null,
	createdAt: stamp,
	updatedAt: stamp,
};

it.each([
	[{ ...schedule, status: 'Canceled' as const }, draft, false, 'canceled'],
	[{ ...schedule, canEnroll: false }, draft, false, 'closed'],
	[schedule, draft, true, 'active personal journey'],
	[schedule, null, false, 'Choose your private'],
	[
		schedule,
		{
			...draft,
			choices: {
				readiness: 'Incomplete' as const,
				optionalPracticeIds: ['Movement'] as const,
				bibleVersionId: null,
			},
		},
		false,
		'Complete your private',
	],
])(
	'blocks unavailable enrollment state',
	(preview, setup, active, expected) => {
		expect(enrollmentBlocker(preview, setup, active)).toContain(expected);
	},
);

it('requires explicit consent and returns to detail after real callable confirmation', async () => {
	const React = jest.requireActual('react') as typeof import('react');
	const renderer = jest.requireActual(
		'react-test-renderer',
	) as typeof import('react-test-renderer');
	const expo = jest.requireMock('expo-router') as {
		useFocusEffect: jest.Mock;
		useLocalSearchParams: jest.Mock;
		useRouter: jest.Mock;
	};
	expo.useFocusEffect.mockImplementation((effect: () => void) =>
		React.useEffect(effect, [effect]),
	);
	expo.useLocalSearchParams.mockReturnValue({
		communityId: 'community-1',
		communityJourneyId: 'schedule-1',
	});
	const replace = jest.fn();
	expo.useRouter.mockReturnValue({ replace });
	(
		jest.requireMock('@td/providers/auth/auth.hook') as {
			useAuth: jest.Mock;
		}
	).useAuth.mockReturnValue({ account: { userId: 'owner' } });
	(
		jest.requireMock('@td/providers/journey/journey-access.provider') as {
			useJourneyAccess: jest.Mock;
		}
	).useJourneyAccess.mockReturnValue({
		activeJourney: null,
		hasError: false,
		retry: jest.fn(),
	});
	(
		jest.requireMock('../use-community-context.hook') as {
			useCommunityContext: jest.Mock;
		}
	).useCommunityContext.mockReturnValue({
		state: {
			status: 'Ready',
			context: {
				community: { name: 'Prayer group', status: 'Active' },
				membership: { userId: 'owner', role: 'Member' },
			},
		},
		retry: jest.fn(),
	});
	const setup = jest.requireMock(
		'@td/features/journey-setup/journey-setup.service',
	) as { loadJourneySetup: jest.Mock };
	setup.loadJourneySetup.mockResolvedValue({
		draft,
		devicePreferences: null,
	});
	const schedules = jest.requireMock(
		'../community-journey-schedule.service',
	) as { getCommunityJourneySchedule: jest.Mock };
	schedules.getCommunityJourneySchedule.mockResolvedValue({
		communityJourney: schedule,
	});
	(
		jest.requireMock('../community-journey-detail.service') as {
			getOwnCommunityJourneyEnrollment: jest.Mock;
		}
	).getOwnCommunityJourneyEnrollment.mockResolvedValue({ enrollment: null });
	const enrollment = jest.requireMock(
		'../community-journey-enrollment.service',
	) as { enrollInCommunityJourney: jest.Mock };
	enrollment.enrollInCommunityJourney.mockResolvedValue({
		communityJourneyEnrollmentId: 'schedule-1',
		communityJourney: schedule,
		startingTimeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
	let tree: import('react-test-renderer').ReactTestRenderer;
	await renderer.act(async () => {
		tree = renderer.create(
			React.createElement(CommunityJourneyEnrollmentScreen),
		);
	});
	const buttons = () =>
		tree!.root.findAll((node) => String(node.type) === 'Button');
	const confirm = () =>
		buttons().find((button) =>
			button.children.includes('Confirm enrollment'),
		)!;
	const back = buttons().find((button) =>
		button.children.includes('Back to community journey'),
	)!;
	await renderer.act(async () => {
		back.props['onPress']();
	});
	expect(replace).toHaveBeenCalledWith(
		expect.objectContaining({
			pathname:
				'/communities/[communityId]/journeys/[communityJourneyId]',
		}),
	);
	expect(enrollment.enrollInCommunityJourney).not.toHaveBeenCalled();
	const change = buttons().find((button) =>
		button.children.includes('Change private choices'),
	)!;
	await renderer.act(async () => {
		change.props['onPress']();
	});
	const worship = tree!.root
		.findAll((node) => String(node.type) === 'Practice')
		.find((node) => node.props['practice'].practiceId === 'Worship')!;
	await renderer.act(async () => {
		worship.props['onChange'](true);
	});
	setup.loadJourneySetup.mockResolvedValue({
		draft: {
			...draft,
			revision: 9,
			choices: {
				readiness: 'ReadyForReview',
				optionalPracticeIds: ['Movement', 'Gratitude', 'Worship'],
				bibleVersionId: 'Web',
			},
		},
		devicePreferences: null,
	});
	const saved = jest.requireMock(
		'@td/features/journey-setup/journey-setup.service',
	) as { saveJourneySetupChoicesOnly: jest.Mock };
	saved.saveJourneySetupChoicesOnly.mockResolvedValue(undefined);
	const save = buttons().find((button) =>
		button.children.includes('Save choices and return'),
	)!;
	await renderer.act(async () => {
		await save.props['onPress']();
	});
	expect(saved.saveJourneySetupChoicesOnly).toHaveBeenCalledWith(
		expect.objectContaining({
			userId: 'owner',
			expectedRevision: 8,
			choices: expect.objectContaining({
				optionalPracticeIds: ['Movement', 'Gratitude', 'Worship'],
			}),
		}),
	);
	expect(confirm().props['disabled']).toBe(true);
	expect(enrollment.enrollInCommunityJourney).not.toHaveBeenCalled();
	const consent = tree!.root
		.findAll((node) => String(node.type) === 'Checkbox')
		.find((node) => String(node.props['label']).startsWith('I confirm'))!;
	await renderer.act(async () => {
		consent.props['onChange'](true);
	});
	setup.loadJourneySetup.mockResolvedValueOnce({
		draft: { ...draft, revision: 10 },
		devicePreferences: null,
	});
	await renderer.act(async () => {
		await confirm().props['onPress']();
	});
	expect(enrollment.enrollInCommunityJourney).not.toHaveBeenCalled();
	expect(JSON.stringify(tree!.toJSON())).toContain('private setup changed');
	let reload = buttons().find((button) =>
		button.children.includes('Reload review'),
	)!;
	await renderer.act(async () => {
		await reload.props['onPress']();
	});
	let renewedConsent = tree!.root
		.findAll((node) => String(node.type) === 'Checkbox')
		.find((node) => String(node.props['label']).startsWith('I confirm'))!;
	await renderer.act(async () => {
		renewedConsent.props['onChange'](true);
	});
	schedules.getCommunityJourneySchedule.mockResolvedValueOnce({
		communityJourney: { ...schedule, revision: 4, startDate: '2026-10-02' },
	});
	await renderer.act(async () => {
		await confirm().props['onPress']();
	});
	expect(enrollment.enrollInCommunityJourney).not.toHaveBeenCalled();
	expect(JSON.stringify(tree!.toJSON())).toContain(
		'community schedule changed',
	);
	reload = buttons().find((button) =>
		button.children.includes('Reload review'),
	)!;
	await renderer.act(async () => {
		await reload.props['onPress']();
	});
	renewedConsent = tree!.root
		.findAll((node) => String(node.type) === 'Checkbox')
		.find((node) => String(node.props['label']).startsWith('I confirm'))!;
	await renderer.act(async () => {
		renewedConsent.props['onChange'](true);
	});
	const reasons = jest.requireMock('../community-journey-detail.service') as {
		communityJourneyDetailReason: jest.Mock;
	};
	reasons.communityJourneyDetailReason.mockReturnValueOnce(
		'ContentUnavailable',
	);
	enrollment.enrollInCommunityJourney.mockRejectedValueOnce(
		new Error('content unavailable'),
	);
	await renderer.act(async () => {
		await confirm().props['onPress']();
	});
	expect(JSON.stringify(tree!.toJSON())).toContain(
		'selected Bible text is unavailable',
	);
	reload = buttons().find((button) =>
		button.children.includes('Reload review'),
	)!;
	await renderer.act(async () => {
		await reload.props['onPress']();
	});
	renewedConsent = tree!.root
		.findAll((node) => String(node.type) === 'Checkbox')
		.find((node) => String(node.props['label']).startsWith('I confirm'))!;
	await renderer.act(async () => {
		renewedConsent.props['onChange'](true);
	});
	enrollment.enrollInCommunityJourney.mockRejectedValueOnce(
		new Error('offline'),
	);
	await renderer.act(async () => {
		await confirm().props['onPress']();
	});
	expect(enrollment.enrollInCommunityJourney).toHaveBeenCalledTimes(2);
	reload = buttons().find((button) =>
		button.children.includes('Reload review'),
	)!;
	await renderer.act(async () => {
		await reload.props['onPress']();
	});
	renewedConsent = tree!.root
		.findAll((node) => String(node.type) === 'Checkbox')
		.find((node) => String(node.props['label']).startsWith('I confirm'))!;
	expect(renewedConsent.props['checked']).toBe(false);
	await renderer.act(async () => {
		renewedConsent.props['onChange'](true);
	});
	await renderer.act(async () => {
		await confirm().props['onPress']();
	});
	expect(enrollment.enrollInCommunityJourney).toHaveBeenCalledTimes(3);
	expect(
		enrollment.enrollInCommunityJourney.mock.calls[1][0]['operationId'],
	).toBe(enrollment.enrollInCommunityJourney.mock.calls[2][0]['operationId']);
	expect(enrollment.enrollInCommunityJourney).toHaveBeenCalledWith(
		expect.objectContaining({
			expectedCommunityJourneyRevision: 3,
			expectedSetupRevision: 9,
			consentToScheduledActivation: true,
			operationId: 'operation-1',
		}),
	);
	expect(replace).toHaveBeenCalledWith(
		expect.objectContaining({
			pathname:
				'/communities/[communityId]/journeys/[communityJourneyId]',
		}),
	);
	expect(
		enrollment.enrollInCommunityJourney.mock.calls[0][0],
	).not.toHaveProperty('journeyId');
	(
		jest.requireMock('@td/providers/auth/auth.hook') as {
			useAuth: jest.Mock;
		}
	).useAuth.mockReturnValue({ account: { userId: 'other' } });
	(
		jest.requireMock('../use-community-context.hook') as {
			useCommunityContext: jest.Mock;
		}
	).useCommunityContext.mockReturnValue({
		state: {
			status: 'Ready',
			context: {
				community: { name: 'Prayer group', status: 'Active' },
				membership: { userId: 'other', role: 'Member' },
			},
		},
		retry: jest.fn(),
	});
	setup.loadJourneySetup.mockResolvedValue({
		draft: {
			...draft,
			userId: 'other',
			choices: {
				readiness: 'ReadyForReview',
				optionalPracticeIds: ['Worship', 'Generosity'],
				bibleVersionId: 'Niv',
			},
		},
		devicePreferences: null,
	});
	await renderer.act(async () => {
		tree!.update(React.createElement(CommunityJourneyEnrollmentScreen));
	});
	expect(JSON.stringify(tree!.toJSON())).toContain('Worship');
	expect(JSON.stringify(tree!.toJSON())).not.toContain('Movement, Gratitude');
	await renderer.act(async () => {
		tree!.unmount();
	});
});
