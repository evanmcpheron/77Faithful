import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	ScheduleCommunityJourneyScreen,
	validateScheduleFields,
} from './schedule-community-journey.screen';

const mockAlert = jest.fn();
const mockSchedule = jest.fn();
const mockHistory = jest.fn();
const mockCourse = jest.fn();
const mockConfigure = jest.fn();
const mockCancel = jest.fn();
const mockReason = jest.fn();
let mockContext = {
	status: 'Ready',
	context: {
		community: { communityId: 'group', status: 'Active' },
		membership: { role: 'Organizer' },
	},
};
jest.mock('react-native', () => ({
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
	View: 'View',
}));
jest.mock('expo-router', () => ({
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: 'owner' } }),
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'Input',
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
jest.mock('../community-journey-schedule.service', () => ({
	cancelCommunityJourney: (...args: unknown[]) => mockCancel(...args),
	communityJourneyReason: (...args: unknown[]) => mockReason(...args),
	configureCommunityJourney: (...args: unknown[]) => mockConfigure(...args),
	getCommunityJourneyCourseOption: (...args: unknown[]) =>
		mockCourse(...args),
	getCommunityJourneySchedule: (...args: unknown[]) => mockSchedule(...args),
	listCommunityJourneyHistory: (...args: unknown[]) => mockHistory(...args),
	reviseCommunityJourney: jest.fn(),
	scheduleOperationId: () => 'operation',
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({ state: mockContext, retry: jest.fn() }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const preview = {
	communityJourneyId: 'schedule',
	communityId: 'group',
	revision: 1,
	course: { courseId: 'course', courseVersionId: 'version' },
	startDate: '2099-01-01',
	timeZoneId: 'America/New_York',
	status: 'Scheduled',
	canEnroll: true,
	canRevise: true,
};
let renderer: ReactTestRenderer;
const button = (label: string) =>
	renderer.root.findAll(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	)[0];
const text = () => JSON.stringify(renderer.toJSON());
const mount = async () => {
	await act(async () => {
		renderer = create(createElement(ScheduleCommunityJourneyScreen));
	});
};
beforeEach(() => {
	jest.clearAllMocks();
	mockContext = {
		status: 'Ready',
		context: {
			community: { communityId: 'group', status: 'Active' },
			membership: { role: 'Organizer' },
		},
	};
	mockSchedule.mockResolvedValue({ communityJourney: null });
	mockHistory.mockResolvedValue({ communityJourneys: [], nextCursor: null });
	mockCourse.mockResolvedValue({ course: preview.course });
	mockReason.mockReturnValue(null);
});
it('validates a real future date and IANA zone', () => {
	expect(validateScheduleFields('2026-02-30', 'America/New_York')).toMatch(
		/real date/,
	);
	expect(validateScheduleFields('2099-01-01', '+05:00')).toMatch(/time zone/);
	expect(validateScheduleFields('2099-01-01', 'America/New_York')).toBeNull();
	expect(validateScheduleFields('2020-01-01', 'America/New_York')).toMatch(
		/future/,
	);
});
it('reviews the server course and confirms creation without personal enrollment', async () => {
	mockConfigure.mockResolvedValue({ communityJourney: preview });
	await mount();
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'schedule-start-date' })
			.props['onChange']('2099-01-01');
	});
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'schedule-time-zone' })
			.props['onChange']('America/New_York');
	});
	await act(async () => {
		button('Review schedule')?.props['onPress']();
	});
	expect(text()).toMatch(/Review before saving/);
	await act(async () => {
		await button('Save schedule')?.props['onPress']();
	});
	expect(mockConfigure).toHaveBeenCalledWith({
		communityId: 'group',
		course: preview.course,
		startDate: '2099-01-01',
		timeZoneId: 'America/New_York',
		operationId: 'operation',
	});
	expect(text()).toMatch(/confirmed/);
	expect(mockConfigure.mock.calls[0][0]).not.toHaveProperty('setupDraftId');
});
it('handles no course, frozen schedule, and member denial', async () => {
	mockCourse.mockResolvedValue({ course: null });
	await mount();
	expect(text()).toMatch(/No published course/);
	expect(button('Review schedule')?.props['disabled']).toBe(true);
	await act(async () => {
		renderer.unmount();
	});
	mockCourse.mockResolvedValue({ course: preview.course });
	mockSchedule.mockResolvedValue({
		communityJourney: { ...preview, canRevise: false },
	});
	await mount();
	expect(text()).toMatch(/first enrollment has frozen/);
	expect(button('Edit before enrollment')).toBeUndefined();
	await act(async () => {
		renderer.unmount();
	});
	mockContext = {
		status: 'Ready',
		context: {
			community: { communityId: 'group', status: 'Closed' },
			membership: { role: 'Member' },
		},
	};
	await mount();
	expect(text()).toMatch(/Only an active organizer/);
	expect(button('Save schedule')).toBeUndefined();
});
it('confirms cancellation and preserves personal journeys', async () => {
	mockSchedule.mockResolvedValue({ communityJourney: preview });
	mockCancel.mockResolvedValue({
		communityJourney: {
			...preview,
			status: 'Canceled',
			canRevise: false,
			canEnroll: false,
		},
	});
	await mount();
	await act(async () => {
		button('Cancel scheduled journey')?.props['onPress']();
	});
	expect(mockAlert.mock.calls[0][1]).toMatch(/does not erase or end/);
	await act(async () => {
		await mockAlert.mock.calls[0][2][1].onPress();
	});
	expect(mockCancel).toHaveBeenCalledWith({
		communityId: 'group',
		communityJourneyId: 'schedule',
		expectedRevision: 1,
		operationId: 'operation',
	});
	expect(text()).toMatch(/Personal journeys remain/);
});

it('keeps a revision conflict reviewable without claiming a saved schedule', async () => {
	mockConfigure.mockRejectedValue({
		details: { reason: 'RevisionConflict' },
	});
	mockReason.mockReturnValue('RevisionConflict');
	await mount();
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'schedule-start-date' })
			.props['onChange']('2099-01-01');
	});
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'schedule-time-zone' })
			.props['onChange']('America/New_York');
	});
	await act(async () => {
		button('Review schedule')?.props['onPress']();
	});
	await act(async () => {
		button('Save schedule')?.props['onPress']();
	});
	expect(text()).toMatch(/schedule changed/);
	expect(text()).not.toMatch(/schedule was confirmed/);
	await act(async () => {
		button('Refresh schedule')?.props['onPress']();
	});
});
