import { Tabs } from '@td/components/layout/tabs/tabs.component';

import { LoginScreen } from './login.screen';
import { RegisterScreen } from './register.screen';

export const AuthScreen = () => {
	return (
		<Tabs>
			<Tabs.Item
				label='Login'
				testID='auth-login-tab'
			>
				<LoginScreen />
			</Tabs.Item>

			<Tabs.Item
				label='Register'
				testID='auth-register-tab'
			>
				<RegisterScreen />
			</Tabs.Item>
		</Tabs>
	);
};
