import { TurndownButton } from '@td/components/ui/button/button.component';
import { useAccountProfile } from '@td/features/account/use-account-profile.hook';
import { useAuth } from '@td/providers/auth/auth.hook';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AccountScreen } from './account.screen';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('@td/features/account/use-account-profile.hook');
jest.mock('react-native', () => ({ View: 'view' }));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'input',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const signOut = jest.fn();
const sendPasswordResetEmail = jest.fn();
let renderer: ReactTestRenderer;
const button = (label: string) =>
	renderer.root
		.findAllByType(TurndownButton)
		.find((node) => node.props.children === label)!;
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(useAuth).mockReturnValue({
		account: {
			userId: 'owner',
			contactEmail: 'reader@example.com',
			isEmailConfirmed: true,
		},
		signOut,
		sendPasswordResetEmail,
	} as unknown as ReturnType<typeof useAuth>);
	jest.mocked(useAccountProfile).mockReturnValue({
		name: 'Reader',
		loading: false,
		saving: false,
		error: null,
		saved: false,
		validationError: undefined,
		canSave: false,
		canReload: false,
		changeName: jest.fn(),
		reload: jest.fn(),
		save: jest.fn(),
	});
	act(() => {
		renderer = create(createElement(AccountScreen));
	});
});
afterEach(() => act(() => renderer.unmount()));
it('sends recovery to the authenticated email only after a deliberate press', async () => {
	expect(sendPasswordResetEmail).not.toHaveBeenCalled();
	await act(async () => button('Send recovery email').props.onPress());
	expect(sendPasswordResetEmail).toHaveBeenCalledWith('reader@example.com');
	expect(JSON.stringify(renderer.toJSON())).toContain('Recovery email sent');
	expect(button('Send recovery email').props.disabled).toBe(true);
});
it('shows a recoverable sign-out failure without raw provider errors', async () => {
	signOut.mockRejectedValue(new Error('internal auth failure'));
	await act(async () => button('Sign out').props.onPress());
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'We could not sign you out',
	);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'internal auth failure',
	);
	expect(button('Sign out').props.disabled).toBe(false);
});
it('does not expose a destructive action while deletion is unavailable', () => {
	expect(
		renderer.root
			.findAllByType(TurndownButton)
			.some((node) => node.props.children === 'Delete account'),
	).toBe(false);
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'Account deletion is not available',
	);
});
