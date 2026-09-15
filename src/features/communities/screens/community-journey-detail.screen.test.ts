import type { IGetCommunityJourneyEnrollmentResult } from '@td/types/community/community-function.types';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import { journeyDetailStatus } from './community-journey-detail.screen';

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
	listCommunityJourneyHistory: jest.fn(),
}));
jest.mock('../community-journey-detail.service', () => ({
	getOwnCommunityJourneyEnrollment: jest.fn(),
	withdrawOwnCommunityJourneyEnrollment: jest.fn(),
	retryOwnCommunityJourneyActivation: jest.fn(),
	communityJourneyDetailOperationId: jest.fn(),
	communityJourneyDetailReason: jest.fn(),
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
jest.mock('react-native', () => ({
	View: 'View',
	Alert: { alert: jest.fn() },
}));

const schedule: ICommunityJourneyPreview = {
	communityJourneyId: 'schedule',
	communityId: 'group',
	revision: 1,
	course: { courseId: 'course', courseVersionId: 'version' },
	startDate: '2026-10-01' as ICommunityJourneyPreview['startDate'],
	timeZoneId: 'America/New_York',
	status: 'Scheduled',
	canEnroll: true,
	canRevise: false,
};
const stamp = { seconds: 1, nanoseconds: 0 };
const own = (
	lifecycle: NonNullable<
		IGetCommunityJourneyEnrollmentResult['enrollment']
	>['lifecycle'],
): IGetCommunityJourneyEnrollmentResult['enrollment'] => ({
	communityJourneyEnrollmentId: 'schedule',
	communityId: 'group',
	communityJourneyId: 'schedule',
	groupDisplayStartDate: schedule.startDate,
	communityTimeZoneId: schedule.timeZoneId,
	startingTimeZoneId: 'America/Chicago',
	communityCalendarDate: schedule.startDate,
	startingZoneCalendarDate: schedule.startDate,
	personalStartDateBehavior: 'ParticipantCalendarDay1',
	activationEligibility:
		lifecycle.status === 'Enrolled' ? 'Eligible' : lifecycle.status,
	lifecycle,
	enrolledAt: stamp,
});

it.each([
	[null, 'not enrolled'],
	[own({ status: 'Enrolled' }), 'awaiting'],
	[own({ status: 'Withdrawn', withdrawnAt: stamp }), 'withdrew'],
	[
		own({ status: 'Started', journeyId: 'private', startedAt: stamp }),
		'started',
	],
	[
		own({
			status: 'StartBlocked',
			reason: 'ActivePersonalJourney',
			blockedAt: stamp,
		}),
		'cannot replace',
	],
])('shows only current-user status for %s', (enrollment, expected) => {
	const text = journeyDetailStatus(schedule, enrollment);
	expect(text.toLowerCase()).toContain(expected);
	expect(text).not.toContain('practice');
	expect(text).not.toContain('private');
});

it('explains cancellation and completion without ending a personal journey', () => {
	expect(
		journeyDetailStatus({ ...schedule, status: 'Canceled' }, null),
	).toContain('Personal journeys remain available');
	expect(
		journeyDetailStatus({ ...schedule, status: 'Completed' }, null),
	).toContain('continue independently');
});

const mockRouterPush = jest.fn();
const mockSchedule = jest.requireMock(
	'../community-journey-schedule.service',
) as { getCommunityJourneySchedule: jest.Mock };
const mockDetail = jest.requireMock('../community-journey-detail.service') as {
	getOwnCommunityJourneyEnrollment: jest.Mock;
	withdrawOwnCommunityJourneyEnrollment: jest.Mock;
	retryOwnCommunityJourneyActivation: jest.Mock;
	communityJourneyDetailOperationId: jest.Mock;
};

it('loads public schedule and own enrollment without enrolling, then offers a confirmed withdrawal', async () => {
	const React = jest.requireActual('react') as typeof import('react');
	const renderer = jest.requireActual(
		'react-test-renderer',
	) as typeof import('react-test-renderer');
	const expo = jest.requireMock('expo-router') as {
		useFocusEffect: jest.Mock;
		useLocalSearchParams: jest.Mock;
		useRouter: jest.Mock;
	};
	expo.useFocusEffect.mockImplementation(
		(effect: () => void | (() => void)) =>
			React.useEffect(effect, [effect]),
	);
	expo.useLocalSearchParams.mockReturnValue({
		communityId: 'group',
		communityJourneyId: 'schedule',
	});
	expo.useRouter.mockReturnValue({
		push: mockRouterPush,
		replace: jest.fn(),
	});
	(
		jest.requireMock('@td/providers/auth/auth.hook') as {
			useAuth: jest.Mock;
		}
	).useAuth.mockReturnValue({ account: { userId: 'member' } });
	(
		jest.requireMock('@td/providers/journey/journey-access.provider') as {
			useJourneyAccess: jest.Mock;
		}
	).useJourneyAccess.mockReturnValue({ activeJourney: null });
	(
		jest.requireMock('../use-community-context.hook') as {
			useCommunityContext: jest.Mock;
		}
	).useCommunityContext.mockReturnValue({
		state: {
			status: 'Ready',
			context: {
				membership: { userId: 'member' },
				community: { status: 'Active' },
			},
		},
		retry: jest.fn(),
	});
	mockSchedule.getCommunityJourneySchedule.mockResolvedValue({
		communityJourney: schedule,
	});
	mockDetail.getOwnCommunityJourneyEnrollment.mockResolvedValue({
		enrollment: own({ status: 'Enrolled' }),
	});
	mockDetail.withdrawOwnCommunityJourneyEnrollment.mockResolvedValue({
		communityJourneyEnrollmentId: 'schedule',
		withdrawnAt: stamp,
	});
	mockDetail.communityJourneyDetailOperationId.mockReturnValue('operation');
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	const { CommunityJourneyDetailScreen } =
		await import('./community-journey-detail.screen');
	let view!: import('react-test-renderer').ReactTestRenderer;
	await renderer.act(async () => {
		view = renderer.create(
			React.createElement(CommunityJourneyDetailScreen),
		);
	});
	expect(mockSchedule.getCommunityJourneySchedule).toHaveBeenCalledWith(
		'group',
	);
	expect(mockDetail.getOwnCommunityJourneyEnrollment).toHaveBeenCalledWith(
		'group',
		'schedule',
	);
	expect(
		view.root.findAllByProps({ children: 'Withdraw before start' }),
	).toHaveLength(1);
	const button = view.root
		.findAllByProps({ children: 'Withdraw before start' })
		.find((item) => typeof item.props['onPress'] === 'function');
	await renderer.act(async () => {
		button?.props['onPress']();
	});
	const alert = (
		jest.requireMock('react-native') as { Alert: { alert: jest.Mock } }
	).Alert.alert;
	expect(alert).toHaveBeenCalledWith(
		'Withdraw from this schedule?',
		expect.stringContaining('does not end'),
		expect.any(Array),
	);
	await renderer.act(async () => {
		alert.mock.calls.at(-1)?.[2]?.[1]?.onPress();
	});
	expect(
		mockDetail.withdrawOwnCommunityJourneyEnrollment,
	).toHaveBeenCalledWith('group', 'schedule', 'operation');
	mockDetail.withdrawOwnCommunityJourneyEnrollment.mockRejectedValueOnce(
		new Error('offline'),
	);
	await renderer.act(async () => {
		view.root
			.findAllByProps({ children: 'Withdraw before start' })
			.find((item) => typeof item.props['onPress'] === 'function')
			?.props['onPress']();
		alert.mock.calls.at(-1)?.[2]?.[1]?.onPress();
	});
	expect(
		view.root.findAll((item) =>
			String(item.props['children']).includes('could not confirm'),
		).length,
	).toBeGreaterThan(0);
	mockDetail.retryOwnCommunityJourneyActivation.mockRejectedValueOnce(
		new Error('offline'),
	);
	const retry = view.root
		.findAllByProps({ children: 'Retry Day 1 activation' })
		.find((item) => typeof item.props['onPress'] === 'function');
	await renderer.act(async () => {
		retry?.props['onPress']();
	});
	expect(mockDetail.retryOwnCommunityJourneyActivation).toHaveBeenCalledWith(
		'group',
		'schedule',
		'operation',
	);
	expect(
		view.root.findAll((item) =>
			String(item.props['children']).includes('could not confirm'),
		).length,
	).toBeGreaterThan(0);
	await renderer.act(async () => {
		view.unmount();
	});
});
