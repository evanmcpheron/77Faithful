import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ReportCommunityScreen } from './report-community.screen';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockReport = jest.fn();
let mockUserId: string | null = 'reader';
let mockParams: Record<string, string> = {
	communityId: 'archive',
	targetType: 'Community',
};
let mockContextStatus: 'Ready' | 'Unavailable' = 'Ready';
let renderer: ReactTestRenderer;

const context: ICommunityContext = {
	community: {
		communityId: 'archive',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'organizer', displayName: 'Anna' },
		status: 'Closed',
	},
	communityRevision: 1,
	membership: {
		communityId: 'archive',
		userId: 'reader',
		displayName: 'Jordan',
		role: 'Member',
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost: false,
		canInviteMembers: false,
		canManageMembers: false,
		canEditCommunity: false,
		canCloseCommunity: false,
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 2, isExact: true },
};

jest.mock('expo-router', () => {
	const React = jest.requireActual('react') as typeof import('react');
	return {
		useLocalSearchParams: () => mockParams,
		useRouter: () => ({
			push: mockPush,
			back: mockBack,
			replace: mockReplace,
			canGoBack: () => true,
		}),
		useFocusEffect: (effect: () => void | (() => void)) =>
			React.useEffect(effect, [effect]),
	};
});
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: mockUserId ? { userId: mockUserId } : null }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({
		state:
			mockContextStatus === 'Ready'
				? { status: 'Ready', context }
				: { status: 'Unavailable' },
		retry: mockRetry,
	}),
}));
jest.mock('../community-safety.service', () => ({
	createCommunitySafetyOperationId: () => 'operation-1',
	getCommunitySafetyReason: (error: { details?: { reason?: string } }) =>
		error?.details?.reason ?? null,
	reportCommunityContent: (...args: unknown[]) => mockReport(...args),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'ScrollScreen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'Input',
}));
jest.mock('react-native', () => ({ View: 'View' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const button = (label: string) =>
	renderer.root.findAll(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	)[0];
const screenText = () => JSON.stringify(renderer.toJSON());
const mount = () =>
	act(() => {
		renderer = create(createElement(ReportCommunityScreen));
	});
beforeEach(() => {
	jest.clearAllMocks();
	mockUserId = 'reader';
	mockContextStatus = 'Ready';
	mockParams = { communityId: 'archive', targetType: 'Community' };
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});

it('cancels without submitting and rejects malformed target params', () => {
	mount();
	act(() => button('Cancel')?.props['onPress']());
	expect(mockBack).toHaveBeenCalledTimes(1);
	expect(mockReport).not.toHaveBeenCalled();
	act(() => renderer.unmount());
	mockParams = {
		communityId: 'archive',
		targetType: 'Reply',
		postId: 'post-1',
	};
	mount();
	expect(screenText()).toContain('unavailable');
	expect(button('Submit report')).toBeUndefined();
});

it('preserves the same operation and private words for a retry, then shows only a receipt', async () => {
	mockReport
		.mockRejectedValueOnce(new Error('network'))
		.mockResolvedValueOnce({ reportId: 'report-1', status: 'Submitted' });
	mount();
	act(() => button('Other concern')?.props['onPress']());
	const input = renderer.root.findAll(
		(node) => String(node.type) === 'Input',
	)[0];
	act(() => input?.props['onChange']('Private concern.'));
	await act(async () => {
		await button('Submit report')?.props['onPress']();
	});
	expect(screenText()).toContain('Retry to confirm the same request');
	expect(mockReport.mock.calls[0][0].explanation).toBe('Private concern.');
	await act(async () => {
		await button('Submit report')?.props['onPress']();
	});
	expect(mockReport.mock.calls[1][0].operationId).toBe(
		mockReport.mock.calls[0][0].operationId,
	);
	expect(screenText()).toContain('Report submitted');
	expect(screenText()).toContain('report-1');
	expect(screenText()).not.toContain('Private concern.');
});

it('keeps a stale target exact and prevents account-unavailable submissions', async () => {
	mockParams = {
		communityId: 'archive',
		targetType: 'Post',
		postId: 'post-1',
	};
	mockReport.mockRejectedValue({ details: { reason: 'TargetUnavailable' } });
	mount();
	act(() => button('Other concern')?.props['onPress']());
	await act(async () => {
		await button('Submit report')?.props['onPress']();
	});
	expect(screenText()).toContain('target is no longer available');
	expect(mockReport.mock.calls[0][0].target).toEqual({
		targetType: 'Post',
		postId: 'post-1',
	});
	act(() => renderer.unmount());
	mockUserId = null;
	mount();
	expect(button('Submit report')).toBeUndefined();
});
