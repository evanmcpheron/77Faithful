import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { CreateCommunityScreen } from './create-community.screen';

const mockCreate = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: 'owner' } }),
}));
jest.mock('../create-community.service', () => ({
	createCommunity: (...args: unknown[]) => mockCreate(...args),
	createCommunityOperationId: () => 'operation-1',
}));
const result = {
	community: {
		communityId: 'created',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Anna' },
		status: 'Active',
	},
};
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
jest.mock('@td/components/ui/card/card.styles', () => ({ StyledCard: 'Card' }));
jest.mock('@td/components/ui/icon/icon.component', () => ({ AppIcon: 'Icon' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
beforeEach(() => {
	jest.clearAllMocks();
	mockCreate.mockResolvedValue(result);
	act(() => {
		renderer = create(createElement(CreateCommunityScreen));
	});
});
afterEach(() => {
	act(() => renderer.unmount());
});
const submit = () =>
	act(() =>
		renderer.root
			.find((node) => String(node.type) === 'Button')
			.props['onPress'](),
	);
const field = (testID: string) => renderer.root.findByProps({ testID });

it('rejects a whitespace-only name and preserves the optional description', () => {
	act(() => {
		field('community-name').props['onChange']('   ');
		field('community-description').props['onChange']('Pray together.');
	});
	submit();
	expect(field('community-name').props['errorMessage']).toBe(
		'Enter a community name.',
	);
	expect(field('community-description').props['value']).toBe(
		'Pray together.',
	);
});

const fillRequiredFields = () =>
	act(() => {
		field('community-name').props['onChange']('Grace Church');
	});

it('does not ask for a separate community name for the organizer', () => {
	expect(
		renderer.root.findAllByProps({ testID: 'community-organizer-name' }),
	).toHaveLength(0);
});

it('creates with an empty description and opens the confirmed community', async () => {
	fillRequiredFields();
	await act(async () => {
		submit();
	});
	expect(mockCreate).toHaveBeenCalledWith({
		name: 'Grace Church',
		purpose: '',
		settings: {},
		operationId: 'operation-1',
	});
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'created' },
	});
});

it('preserves the request after an uncertain failure and retries the same operation', async () => {
	mockCreate.mockRejectedValueOnce(new Error('Network unavailable'));
	fillRequiredFields();
	await act(async () => {
		submit();
	});
	expect(mockReplace).not.toHaveBeenCalled();
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'Try again to confirm the same request.',
	);
	expect(field('community-name').props['readOnly']).toBe(true);
	await act(async () => {
		submit();
	});
	expect(mockCreate.mock.calls[1]).toEqual(mockCreate.mock.calls[0]);
	expect(mockReplace).toHaveBeenCalledTimes(1);
});

it('ignores a repeated press while creation is pending', async () => {
	let resolve: (value: typeof result) => void = () => undefined;
	mockCreate.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	fillRequiredFields();
	act(() => {
		submit();
		submit();
	});
	expect(mockCreate).toHaveBeenCalledTimes(1);
	await act(async () => {
		resolve(result);
	});
});

it('describes invitation-only privacy without offering a choice', () => {
	const card = renderer.root.findByProps({
		accessibilityLabel: 'Invite only. Only people you invite can join.',
	});
	expect(card.props['accessibilityRole']).toBe('text');
	expect(card.props['accessibilityState']).toBeUndefined();
	expect(card.props['onPress']).toBeUndefined();
	expect(
		renderer.root.findAllByProps({ accessibilityRole: 'radio' }),
	).toHaveLength(0);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'Anyone with a link',
	);
});
