import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CommunityNotificationSettingsScreen } from './community-notification-settings.screen';

const get = jest.fn();
const set = jest.fn();
const register = jest.fn();
const getPermission = jest.fn();
const openSettings = jest.fn();
const push = jest.fn();
let communityId = 'alpha';
let accountId = 'first';
let communityStatus: 'Active' | 'Closed' = 'Active';
const values = new Map<
	string,
	{
		communityId: string;
		categories: {
			Reply: boolean;
			PrayerSupport: boolean;
			Announcement: boolean;
		};
		pushEnabled: boolean;
	}
>();
const defaultValue = (id: string) => ({
	communityId: id,
	categories: { Reply: false, PrayerSupport: false, Announcement: false },
	pushEnabled: false,
});

jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({ communityId }),
	useRouter: () => ({ push }),
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: accountId } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({
		state: {
			status: 'Ready',
			context: {
				community: { status: communityStatus },
				membership: { status: 'Active' },
			},
		},
		retry: jest.fn(),
	}),
}));
jest.mock('../community-notification.service', () => ({
	getCommunityNotificationPreferences: (...args: unknown[]) => get(...args),
	setCommunityNotificationPreferences: (...args: unknown[]) => set(...args),
	getCommunityNotificationReason: () => null,
	createCommunityNotificationOperationId: () => 'stable-operation',
}));
jest.mock('../community-push.service', () => ({
	getCommunityPushPermission: () => getPermission(),
	registerCommunityPush: (...args: unknown[]) => register(...args),
}));
jest.mock('react-native', () => ({
	View: 'View',
	Linking: { openSettings: () => openSettings() },
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

let tree: ReactTestRenderer;
const mount = async () => {
	await act(async () => {
		tree = create(createElement(CommunityNotificationSettingsScreen));
	});
};
const press = async (testID: string) => {
	await act(async () => {
		tree.root.findByProps({ testID }).props['onPress']();
	});
};
const pressText = async (label: string) => {
	const button = tree.root
		.findAll((item) => String(item.type) === 'Button')
		.find((item) => item.props['children'] === label);
	if (!button) throw new Error(`Missing ${label}`);
	await act(async () => {
		button.props['onPress']();
	});
};
beforeEach(() => {
	jest.clearAllMocks();
	values.clear();
	communityId = 'alpha';
	accountId = 'first';
	communityStatus = 'Active';
	get.mockImplementation(
		async (id: string) => values.get(id) ?? defaultValue(id),
	);
	set.mockImplementation(
		async (input: {
			communityId: string;
			category: 'Reply' | 'PrayerSupport' | 'Announcement';
			categoryEnabled: boolean;
			pushEnabled: boolean;
		}) => {
			const previous =
				values.get(input.communityId) ??
				defaultValue(input.communityId);
			const next = {
				...previous,
				categories: {
					...previous.categories,
					[input.category]: input.categoryEnabled,
				},
				pushEnabled: input.pushEnabled,
			};
			values.set(input.communityId, next);
			return next;
		},
	);
	getPermission.mockResolvedValue('NotRequested');
	register.mockResolvedValue({
		permission: 'NotRequested',
		registered: true,
		deliveryEnabled: false,
		issue: null,
	});
});
afterEach(() => {
	if (tree) act(() => tree.unmount());
});

it('saves each category and community mute on the server while inbox remains reachable', async () => {
	await mount();
	for (const category of ['Reply', 'PrayerSupport', 'Announcement'])
		await press(`notification-category-${category}`);
	await press('community-push-mute');
	expect(values.get('alpha')).toEqual({
		communityId: 'alpha',
		categories: { Reply: true, PrayerSupport: true, Announcement: true },
		pushEnabled: true,
	});
	expect(set).toHaveBeenCalledTimes(4);
	await pressText('Open inbox');
	expect(push).toHaveBeenCalledWith('/settings/notifications');
});

it('retries an uncertain server save with the same request and operation ID', async () => {
	set.mockRejectedValueOnce(new Error('network'));
	await mount();
	await press('notification-category-Reply');
	expect(
		tree.root.findByProps({ testID: 'notification-category-Reply' }).props[
			'disabled'
		],
	).toBe(true);
	await pressText('Retry save');
	expect(set.mock.calls[1][0]).toEqual(set.mock.calls[0][0]);
	expect(values.get('alpha')?.categories.Reply).toBe(true);
});

it('shows OS denial separately and checks again after opening device settings', async () => {
	getPermission
		.mockResolvedValueOnce('Denied')
		.mockResolvedValueOnce('Granted');
	register
		.mockResolvedValueOnce({
			permission: 'Denied',
			registered: true,
			deliveryEnabled: false,
			issue: null,
		})
		.mockResolvedValueOnce({
			permission: 'Granted',
			registered: true,
			deliveryEnabled: false,
			issue: 'Push token not ready.',
		});
	await mount();
	await pressText('Open device settings');
	expect(openSettings).toHaveBeenCalledTimes(1);
	await pressText('Check device permission again');
	expect(register).toHaveBeenCalledWith('first', false);
	expect(
		tree.root
			.findAll((item) => String(item.type) === 'Text')
			.some((item) =>
				String(item.props['children']).includes(
					'Permission is allowed, but push delivery is not ready',
				),
			),
	).toBe(true);
	await press('notification-category-Reply');
	expect(values.get('alpha')?.categories.Reply).toBe(true);
});

it('requests device permission only after Enable notifications is pressed', async () => {
	await mount();
	expect(register).toHaveBeenCalledWith('first', false);
	await pressText('Enable notifications');
	expect(register).toHaveBeenCalledWith('first', true);
});

it('keeps community and account state isolated and disables closed controls', async () => {
	await mount();
	await press('notification-category-Reply');
	communityId = 'beta';
	accountId = 'second';
	await act(async () => {
		tree.update(createElement(CommunityNotificationSettingsScreen));
	});
	expect(get).toHaveBeenCalledWith('beta');
	expect(register).toHaveBeenCalledWith('second', false);
	expect(
		tree.root.findByProps({ testID: 'notification-category-Reply' }).props[
			'children'
		],
	).toBe('Turn on');
	communityStatus = 'Closed';
	await act(async () => {
		tree.update(createElement(CommunityNotificationSettingsScreen));
	});
	expect(
		tree.root.findAllByProps({ testID: 'notification-category-Reply' }),
	).toHaveLength(0);
});
