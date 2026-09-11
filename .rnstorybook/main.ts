import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
	stories: [
		'../src/components/ui/**/*.stories.?(ts|tsx)',
		'../src/components/media/**/*.stories.?(ts|tsx)',
		'../src/features/properties/components/**/*.stories.?(ts|tsx)',
	],
	addons: [
		'@storybook/addon-ondevice-controls',
		'@storybook/addon-ondevice-actions',
	],
};

export default main;
