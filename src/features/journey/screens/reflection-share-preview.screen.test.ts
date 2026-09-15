import {
	createCommunityPost,
	createCommunityPostOperationId,
	getCommunityPostReason,
} from '@td/features/communities/community-post.service';
import {
	getCommunityContext,
	listCommunities,
} from '@td/features/communities/community-reader.service';
import { useAuth } from '@td/providers/auth/auth.hook';
import { createElement } from 'react';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import { ReflectionSharePreviewScreen } from './reflection-share-preview.screen';
import { ReflectionInput } from './reflection.styles';

const push = jest.fn();
const close = jest.fn();
jest.mock('@td/providers/auth/auth.hook', () => ({ useAuth: jest.fn() }));
jest.mock('@td/features/communities/community-reader.service', () => ({
	getCommunityContext: jest.fn(),
	listCommunities: jest.fn(),
}));
jest.mock('@td/features/communities/community-post.service', () => ({
	createCommunityPost: jest.fn(),
	createCommunityPostOperationId: jest.fn(() => 'operation-1'),
	getCommunityPostReason: jest.fn(
		(error: { reason?: string }) => error?.reason ?? null,
	),
}));
jest.mock('expo-router', () => ({
	useRouter: () => ({ push }),
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual('react');
		useEffect(callback, [callback]);
	},
}));
jest.mock('react-native', () => ({
	ScrollView: 'scroll',
	View: 'view',
	useWindowDimensions: () => ({ height: 800 }),
}));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@td/components/layout/modal/modal.component', () => ({
	Modal: 'modal',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
