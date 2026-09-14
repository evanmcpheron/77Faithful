import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	buildInvitationShareMessage,
	InvitePeopleContent,
	InvitePeopleManager,
} from './invite-people.screen';

const mockSetStringAsync = jest.fn();
const mockShare = jest.fn();
const mockAlert = jest.fn();
const mockReplace = jest.fn();
const mockInvitationHook = jest.fn((_args: unknown) => ({
	state: { status: 'Idle' },
	mutation: null,
	mutationMessage: null,
	issue: jest.fn(),
	rotate: jest.fn(),
	revoke: jest.fn(),
	retry: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({
	setStringAsync: (...args: unknown[]) => mockSetStringAsync(...args),
}));
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: { expoConfig: { scheme: 'mobile' } },
}));
jest.mock('expo-secure-store', () => ({
	AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
	isAvailableAsync: jest.fn(),
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('react-native', () => ({
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
	Share: {
		share: (...args: unknown[]) => mockShare(...args),
		dismissedAction: 'dismissedAction',
		sharedAction: 'sharedAction',
	},
	Text: 'NativeText',
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
	useCommunityContext: () => ({
		state: { status: 'Loading' },
		retry: jest.fn(),
	}),
}));
jest.mock('../use-community-invitation.hook', () => ({
	useCommunityInvitation: (args: unknown) => mockInvitationHook(args),
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

const activeInvitation = {
	communityId: 'group',
	invitationId: 'invitation-1',
	code: '23456-789AB-CDEFG-HJKMN',
	expiresAt: { seconds: 1_800_000_000, nanoseconds: 0 },
};
const actions = {
	onGenerate: jest.fn(),
	onRotate: jest.fn(),
	onRevoke: jest.fn(),
	onRetry: jest.fn(),
	onReturn: jest.fn(),
};
let renderer: ReactTestRenderer;
const mountManager = (
	state:
		| { status: 'None' }
		| { status: 'Ready'; invitation: typeof activeInvitation }
		| { status: 'Loading' }
		| { status: 'Unavailable' }
		| { status: 'Error' },
	mutation: 'Issue' | 'Rotate' | 'Revoke' | null = null,
	mutationMessage: string | null = null,
) => {
	act(() => {
		renderer = create(
			createElement(InvitePeopleManager, {
				communityName: 'Grace Church',
				state,
				mutation,
				mutationMessage,
				...actions,
			}),
		);
	});
};
const text = () => JSON.stringify(renderer.toJSON());
const button = (label: string) =>
	renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
const press = async (label: string) => {
	await act(async () => button(label).props['onPress']());
};

beforeEach(() => {
	jest.clearAllMocks();
	mockSetStringAsync.mockResolvedValue(undefined);
	mockShare.mockResolvedValue({ action: 'sharedAction' });
});
afterEach(() => act(() => renderer.unmount()));

it('offers generation only after the read returns no active or unexpired code', async () => {
	mountManager({ status: 'None' });
	expect(text()).toContain('No active invitation');
	expect(text()).toContain('Generate an invitation when you’re ready');
	await press('Generate invitation');
	expect(actions.onGenerate).toHaveBeenCalledTimes(1);
});

it('shows a selectable, accessible active code and trusted expiry', () => {
	mountManager({ status: 'Ready', invitation: activeInvitation });
	const code = renderer.root.findByProps({ testID: 'invitation-code' });
	expect(code.props['selectable']).toBe(true);
	expect(code.props['style']).toEqual(
		expect.objectContaining({ fontSize: 24, lineHeight: 36 }),
	);
	expect(code.props['accessibilityLabel']).toBe(
		'Invitation code 23456-789AB-CDEFG-HJKMN',
	);
	expect(text()).toContain('Expires');
	expect(text()).toContain('Copy code');
	expect(text()).toContain('Share invitation');
});

it('copies the code and reports copy failures without exposing it in errors', async () => {
	mountManager({ status: 'Ready', invitation: activeInvitation });
	await press('Copy code');
	expect(mockSetStringAsync).toHaveBeenCalledWith(activeInvitation.code);
	expect(text()).toContain('Invitation code copied.');

	mockSetStringAsync.mockRejectedValueOnce(new Error('denied'));
	await press('Copy code');
	expect(text()).toContain('We couldn’t copy the invitation code');
	expect(text()).not.toContain(`couldn’t ${activeInvitation.code}`);
});

it('shares manual fallback instructions and treats cancellation as neither failure nor delivery', async () => {
	mountManager({ status: 'Ready', invitation: activeInvitation });
	mockShare.mockResolvedValueOnce({ action: 'dismissedAction' });
	await press('Share invitation');
	expect(mockShare).toHaveBeenCalledWith({
		message: buildInvitationShareMessage({
			communityName: 'Grace Church',
			code: activeInvitation.code,
		}),
	});
	expect(text()).not.toContain('received');
	expect(text()).not.toContain('couldn’t open sharing');
	const message = mockShare.mock.calls[0]?.[0]?.message as string;
	expect(message).toContain('Grace Church');
	expect(message).toContain(activeInvitation.code);
	expect(message).toContain('If the app is not installed yet');
	expect(message).toContain(
		'mobile:///communities/join?invitationCode=23456789ABCDEFGHJKMN',
	);

	mockShare.mockRejectedValueOnce(new Error('share failed'));
	await press('Share invitation');
	expect(text()).toContain('We couldn’t open sharing options');
});

it('confirms replacement and revocation with invalidation and membership copy', () => {
	mountManager({ status: 'Ready', invitation: activeInvitation });
	act(() => button('Replace invitation').props['onPress']());
	expect(mockAlert.mock.calls[0]?.[1]).toContain(
		'Existing members will remain',
	);
	act(() => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(actions.onRotate).toHaveBeenCalledTimes(1);

	act(() => button('Revoke invitation').props['onPress']());
	expect(mockAlert.mock.calls[1]?.[1]).toContain(
		'current code will stop working',
	);
	act(() => mockAlert.mock.calls[1]?.[2]?.[1]?.onPress());
	expect(actions.onRevoke).toHaveBeenCalledTimes(1);
});

it('keeps loading, denied, recoverable error, and retry states explicit', async () => {
	mountManager({ status: 'Loading' });
	expect(text()).toContain('Loading invitation');
	act(() =>
		renderer.update(
			createElement(InvitePeopleManager, {
				communityName: 'Grace Church',
				state: { status: 'Error' },
				mutation: null,
				mutationMessage: null,
				...actions,
			}),
		),
	);
	await press('Try again');
	expect(actions.onRetry).toHaveBeenCalledTimes(1);
});

const communityContext = ({
	role,
	status,
}: {
	role: 'Organizer' | 'Member';
	status: 'Active' | 'Closed';
}): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Anna' },
		status,
	},
	communityRevision: 4,
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
		canManageMembers: false,
		canEditCommunity: false,
		canCloseCommunity: false,
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 2, isExact: true },
});

it('uses server context to deny members and closed communities', () => {
	act(() => {
		renderer = create(
			createElement(InvitePeopleContent, {
				userId: 'member',
				communityId: 'group',
				contextState: {
					status: 'Ready',
					context: communityContext({
						role: 'Member',
						status: 'Active',
					}),
				},
				onContextRetry: jest.fn(),
			}),
		);
	});
	expect(text()).toContain('Only the current organizer');
	expect(mockInvitationHook).toHaveBeenCalledWith(
		expect.objectContaining({ canManage: false }),
	);

	act(() => {
		renderer.update(
			createElement(InvitePeopleContent, {
				userId: 'owner',
				communityId: 'group',
				contextState: {
					status: 'Ready',
					context: communityContext({
						role: 'Organizer',
						status: 'Closed',
					}),
				},
				onContextRetry: jest.fn(),
			}),
		);
	});
	expect(text()).toContain('This community is closed');
});
