import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { JoinCommunityScreen } from './join-community.screen';

const mockLoadProfile = jest.fn();
const mockPreview = jest.fn();
const mockAccept = jest.fn();
const mockOperationId = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
let mockAccountUserId: string | null = 'member';

jest.mock('expo-router', () => {
	const React = jest.requireActual('react') as typeof import('react');
	return {
		useRouter: () => mockRouter,
		useFocusEffect: (effect: () => void | (() => void)) =>
			React.useEffect(effect, [effect]),
	};
});
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({
		account: mockAccountUserId ? { userId: mockAccountUserId } : null,
	}),
}));
jest.mock('@td/features/account/account-profile.service', () => ({
	loadAccountProfile: (...args: unknown[]) => mockLoadProfile(...args),
}));
jest.mock('../community-invitation.service', () => ({
	previewCommunityInvitation: (...args: unknown[]) => mockPreview(...args),
	acceptCommunityInvitation: (...args: unknown[]) => mockAccept(...args),
	createCommunityInvitationOperationId: () => mockOperationId(),
	getCommunityInvitationReason: (error: unknown) =>
		error && typeof error === 'object' && 'reason' in error
			? error.reason
			: null,
}));
jest.mock('react-native', () => ({
	View: 'View',
	Platform: { select: () => 'serif' },
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
jest.mock('@td/components/ui/loading-state/loading-state.component', () => ({
	LoadingState: 'Loading',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const invitationCode = '23456-789AB-CDEFG-HJKMN';
const normalizedCode = '23456789ABCDEFGHJKMN';
const preview = {
	communityName: 'Grace Church',
	communityPurpose: 'Pray and study Scripture together.',
	organizerDisplayName: 'Anna',
	participationExpectations: 'Listen with care.',
	expiresAt: { seconds: 1_800_000_000, nanoseconds: 0 },
};
const result = {
	outcome: 'Accepted',
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: preview.communityPurpose,
		organizer: { userId: 'owner', displayName: 'Anna' },
		status: 'Active',
	},
	membership: {
		communityId: 'group',
		userId: 'member',
		displayName: 'Reader',
		role: 'Member',
	},
};

let renderer: ReactTestRenderer;
const text = () => JSON.stringify(renderer.toJSON());
const field = (testID: string) => renderer.root.findByProps({ testID });
const button = (label: string) =>
	renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
const press = (label: string) => act(() => button(label).props['onPress']());
const mount = async (initialCode = '') => {
	await act(async () => {
		renderer = create(createElement(JoinCommunityScreen, { initialCode }));
	});
};
const showPreview = async () => {
	act(() =>
		field('community-invitation-code').props['onChange'](invitationCode),
	);
	await act(async () => press('Preview community'));
};

beforeEach(() => {
	jest.clearAllMocks();
	mockAccountUserId = 'member';
	mockLoadProfile.mockResolvedValue({ preferredName: 'Reader', revision: 2 });
	mockPreview.mockResolvedValue(preview);
	mockAccept.mockResolvedValue(result);
	mockOperationId.mockReturnValue('accept-1');
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});

it('normalizes typing and paste, validates locally, and never accepts during preview', async () => {
	await mount();
	act(() =>
		field('community-invitation-code').props['onChange'](
			'23456789abcdefghjkmn',
		),
	);
	expect(field('community-invitation-code').props['value']).toBe(
		invitationCode,
	);
	await act(async () => press('Preview community'));
	expect(mockPreview).toHaveBeenCalledWith({
		invitationCode: normalizedCode,
	});
	expect(mockAccept).not.toHaveBeenCalled();

	press('Use a different code');
	act(() => field('community-invitation-code').props['onChange']('bad code'));
	press('Preview community');
	expect(field('community-invitation-code').props['errorMessage']).toBe(
		'Enter the 20-character invitation code.',
	);
	expect(mockPreview).toHaveBeenCalledTimes(1);
});

it('shows only the safe preview, audience boundary, corrected public name, and optional schedule', async () => {
	mockPreview.mockResolvedValue({
		...preview,
		coordinatedJourney: {
			course: { courseId: 'course-77', courseVersionId: 'v1' },
			startDate: '2026-10-01',
			timeZoneId: 'America/New_York',
			status: 'Scheduled',
			canEnroll: true,
		},
	});
	await mount(invitationCode);
	await act(async () => press('Preview community'));
	expect(text()).toContain('Grace Church');
	expect(text()).toContain('Pray and study Scripture together.');
	expect(text()).toContain('Anna');
	expect(text()).toContain('Listen with care.');
	expect(text()).toContain('current and future members');
	expect(text()).toContain('private reflections');
	expect(text()).toContain('Joining does not share progress');
	expect(text()).toContain('does not enroll you');
	expect(text()).toContain('course-77');
	expect(field('community-display-name').props['value']).toBe('Reader');
	expect(text()).not.toContain('member list');
	expect(text()).not.toContain('posts');
});

it('discards a preview response after the code changes while it is pending', async () => {
	let resolvePreview: (value: typeof preview) => void = () => undefined;
	mockPreview.mockReturnValue(
		new Promise((resolve) => {
			resolvePreview = resolve;
		}),
	);
	await mount();
	act(() =>
		field('community-invitation-code').props['onChange'](invitationCode),
	);
	press('Preview community');
	act(() =>
		field('community-invitation-code').props['onChange'](
			'23456789ABCDEFGHJKMP',
		),
	);
	await act(async () => resolvePreview(preview));
	expect(
		renderer.root.findAllByProps({
			testID: 'community-invitation-preview',
		}),
	).toHaveLength(0);
	expect(field('community-invitation-code').props['value']).toBe(
		'23456-789AB-CDEFG-HJKMP',
	);
});

it.each([
	[
		'InvitationUnavailable',
		'invalid, expired, revoked, or no longer available',
	],
	['RateLimited', 'Too many invitation checks'],
	['EmailVerificationRequired', 'Confirm your email before previewing'],
	[null, 'Check your connection and try again'],
] as const)(
	'handles preview failure %s without exposing a preview',
	async (reason, expected) => {
		mockPreview.mockRejectedValue(
			reason ? { reason } : new Error('offline'),
		);
		await mount(invitationCode);
		await act(async () => press('Preview community'));
		expect(text()).toContain(expected);
		expect(
			renderer.root.findAllByProps({
				testID: 'community-invitation-preview',
			}),
		).toHaveLength(0);
		expect(mockAccept).not.toHaveBeenCalled();
	},
);

it('ignores preview and join double taps', async () => {
	let resolvePreview: (value: typeof preview) => void = () => undefined;
	mockPreview.mockReturnValue(
		new Promise((resolve) => (resolvePreview = resolve)),
	);
	await mount(invitationCode);
	act(() => {
		button('Preview community').props['onPress']();
		button('Preview community').props['onPress']();
	});
	expect(mockPreview).toHaveBeenCalledTimes(1);
	await act(async () => resolvePreview(preview));

	let resolveAccept: (value: typeof result) => void = () => undefined;
	mockAccept.mockReturnValue(
		new Promise((resolve) => (resolveAccept = resolve)),
	);
	act(() => {
		button('Join community').props['onPress']();
		button('Join community').props['onPress']();
	});
	expect(mockAccept).toHaveBeenCalledTimes(1);
	await act(async () => resolveAccept(result));
});

it('joins only on explicit confirmation and replaces the code route with community home', async () => {
	await mount();
	await showPreview();
	act(() =>
		field('community-display-name').props['onChange']('  New Name  '),
	);
	await act(async () => press('Join community'));
	expect(mockAccept).toHaveBeenCalledWith({
		invitationCode: normalizedCode,
		displayName: 'New Name',
		operationId: 'accept-1',
	});
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group' },
	});
});

it('opens the same community when acceptance reports an existing membership', async () => {
	mockAccept.mockResolvedValue({ ...result, outcome: 'AlreadyMember' });
	await mount();
	await showPreview();
	await act(async () => press('Join community'));
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group' },
	});
});

it('preserves the reviewed invitation and one operation ID for an uncertain retry', async () => {
	mockAccept.mockRejectedValueOnce(new Error('offline'));
	await mount();
	await showPreview();
	await act(async () => press('Join community'));
	expect(text()).toContain('couldn’t confirm whether you joined');
	expect(field('community-display-name').props['readOnly']).toBe(true);
	expect(button('Use a different code').props['disabled']).toBe(true);
	await act(async () => press('Join community'));
	expect(mockAccept.mock.calls[1]).toEqual(mockAccept.mock.calls[0]);
	expect(mockOperationId).toHaveBeenCalledTimes(1);
});

it.each([
	[
		'InvitationUnavailable',
		'invalid, expired, revoked, or no longer available',
	],
	['MembershipRemoved', 'membership was removed'],
	['EmailVerificationRequired', 'Confirm your email before joining'],
	['RateLimited', 'Too many join attempts'],
] as const)(
	'handles %s after a successful preview',
	async (reason, expected) => {
		mockAccept.mockRejectedValue({ reason });
		await mount();
		await showPreview();
		await act(async () => press('Join community'));
		expect(text()).toContain(expected);
		if (reason === 'InvitationUnavailable')
			expect(
				renderer.root.findAllByProps({
					testID: 'community-invitation-preview',
				}),
			).toHaveLength(0);
	},
);

it('clears account-bound state and ignores a pending result after an account switch', async () => {
	let resolvePreview: (value: typeof preview) => void = () => undefined;
	mockPreview.mockReturnValue(
		new Promise((resolve) => (resolvePreview = resolve)),
	);
	await mount(invitationCode);
	press('Preview community');
	mockAccountUserId = 'other';
	await act(async () =>
		renderer.update(
			createElement(JoinCommunityScreen, { initialCode: '' }),
		),
	);
	await act(async () => resolvePreview(preview));
	expect(
		renderer.root.findAllByProps({
			testID: 'community-invitation-preview',
		}),
	).toHaveLength(0);
	expect(field('community-invitation-code').props['value']).toBe('');
	expect(mockLoadProfile).toHaveBeenLastCalledWith('other');
});
