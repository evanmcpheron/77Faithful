import { Spacing } from '@td/theme/spacing';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: {
		gap: Spacing.Small,
	},
});
