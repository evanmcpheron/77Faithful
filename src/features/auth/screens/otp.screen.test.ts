import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { OtpScreen } from './otp.screen';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('react-native', () => ({ View: 'view' }));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/spacer/spacer.component', () => ({
	Spacer: () => null,
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer;
const retryAccountProfile = jest.fn();
const signOut = jest.fn();
const render = (isEmailConfirmed: boolean, profileError: Error | null) => {
	jest.mocked(useAuth).mockReturnValue({
		account: {
			userId: 'owner',
			contactEmail: 'reader@example.com',
			isEmailConfirmed,
		},
		isProfileReady: false,
		profileError,
		retryAccountProfile,
		signOut,
	} as unknown as IAuthContextValue);
	act(() => {
		renderer = create(createElement(OtpScreen));
	});
};
const button = (label: string) =>
	renderer.root.find(
		(node) => node.type === 'button' && node.props['children'] === label,
	);
beforeEach(() => jest.resetAllMocks());
afterEach(() => act(() => renderer.unmount()));
it('lets an unverified account retry a failed profile while still offering verification', () => {
	render(false, new Error('offline'));
	expect(button('I’ve confirmed my email')).toBeDefined();
	act(() => button('Try saving profile again').props['onPress']());
	expect(retryAccountProfile).toHaveBeenCalledTimes(1);
});
it('lets a verified account finish profile setup without asking for verification again', async () => {
	render(true, new Error('offline'));
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'Finish setting up your account',
	);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'I’ve confirmed my email',
	);
	expect(button('Try saving profile again')).toBeDefined();
	await act(async () => button('Sign out').props['onPress']());
	expect(signOut).toHaveBeenCalledTimes(1);
});
it('shows progress without another retry action while the profile is being prepared', () => {
	render(false, null);
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'Preparing your profile',
	);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'Try saving profile again',
	);
});
