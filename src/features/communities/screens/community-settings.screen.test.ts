import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	CommunitySettingsContent,
	CommunitySettingsView,
} from './community-settings.screen';

const mockAlert = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockUpdate = jest.fn();
const mockClose = jest.fn();
const mockLeave = jest.fn();
const mockReason = jest.fn();
const mockOperationId = jest.fn(() => 'operation-id');
let mockContextState: { status: string; context?: ICommunityContext };

jest.mock('expo-router', () => ({
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('react-native', () => ({
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
	View: 'View',
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: 'owner' } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({ state: mockContextState, retry: mockRetry }),
}));
jest.mock('../community-administration.service', () => ({
	closeCommunity: (...args: unknown[]) => mockClose(...args),
	createCommunityAdministrationOperationId: () => mockOperationId(),
	getCommunityAdministrationReason: (...args: unknown[]) =>
		mockReason(...args),
	leaveCommunity: (...args: unknown[]) => mockLeave(...args),
	updateCommunity: (...args: unknown[]) => mockUpdate(...args),
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
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const context = (
	role: 'Organizer' | 'Member',
	status: 'Active' | 'Closed' = 'Active',
	revision = 7,
): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: 'Pray together.',
		organizer: { userId: 'owner', displayName: 'Anna' },
		participationExpectations: 'Listen with care.',
		status,
	},
	communityRevision: revision,
	membership: {
		communityId: 'group',
		userId: role === 'Organizer' ? 'owner' : 'member',
		displayName: 'Reader',
		role,
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost: status === 'Active',
		canInviteMembers: role === 'Organizer' && status === 'Active',
		canManageMembers: role === 'Organizer' && status === 'Active',
		canEditCommunity: role === 'Organizer' && status === 'Active',
		canCloseCommunity: role === 'Organizer' && status === 'Active',
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 2, isExact: true },
});

let renderer: ReactTestRenderer;
const text = () => JSON.stringify(renderer.toJSON());
const field = (testID: string) => renderer.root.findByProps({ testID });
const buttons = (label: string) =>
	renderer.root.findAll(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
const press = (label: string) =>
	act(() => buttons(label)[0]?.props['onPress']());
const mountContent = async () => {
	await act(async () => {
		renderer = create(
			createElement(CommunitySettingsContent, {
				userId: mockContextState.context?.membership.userId ?? 'owner',
				communityId: 'group',
			}),
		);
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	mockContextState = { status: 'Ready', context: context('Organizer') };
	mockReason.mockReturnValue(null);
	mockUpdate.mockResolvedValue({
		community: {
			...context('Organizer').community,
			name: 'Grace Neighbors',
		},
	});
	mockClose.mockResolvedValue({});
	mockLeave.mockResolvedValue({});
});
afterEach(() => act(() => renderer.unmount()));

it('validates, saves all editable details at the authoritative revision, and refreshes', async () => {
	await mountContent();
	act(() => field('community-settings-name').props['onChange']('   '));
	press('Save changes');
	expect(field('community-settings-name').props['errorMessage']).toBe(
		'Enter a community name.',
	);
	expect(mockUpdate).not.toHaveBeenCalled();
	act(() => {
		field('community-settings-name').props['onChange']('Grace Neighbors');
		field('community-settings-description').props['onChange'](
			'Pray and encourage one another.',
		);
		field('community-settings-expectations').props['onChange'](
			'Be patient and gracious.',
		);
	});
	await act(async () => press('Save changes'));
	expect(mockUpdate).toHaveBeenCalledWith({
		communityId: 'group',
		name: 'Grace Neighbors',
		purpose: 'Pray and encourage one another.',
		settings: { participationExpectations: 'Be patient and gracious.' },
		expectedRevision: 7,
		operationId: 'operation-id',
	});
	expect(mockRetry).toHaveBeenCalledTimes(1);
});

it('cancels local edits without making a request', async () => {
	await mountContent();
	act(() => field('community-settings-name').props['onChange']('Unsaved'));
	press('Cancel changes');
	expect(field('community-settings-name').props['value']).toBe(
		'Grace Church',
	);
	expect(mockUpdate).not.toHaveBeenCalled();
});

it('preserves an uncertain save and retries the identical operation', async () => {
	mockUpdate.mockRejectedValueOnce(new Error('network unavailable'));
	await mountContent();
	act(() =>
		field('community-settings-name').props['onChange']('Grace Neighbors'),
	);
	await act(async () => press('Save changes'));
	expect(text()).toContain(
		'couldn’t confirm whether your changes were saved',
	);
	expect(field('community-settings-name').props['readOnly']).toBe(true);
	await act(async () => press('Retry save'));
	expect(mockUpdate.mock.calls[1]).toEqual(mockUpdate.mock.calls[0]);
});

it('keeps fields editable after a rejected save', async () => {
	mockUpdate.mockRejectedValueOnce({ details: { reason: 'InvalidInput' } });
	mockReason.mockReturnValue('InvalidInput');
	await mountContent();
	act(() =>
		field('community-settings-name').props['onChange']('Grace Neighbors'),
	);
	await act(async () => press('Save changes'));
	expect(text()).toContain('Review them and try again');
	expect(field('community-settings-name').props['value']).toBe(
		'Grace Neighbors',
	);
	expect(field('community-settings-name').props['readOnly']).toBe(false);
});

it('keeps conflicting edits visible and requires an explicit latest-details review', async () => {
	mockUpdate.mockRejectedValueOnce({
		details: { reason: 'RevisionConflict' },
	});
	mockReason.mockReturnValue('RevisionConflict');
	await mountContent();
	act(() => field('community-settings-name').props['onChange']('My edit'));
	await act(async () => press('Save changes'));
	expect(field('community-settings-name').props['value']).toBe('My edit');
	expect(text()).toContain('Your edits were not saved');
	expect(buttons('Save changes')[0]?.props['disabled']).toBe(true);
	expect(buttons('Review latest details')).toHaveLength(1);
	expect(mockRetry).toHaveBeenCalledTimes(1);
});

it('requires explicit closure confirmation and retries an uncertain close request', async () => {
	mockClose.mockRejectedValueOnce(new Error('network unavailable'));
	await mountContent();
	press('Close community');
	expect(mockAlert.mock.calls[0]?.[1]).toContain('read-only archive');
	expect(mockAlert.mock.calls[0]?.[1]).toContain(
		'Personal journeys remain untouched',
	);
	expect(mockClose).not.toHaveBeenCalled();
	act(() => mockAlert.mock.calls[0]?.[2]?.[0]?.onPress?.());
	expect(mockClose).not.toHaveBeenCalled();
	await act(async () => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(text()).toContain(
		'couldn’t confirm whether the community was closed',
	);
	press('Close community');
	await act(async () => mockAlert.mock.calls[1]?.[2]?.[1]?.onPress());
	expect(mockClose.mock.calls[1]).toEqual(mockClose.mock.calls[0]);
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group' },
	});
});

it('shows only readable details and allowed controls to members and archives', () => {
	const actions = {
		onChange: jest.fn(),
		onSave: jest.fn(),
		onCancel: jest.fn(),
		onReviewLatest: jest.fn(),
		onRetry: jest.fn(),
		onMembers: jest.fn(),
		onInvite: jest.fn(),
		onClose: jest.fn(),
		onLeave: jest.fn(),
		onReturn: jest.fn(),
	};
	act(() => {
		renderer = create(
			createElement(CommunitySettingsView, {
				state: {
					status: 'Ready',
					context: context('Member', 'Closed'),
				},
				fields: {
					name: 'Grace Church',
					purpose: 'Pray together.',
					participationExpectations: 'Listen with care.',
				},
				submitted: false,
				dirty: false,
				action: null,
				message: null,
				conflict: false,
				uncertainSave: false,
				...actions,
			}),
		);
	});
	expect(text()).toContain('Read-only archive');
	expect(text()).toContain('cannot be reopened');
	expect(buttons('Leave community')).toHaveLength(1);
	expect(buttons('Invite people')).toHaveLength(0);
	expect(buttons('Close community')).toHaveLength(0);
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Input'),
	).toHaveLength(0);
});

it('opens the real schedule route from community settings', async () => {
	await mountContent();
	act(() => buttons('Schedule community journey')[0]?.props['onPress']());
	expect(mockPush).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]/schedule',
		params: { communityId: 'group' },
	});
});

it('removes organizer editing controls immediately after a role loss', async () => {
	await mountContent();
	act(() => field('community-settings-name').props['onChange']('Unsaved'));
	mockContextState = { status: 'Ready', context: context('Member') };
	await act(async () => {
		renderer.update(
			createElement(CommunitySettingsContent, {
				userId: 'owner',
				communityId: 'group',
			}),
		);
	});
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Input'),
	).toHaveLength(0);
	expect(buttons('Invite people')).toHaveLength(0);
	expect(buttons('Close community')).toHaveLength(0);
});