jest.mock('./reflection.styles', () => ({ ReflectionInput: 'input' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const groups = [
	{
		communityId: 'one',
		name: 'First',
		status: 'Active',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Owner' },
	},
	{
		communityId: 'two',
		name: 'Second',
		status: 'Active',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Owner' },
	},
] as const;
let renderer: ReactTestRenderer;
const textOf = (node: ReactTestInstance): string =>
	node.children
		.map((child) => (typeof child === 'string' ? child : textOf(child)))
		.join('');
const button = (label: string) =>
	renderer.root.find(
		(node) => node.type === 'button' && textOf(node) === label,
	);
const press = async (label: string) => {
	await act(async () => button(label).props['onPress']());
};
const render = async () => {
	await act(async () => {
		renderer = create(
			createElement(ReflectionSharePreviewScreen, {
				userId: 'owner',
				initialText: 'Private words',
				onClose: close,
			}),
		);
	});
};
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(createCommunityPostOperationId).mockReturnValue('operation-1');
	jest.mocked(getCommunityPostReason).mockImplementation((error) =>
		(error as { reason?: string })?.reason === 'InvalidInput'
			? 'InvalidInput'
			: null,
	);
	jest.mocked(useAuth).mockReturnValue({
		account: { userId: 'owner' },
	} as ReturnType<typeof useAuth>);
	jest.mocked(listCommunities).mockResolvedValue([...groups]);
	jest.mocked(getCommunityContext).mockImplementation(
		async (id) =>
			({
				community: groups.find((group) => group.communityId === id),
				capabilities: { canCreatePost: true },
			}) as Awaited<ReturnType<typeof getCommunityContext>>,
	);
	jest.mocked(createCommunityPost).mockImplementation(async (request) => ({
		communityId: request.communityId,
		postId: 'post',
		revision: 0,
		createdAt: { seconds: 1, nanoseconds: 0 },
	}));
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});
it('requires a selected named audience and sends only edited copy to exactly one group', async () => {
	await render();
	expect(button('Share copy').props['disabled']).toBe(true);
	await press('First');
	expect(button('Share copy').props['disabled']).toBe(true);
	await act(async () =>
		renderer.root
			.findByType(ReflectionInput)
			.props['onChangeText']('Edited copy'),
	);
	await press('Confirm audience: First');
	await press('Share copy');
	expect(createCommunityPost).toHaveBeenCalledWith({
		communityId: 'one',
		content: { postType: 'SharedReflectionCopy', text: 'Edited copy' },
		operationId: 'operation-1',
	});
	expect(push).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]/posts/[postId]',
		params: { communityId: 'one', postId: 'post' },
	});
});
it('makes changing the audience require confirmation again and cancels without posting', async () => {
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Second');
	expect(button('Share copy').props['disabled']).toBe(true);
	await press('Cancel');
	expect(close).toHaveBeenCalledTimes(1);
	expect(createCommunityPost).not.toHaveBeenCalled();
});
it('shows Create and Join when there are no communities', async () => {
	jest.mocked(listCommunities).mockResolvedValue([]);
	await render();
	expect(textOf(renderer.root)).toContain('no active communities');
	expect(button('Share copy').props['disabled']).toBe(true);
	expect(button('Create community')).toBeDefined();
	expect(button('Join community')).toBeDefined();
});
it('retries an uncertain response with the identical operation and payload', async () => {
	jest.mocked(createCommunityPost).mockRejectedValueOnce(
		new Error('network'),
	);
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Share copy');
	expect(textOf(renderer.root)).toContain('couldn’t confirm');
	await press('Retry same share');
	expect(createCommunityPost).toHaveBeenCalledTimes(2);
	expect(jest.mocked(createCommunityPost).mock.calls[0]?.[0]).toEqual(
		jest.mocked(createCommunityPost).mock.calls[1]?.[0],
	);
});
it('keeps a rejected copy editable without changing the private reflection', async () => {
	jest.mocked(createCommunityPost).mockRejectedValueOnce({
		reason: 'InvalidInput',
	});
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Share copy');
	expect(textOf(renderer.root)).toContain('couldn’t share');
	expect(renderer.root.findByType(ReflectionInput).props['editable']).toBe(
		true,
	);
	expect(close).not.toHaveBeenCalled();
	expect(push).not.toHaveBeenCalled();
});
it('blocks sharing when membership is removed during preview', async () => {
	jest.mocked(getCommunityContext).mockResolvedValueOnce({
		community: groups[0],
		capabilities: { canCreatePost: false },
	} as Awaited<ReturnType<typeof getCommunityContext>>);
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Share copy');
	expect(createCommunityPost).not.toHaveBeenCalled();
	expect(textOf(renderer.root)).toContain('access changed');
});
it('blocks sharing when the selected community closes during preview', async () => {
	jest.mocked(getCommunityContext).mockResolvedValueOnce({
		community: { ...groups[0], status: 'Closed' },
		capabilities: { canCreatePost: false },
	} as Awaited<ReturnType<typeof getCommunityContext>>);
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Share copy');
	expect(createCommunityPost).not.toHaveBeenCalled();
	expect(button('Share copy').props['disabled']).toBe(true);
});
it('does not submit when the account changes during preview', async () => {
	await render();
	await press('First');
	await press('Confirm audience: First');
	jest.mocked(useAuth).mockReturnValue({
		account: { userId: 'other' },
	} as ReturnType<typeof useAuth>);
	await act(async () =>
		renderer.update(
			createElement(ReflectionSharePreviewScreen, {
				userId: 'owner',
				initialText: 'Private words',
				onClose: close,
			}),
		),
	);
	expect(button('Share copy').props['disabled']).toBe(true);
	expect(createCommunityPost).not.toHaveBeenCalled();
});
it('does not carry a previous audience into another intentional share', async () => {
	await render();
	await press('First');
	await press('Confirm audience: First');
	await press('Share copy');
	await act(async () => renderer.unmount());
	jest.mocked(createCommunityPostOperationId).mockReturnValue('operation-2');
	await render();
	expect(button('Share copy').props['disabled']).toBe(true);
	await press('Second');
	await press('Confirm audience: Second');
	await press('Share copy');
	expect(
		jest
			.mocked(createCommunityPost)
			.mock.calls.map(([request]) => request.communityId),
	).toEqual(['one', 'two']);
	expect(
		jest
			.mocked(createCommunityPost)
			.mock.calls.map(([request]) => request.operationId),
	).toEqual(['operation-1', 'operation-2']);
});
