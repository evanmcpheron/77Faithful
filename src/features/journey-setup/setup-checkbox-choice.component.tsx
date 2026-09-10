import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';
import { Pressable, View } from 'react-native';

export const SetupCheckboxChoice = ({
	label,
	checked,
	disabled,
	onChange,
}: {
	label: string;
	checked: boolean;
	disabled: boolean;
	onChange: (checked: boolean) => void;
}) => (
	<Pressable
		accessibilityRole='checkbox'
		accessibilityLabel={label}
		accessibilityState={{ checked, disabled }}
		disabled={disabled}
		onPress={() => onChange(!checked)}
		style={{
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: Spacing.Small,
			minHeight: 44,
			opacity: disabled ? 0.5 : 1,
		}}
	>
		<View
			pointerEvents='none'
			accessibilityElementsHidden
			importantForAccessibility='no-hide-descendants'
		>
			<Checkbox
				ignoreForm
				checked={checked}
			/>
		</View>
		<Typography style={{ flexShrink: 1 }}>{label}</Typography>
	</Pressable>
);
