import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { CreateCommunityScreen } from './create-community.screen';

const mockCreate = jest.fn();
const mockCreateCommunityOperationId = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
let mockAccountUserId: string | null = 'owner';
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
jest.mock('../create-community.service', () => ({
	createCommunity: (...args: unknown[]) => mockCreate(...args),
	createCommunityOperationId: () => mockCreateCommunityOperationId(),
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
	mockAccountUserId = 'owner';
	mockCreateCommunityOperationId.mockReturnValue('operation-1');
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

it('enforces the name and optional description length limits', async () => {
	act(() => {
		field('community-name').props['onChange']('n'.repeat(101));
		field('community-description').props['onChange']('d'.repeat(2001));
	});
	await act(async () => {
		submit();
	});
	expect(field('community-name').props['errorMessage']).toBe(
		'Use 100 characters or fewer for the community name.',
	);
	expect(field('community-description').props['errorMessage']).toBe(
		'Use 2,000 characters or fewer for the description.',
	);
	expect(mockCreate).not.toHaveBeenCalled();

	act(() => {
		field('community-name').props['onChange']('n'.repeat(100));
		field('community-description').props['onChange']('d'.repeat(2000));
	});
	await act(async () => {
		submit();
	});
	expect(mockCreate).toHaveBeenCalledTimes(1);
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

it('keeps fields editable after a rejected request and uses a new operation for the next submission', async () => {
	mockCreateCommunityOperationId
		.mockReturnValueOnce('operation-1')
		.mockReturnValueOnce('operation-2');
	mockCreate.mockRejectedValueOnce({ code: 'functions/invalid-argument' });
	fillRequiredFields();
	act(() => {
		field('community-description').props['onChange']('Weekly prayer.');
	});
	await act(async () => {
		submit();
	});
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'We couldn’t create this community.',
	);
	expect(field('community-name').props['readOnly']).toBe(false);
	expect(field('community-description').props['value']).toBe(
		'Weekly prayer.',
	);

	act(() => {
		field('community-name').props['onChange']('Grace Neighbors');
	});
	await act(async () => {
		submit();
	});
	expect(mockCreate.mock.calls).toEqual([
		[
			{
				name: 'Grace Church',
				purpose: 'Weekly prayer.',
				settings: {},
				operationId: 'operation-1',
			},
		],
		[
			{
				name: 'Grace Neighbors',
				purpose: 'Weekly prayer.',
				settings: {},
				operationId: 'operation-2',
			},
		],
	]);
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

it('does not redirect after the screen unmounts while creation is pending', async () => {
	let resolve: (value: typeof result) => void = () => undefined;
	mockCreate.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	fillRequiredFields();
	submit();
	act(() => renderer.unmount());
	await act(async () => {
		resolve(result);
	});
	expect(mockReplace).not.toHaveBeenCalled();
});

it('discards a pending result when the signed-in account changes', async () => {
	let resolve: (value: typeof result) => void = () => undefined;
	mockCreate.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	fillRequiredFields();
	submit();
	mockAccountUserId = 'other';
	act(() => renderer.update(createElement(CreateCommunityScreen)));
	await act(async () => {
		resolve(result);
	});
	expect(mockReplace).not.toHaveBeenCalled();
	expect(field('community-name').props['value']).toBe('');
});

it('describes invitation-only privacy without offering a choice', () => {
	const card = renderer.root.findByProps({
		accessibilityLabel:
			'Invitation required. People with a valid invitation can join, so share invitation codes carefully. Members see only content deliberately shared with the community, not private answers.',
	});
	expect(card.props['accessibilityRole']).toBe('text');
	expect(card.props['accessibilityState']).toBeUndefined();
	expect(card.props['onPress']).toBeUndefined();
	expect(
		renderer.root.findAllByProps({ accessibilityRole: 'radio' }),
	).toHaveLength(0);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'Only people you invite can join',
	);
});
