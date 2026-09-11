import type { Preview } from '@storybook/react-native';

import { StyledStorybookCanvas } from './storybook.styles';

const preview: Preview = {
	decorators: [
		(Story) => (
			<StyledStorybookCanvas>
				<Story />
			</StyledStorybookCanvas>
		),
	],
	parameters: {
		controls: {
			expanded: true,
		},
	},
};

export default preview;
